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

    const rawLimit = searchParams.get("limit");
    const isAll = rawLimit === "ALL";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = isAll ? 500 : Math.min(200, Math.max(1, Number(rawLimit) || 50));
    const skip = isAll ? 0 : (page - 1) * limit;

    const [movements, totalCount] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
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
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      movements,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("Error fetching stock ledger:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load stock ledger movements" },
      { status: 500 }
    );
  }
}
