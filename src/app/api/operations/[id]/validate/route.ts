import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const document = await prisma.operationDocument.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Operation document not found." },
        { status: 404 }
      );
    }

    if (document.status === "DONE") {
      return NextResponse.json(
        { success: false, message: "Document already validated." },
        { status: 400 }
      );
    }

    if (document.status === "CANCELED") {
      return NextResponse.json(
        { success: false, message: "Cannot validate a canceled document." },
        { status: 400 }
      );
    }

    // For deliveries, ensure items are picked and packed
    if (document.type === "DELIVERY") {
      const unpickedItems = document.items.filter((item) => !item.picked);
      const unpackedItems = document.items.filter((item) => !item.packed);

      if (unpickedItems.length > 0) {
        return NextResponse.json(
          { success: false, message: "All items must be picked before validation. Use the Pick action first." },
          { status: 400 }
        );
      }

      if (unpackedItems.length > 0) {
        return NextResponse.json(
          { success: false, message: "All items must be packed before validation. Use the Pack action first." },
          { status: 400 }
        );
      }
    }

    // Atomic transaction for stock movements
    const result = await prisma.$transaction(async (tx) => {
      const movements: any[] = [];

      for (const item of document.items) {
        if (document.type === "RECEIPT") {
          // INCOMING: Increase stock at destination location
          if (!document.destinationLocationId) {
            throw new Error("Destination location required for receipts.");
          }

          await tx.stockLevel.upsert({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: document.destinationLocationId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              productId: item.productId,
              locationId: document.destinationLocationId,
              quantity: item.quantity,
            },
          });

          const movement = await tx.stockMovement.create({
            data: {
              reference: document.referenceNumber,
              documentId: document.id,
              productId: item.productId,
              destinationLocationId: document.destinationLocationId,
              quantity: item.quantity,
              type: "INCOMING",
              reason: `Received ${item.quantity} ${item.product.uom} of ${item.product.name}`,
              operatorId: user.id,
            },
          });
          movements.push(movement);

        } else if (document.type === "DELIVERY") {
          // OUTGOING: Decrease stock at source location with underflow protection
          if (!document.sourceLocationId) {
            throw new Error("Source location required for deliveries.");
          }

          // Atomic underflow protection
          const currentStock = await tx.stockLevel.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: document.sourceLocationId,
              },
            },
          });

          const currentQty = currentStock?.quantity || 0;
          if (currentQty < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.product.name}": available ${currentQty} ${item.product.uom}, requested ${item.quantity} ${item.product.uom}.`
            );
          }

          await tx.stockLevel.update({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: document.sourceLocationId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          const movement = await tx.stockMovement.create({
            data: {
              reference: document.referenceNumber,
              documentId: document.id,
              productId: item.productId,
              sourceLocationId: document.sourceLocationId,
              quantity: -item.quantity,
              type: "OUTGOING",
              reason: `Delivered ${item.quantity} ${item.product.uom} of ${item.product.name}`,
              operatorId: user.id,
            },
          });
          movements.push(movement);

        } else if (document.type === "INTERNAL_TRANSFER") {
          // INTERNAL: Decrement source, increment destination
          if (!document.sourceLocationId || !document.destinationLocationId) {
            throw new Error("Both source and destination locations required for transfers.");
          }

          // Underflow protection at source
          const sourceStock = await tx.stockLevel.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: document.sourceLocationId,
              },
            },
          });

          const sourceQty = sourceStock?.quantity || 0;
          if (sourceQty < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.product.name}" at source: available ${sourceQty} ${item.product.uom}, requested ${item.quantity} ${item.product.uom}.`
            );
          }

          // Decrement source
          await tx.stockLevel.update({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: document.sourceLocationId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // Increment destination
          await tx.stockLevel.upsert({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: document.destinationLocationId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              productId: item.productId,
              locationId: document.destinationLocationId,
              quantity: item.quantity,
            },
          });

          const movement = await tx.stockMovement.create({
            data: {
              reference: document.referenceNumber,
              documentId: document.id,
              productId: item.productId,
              sourceLocationId: document.sourceLocationId,
              destinationLocationId: document.destinationLocationId,
              quantity: item.quantity,
              type: "INTERNAL",
              reason: `Transferred ${item.quantity} ${item.product.uom} of ${item.product.name}`,
              operatorId: user.id,
            },
          });
          movements.push(movement);
        }
      }

      // Mark document as DONE
      const updatedDoc = await tx.operationDocument.update({
        where: { id },
        data: {
          status: "DONE",
          validatedAt: new Date(),
        },
      });

      return { updatedDoc, movements };
    });

    await logAuthEvent("OPERATION_VALIDATED", user.id, {
      documentId: document.id,
      referenceNumber: document.referenceNumber,
      type: document.type,
      movementsCreated: result.movements.length,
    });

    return NextResponse.json({
      success: true,
      message: `${document.referenceNumber} validated successfully. ${result.movements.length} ledger entry(ies) created.`,
      document: result.updatedDoc,
      movements: result.movements,
    });
  } catch (error: any) {
    console.error("Error validating operation:", error);

    // Return user-friendly errors from underflow checks
    if (error.message?.includes("Insufficient stock") || error.message?.includes("required")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to validate operation document." },
      { status: 500 }
    );
  }
}
