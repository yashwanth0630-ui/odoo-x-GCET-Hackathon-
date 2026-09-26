import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const doc = await prisma.operationDocument.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        sourceLocation: true,
        destinationLocation: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
    }

    if (doc.status === "DONE") {
      return NextResponse.json(
        { success: false, message: "This operation has already been validated and posted to the Stock Ledger." },
        { status: 400 }
      );
    }

    if (doc.status === "CANCELED") {
      return NextResponse.json(
        { success: false, message: "Cannot validate a canceled operation document." },
        { status: 400 }
      );
    }

    // Run the validation inside an atomic database transaction
    await prisma.$transaction(async (tx) => {
      // 1. RECEIPT (INCOMING GOODS)
      if (doc.type === "RECEIPT") {
        const destLocId = doc.destinationLocationId!;

        for (const item of doc.items) {
          // Increase stock in destination location
          await tx.stockLevel.upsert({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: destLocId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              productId: item.productId,
              locationId: destLocId,
              quantity: item.quantity,
            },
          });

          // Insert centralized Stock Ledger record
          await tx.stockMovement.create({
            data: {
              reference: doc.referenceNumber,
              documentId: doc.id,
              productId: item.productId,
              destinationLocationId: destLocId,
              quantity: item.quantity,
              type: "INCOMING",
              reason: `Receipt from ${doc.partnerName || "Supplier"} placed into ${doc.destinationLocation?.name}`,
              operatorId: user?.id || null,
            },
          });
        }
      }

      // 2. DELIVERY ORDER (OUTGOING GOODS)
      else if (doc.type === "DELIVERY") {
        const srcLocId = doc.sourceLocationId!;

        for (const item of doc.items) {
          // Check stock availability
          const currentStock = await tx.stockLevel.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: srcLocId,
              },
            },
          });

          if (!currentStock || currentStock.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for '${item.product.name}' at ${doc.sourceLocation?.name}. Available: ${
                currentStock?.quantity || 0
              }, Requested: ${item.quantity}`
            );
          }

          // Decrease stock in source location
          await tx.stockLevel.update({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: srcLocId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // Insert centralized Stock Ledger record
          await tx.stockMovement.create({
            data: {
              reference: doc.referenceNumber,
              documentId: doc.id,
              productId: item.productId,
              sourceLocationId: srcLocId,
              quantity: -item.quantity, // Negative indicating deduction
              type: "OUTGOING",
              reason: `Delivery to ${doc.partnerName || "Customer"} from ${doc.sourceLocation?.name}`,
              operatorId: user?.id || null,
            },
          });
        }
      }

      // 3. INTERNAL TRANSFER
      else if (doc.type === "INTERNAL_TRANSFER") {
        const srcLocId = doc.sourceLocationId!;
        const destLocId = doc.destinationLocationId!;

        for (const item of doc.items) {
          // Check source location availability
          const currentStock = await tx.stockLevel.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: srcLocId,
              },
            },
          });

          if (!currentStock || currentStock.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for '${item.product.name}' at source location ${doc.sourceLocation?.name}. Available: ${
                currentStock?.quantity || 0
              }, Requested: ${item.quantity}`
            );
          }

          // Deduct from source location
          await tx.stockLevel.update({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: srcLocId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // Add to destination location
          await tx.stockLevel.upsert({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: destLocId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              productId: item.productId,
              locationId: destLocId,
              quantity: item.quantity,
            },
          });

          // DUAL LEDGER ENTRIES:
          // Entry 1: Source Deduction (-item.quantity)
          await tx.stockMovement.create({
            data: {
              reference: `${doc.referenceNumber}-OUT`,
              documentId: doc.id,
              productId: item.productId,
              sourceLocationId: srcLocId,
              destinationLocationId: destLocId,
              quantity: -item.quantity,
              type: "INTERNAL",
              reason: `Internal transfer out from ${doc.sourceLocation?.name} to ${doc.destinationLocation?.name}`,
              operatorId: user?.id || null,
            },
          });

          // Entry 2: Destination Addition (+item.quantity)
          await tx.stockMovement.create({
            data: {
              reference: `${doc.referenceNumber}-IN`,
              documentId: doc.id,
              productId: item.productId,
              sourceLocationId: srcLocId,
              destinationLocationId: destLocId,
              quantity: item.quantity,
              type: "INTERNAL",
              reason: `Internal transfer into ${doc.destinationLocation?.name} from ${doc.sourceLocation?.name}`,
              operatorId: user?.id || null,
            },
          });
        }
      }

      // Mark document as DONE and set validated timestamp
      await tx.operationDocument.update({
        where: { id },
        data: {
          status: "DONE",
          validatedAt: new Date(),
        },
      });
    });

    await logAuthEvent("OPERATION_VALIDATED", user?.id, {
      referenceNumber: doc.referenceNumber,
      type: doc.type,
      itemCount: doc.items.length,
    });

    return NextResponse.json({
      success: true,
      message: `Operation ${doc.referenceNumber} successfully validated! Centralized Stock Ledger updated.`,
    });
  } catch (error: any) {
    console.error("Error validating operation document:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to validate operation document.",
      },
      { status: 400 }
    );
  }
}
