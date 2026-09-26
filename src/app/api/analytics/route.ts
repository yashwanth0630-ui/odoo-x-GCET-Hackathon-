import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Products & Stock Calculations
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stockLevels: {
          include: {
            location: { include: { warehouse: true } },
          },
        },
      },
    });

    let totalUnitsInStock = 0;
    const lowStockItems: any[] = [];
    const outOfStockItems: any[] = [];

    products.forEach((p) => {
      const totalStock = p.stockLevels.reduce((acc, s) => acc + s.quantity, 0);
      totalUnitsInStock += totalStock;

      if (totalStock === 0) {
        outOfStockItems.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category.name,
          totalStock: 0,
          minThreshold: p.minThreshold,
          idealStock: p.idealStock,
          uom: p.uom,
        });
      } else if (totalStock <= p.minThreshold) {
        lowStockItems.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category.name,
          totalStock,
          minThreshold: p.minThreshold,
          idealStock: p.idealStock,
          uom: p.uom,
        });
      }
    });

    // 2. Pending Operations Counts
    const [pendingReceipts, pendingDeliveries, pendingTransfers] = await Promise.all([
      prisma.operationDocument.count({
        where: {
          type: "RECEIPT",
          status: { notIn: ["DONE", "CANCELED"] },
        },
      }),
      prisma.operationDocument.count({
        where: {
          type: "DELIVERY",
          status: { notIn: ["DONE", "CANCELED"] },
        },
      }),
      prisma.operationDocument.count({
        where: {
          type: "INTERNAL_TRANSFER",
          status: { notIn: ["DONE", "CANCELED"] },
        },
      }),
    ]);

    // 3. Recent Centralized Ledger Movements
    const recentMovements = await prisma.stockMovement.findMany({
      take: 8,
      include: {
        product: { select: { name: true, sku: true, uom: true } },
        sourceLocation: { select: { name: true, code: true } },
        destinationLocation: { select: { name: true, code: true } },
        operator: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Recent Documents
    const recentDocuments = await prisma.operationDocument.findMany({
      take: 8,
      include: {
        sourceLocation: { select: { name: true } },
        destinationLocation: { select: { name: true } },
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalProductsCatalog: products.length,
        totalUnitsInStock,
        lowStockCount: lowStockItems.length + outOfStockItems.length,
        outOfStockCount: outOfStockItems.length,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers,
      },
      lowStockAlerts: [...outOfStockItems, ...lowStockItems],
      recentMovements,
      recentDocuments,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard analytics." },
      { status: 500 }
    );
  }
}
