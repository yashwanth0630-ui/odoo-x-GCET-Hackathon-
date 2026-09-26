import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim() || "";
    const productId = searchParams.get("productId");

    const where: any = {};

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (productId && productId !== "ALL") {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { reason: { contains: search } },
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          include: { category: true },
        },
        sourceLocation: {
          include: { warehouse: true },
        },
        destinationLocation: {
          include: { warehouse: true },
        },
        operator: {
          select: { name: true, email: true },
        },
        document: {
          select: { referenceNumber: true, type: true, partnerName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      movements,
      totalCount: movements.length,
    });
  } catch (error) {
    console.error("Error fetching stock ledger:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load stock ledger movements" },
      { status: 500 }
    );
  }
}
