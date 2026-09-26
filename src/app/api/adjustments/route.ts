import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function GET() {
  try {
    const adjustments = await prisma.stockMovement.findMany({
      where: { type: "ADJUSTMENT" },
      include: {
        product: {
          include: { category: true },
        },
        sourceLocation: {
          include: { warehouse: true },
        },
        operator: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      adjustments,
    });
  } catch (error) {
    console.error("Error fetching adjustments:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load stock adjustments." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const { productId, locationId, countedQuantity, reason } = body;

    if (!productId || !locationId || countedQuantity === undefined) {
      return NextResponse.json(
        { success: false, message: "Product, Location, and Counted Quantity are required." },
        { status: 400 }
      );
    }

    const counted = Number(countedQuantity);
    if (isNaN(counted) || counted < 0) {
      return NextResponse.json(
        { success: false, message: "Counted quantity must be a non-negative number." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { warehouse: true },
    });

    if (!product || !location) {
      return NextResponse.json(
        { success: false, message: "Product or Location not found." },
        { status: 404 }
      );
    }

    // Get current recorded stock level
    const currentStockLevel = await prisma.stockLevel.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    const recordedQty = currentStockLevel ? currentStockLevel.quantity : 0;
    const difference = counted - recordedQty; // Positive = found extra, Negative = shrinkage/damaged

    // Run adjustment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update/Upsert stock level to the exact physical counted quantity
      const updatedStock = await tx.stockLevel.upsert({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        update: {
          quantity: counted,
        },
        create: {
          productId,
          locationId,
          quantity: counted,
        },
      });

      // 2. Generate reference number
      const adjCount = await tx.stockMovement.count({
        where: { type: "ADJUSTMENT" },
      });
      const reference = `INV/ADJ/${String(adjCount + 1).padStart(4, "0")}`;

      // 3. Create OperationDocument record
      const opDoc = await tx.operationDocument.create({
        data: {
          referenceNumber: reference,
          type: "ADJUSTMENT",
          status: "DONE",
          sourceLocationId: locationId,
          notes: reason?.trim() || `Physical cycle count: recorded ${recordedQty}, counted ${counted} (${difference >= 0 ? `+${difference}` : difference})`,
          createdById: user?.id || null,
          validatedAt: new Date(),
          items: {
            create: [
              {
                productId,
                quantity: Math.abs(difference),
                picked: true,
                packed: true,
              },
            ],
          },
        },
      });

      // 4. Log in centralized Stock Ledger
      const movement = await tx.stockMovement.create({
        data: {
          reference,
          documentId: opDoc.id,
          productId,
          sourceLocationId: locationId,
          quantity: difference, // Signed difference (+X or -X)
          type: "ADJUSTMENT",
          reason: reason?.trim() || `Counted: ${counted} (Difference: ${difference >= 0 ? `+${difference}` : difference})`,
          operatorId: user?.id || null,
        },
        include: {
          product: true,
          sourceLocation: { include: { warehouse: true } },
          operator: { select: { name: true } },
        },
      });

      return { updatedStock, movement, difference, recordedQty, counted, reference };
    });

    await logAuthEvent("STOCK_ADJUSTMENT_EXECUTED", user?.id, {
      reference: result.reference,
      product: product.name,
      location: location.name,
      difference: result.difference,
    });

    return NextResponse.json({
      success: true,
      message: `Stock adjusted for ${product.name}: ${difference >= 0 ? `+${difference}` : difference} ${product.uom}. New balance is ${counted} ${product.uom}.`,
      data: result,
    });
  } catch (error) {
    console.error("Error executing stock adjustment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to apply stock adjustment." },
      { status: 500 }
    );
  }
}
