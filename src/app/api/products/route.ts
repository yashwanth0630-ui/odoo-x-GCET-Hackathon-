import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId");

    const where: any = {};

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stockLevels: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate total stock and enrich products with location and category info
    const enrichedProducts = products.map((p) => {
      const totalStock = p.stockLevels.reduce((acc, sl) => acc + sl.quantity, 0);
      return {
        ...p,
        categoryName: p.category?.name || "General",
        categoryCode: p.category?.code || "GEN",
        totalStock,
        isLowStock: totalStock <= p.minThreshold,
        isCritical: totalStock === 0,
        stockStatus:
          totalStock === 0
            ? "OUT_OF_STOCK"
            : totalStock <= p.minThreshold
            ? "LOW_STOCK"
            : "IN_STOCK",
        stockLevels: p.stockLevels.map((sl: any) => ({
          ...sl,
          locationName: sl.location?.name || "Location",
          locationCode: sl.location?.code || "",
          locationType: sl.location?.type || "STOCK",
          warehouseId: sl.location?.warehouseId || sl.location?.warehouse?.id || "",
          warehouseName: sl.location?.warehouse?.name || "Warehouse",
          warehouseCode: sl.location?.warehouse?.code || "",
        })),
      };
    });

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load products" },
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
        { success: false, message: "Forbidden: Only Inventory Managers can create products." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      uom,
      initialStock,
      minThreshold,
      idealStock,
      costPrice,
      sellingPrice,
    } = body;

    if (!name || !sku || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Product name, SKU, and category are required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode?.trim() || null,
        description: description?.trim() || null,
        categoryId,
        uom: uom || "Units",
        initialStock: Number(initialStock) || 0,
        minThreshold: Number(minThreshold) || 10,
        idealStock: Number(idealStock) || 50,
        costPrice: costPrice ? Number(costPrice) : null,
        sellingPrice: sellingPrice ? Number(sellingPrice) : null,
      },
      include: {
        category: true,
      },
    });

    await logAuthEvent("PRODUCT_CREATED", user.id, {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    });

    return NextResponse.json({
      success: true,
      product,
      message: `Product "${product.name}" (${product.sku}) created successfully.`,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "A product with this SKU already exists." },
        { status: 409 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create product" },
      { status: 500 }
    );
  }
}
