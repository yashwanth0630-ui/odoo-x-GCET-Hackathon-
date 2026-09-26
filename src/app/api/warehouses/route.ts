import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          orderBy: { name: "asc" },
          include: {
            stockLevels: {
              include: {
                product: {
                  select: { name: true, sku: true, uom: true },
                },
              },
            },
          },
        },
        _count: {
          select: { locations: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      warehouses,
    });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load warehouses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    if (user.role !== "INVENTORY_MANAGER") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only Inventory Managers can manage warehouses." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, address, locations } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: "Warehouse name and code are required." },
        { status: 400 }
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address?.trim() || null,
        locations: locations?.length
          ? {
              create: locations.map((loc: { name: string; code: string; type?: string }) => ({
                name: loc.name.trim(),
                code: loc.code.trim().toUpperCase(),
                type: loc.type || "STORAGE",
              })),
            }
          : undefined,
      },
      include: {
        locations: true,
      },
    });

    await logAuthEvent("WAREHOUSE_CREATED", user.id, {
      warehouseId: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
    });

    return NextResponse.json({
      success: true,
      warehouse,
      message: `Warehouse "${warehouse.name}" created successfully.`,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "A warehouse with this name or code already exists." },
        { status: 409 }
      );
    }
    console.error("Error creating warehouse:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create warehouse" },
      { status: 500 }
    );
  }
}
