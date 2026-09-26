import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            _count: {
              select: { stockLevels: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, warehouses });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load warehouse configurations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const { action, warehouseName, warehouseCode, address, locationName, locationCode, locationType, warehouseId } = body;

    // Action 1: Create Warehouse
    if (action === "CREATE_WAREHOUSE") {
      if (!warehouseName || !warehouseCode) {
        return NextResponse.json(
          { success: false, message: "Warehouse name and code are required." },
          { status: 400 }
        );
      }

      const wh = await prisma.warehouse.create({
        data: {
          name: warehouseName.trim(),
          code: warehouseCode.trim().toUpperCase(),
          address: address?.trim() || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Warehouse ${wh.name} (${wh.code}) created successfully.`,
        warehouse: wh,
      });
    }

    // Action 2: Create Sub-Location
    if (action === "CREATE_LOCATION") {
      if (!locationName || !locationCode || !warehouseId) {
        return NextResponse.json(
          { success: false, message: "Location name, code, and parent warehouse are required." },
          { status: 400 }
        );
      }

      const loc = await prisma.location.create({
        data: {
          name: locationName.trim(),
          code: locationCode.trim().toUpperCase(),
          type: locationType || "STORAGE",
          warehouseId,
        },
        include: { warehouse: true },
      });

      return NextResponse.json({
        success: true,
        message: `Sub-location ${loc.name} created under ${loc.warehouse.name}.`,
        location: loc,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Warehouse config error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "A warehouse or location code with this value already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to save configuration." },
      { status: 500 }
    );
  }
}
