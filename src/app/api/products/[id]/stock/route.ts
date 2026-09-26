import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stockLevels = await prisma.stockLevel.findMany({
      where: { productId: id },
      include: {
        location: {
          include: { warehouse: true },
        },
      },
      orderBy: { quantity: "desc" },
    });

    const totalStock = stockLevels.reduce((acc, sl) => acc + sl.quantity, 0);

    return NextResponse.json({
      success: true,
      productId: id,
      totalStock,
      stockLevels: stockLevels.map((sl) => ({
        locationId: sl.locationId,
        locationName: sl.location.name,
        locationCode: sl.location.code,
        locationType: sl.location.type,
        warehouseName: sl.location.warehouse.name,
        warehouseCode: sl.location.warehouse.code,
        quantity: sl.quantity,
        updatedAt: sl.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching product stock levels:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load stock levels" },
      { status: 500 }
    );
  }
}
