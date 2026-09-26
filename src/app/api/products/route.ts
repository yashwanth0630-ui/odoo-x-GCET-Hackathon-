import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const lowStockOnly = searchParams.get("lowStock") === "true";

    // Build Prisma where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stockLevels: {
          include: {
            location: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format products and compute total stock across all locations
    const formatted = products.map((p) => {
      const totalStock = p.stockLevels.reduce((sum, s) => sum + s.quantity, 0);
      const isLowStock = totalStock <= p.minThreshold;
      const isCritical = totalStock === 0;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        description: p.description,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        categoryCode: p.category.code,
        uom: p.uom,
        minThreshold: p.minThreshold,
        idealStock: p.idealStock,
        initialStock: p.initialStock,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        totalStock,
        isLowStock,
        isCritical,
        stockLevels: p.stockLevels.map((sl) => ({
          id: sl.id,
          locationId: sl.locationId,
          locationName: sl.location.name,
          locationCode: sl.location.code,
          locationType: sl.location.type,
          warehouseId: sl.location.warehouse.id,
          warehouseName: sl.location.warehouse.name,
          warehouseCode: sl.location.warehouse.code,
          quantity: sl.quantity,
          updatedAt: sl.updatedAt,
        })),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    // Filter by low stock if requested
    const result = lowStockOnly ? formatted.filter((p) => p.isLowStock) : formatted;

    return NextResponse.json({
      success: true,
      products: result,
      totalCount: result.length,
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
    const body = await req.json();

    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      uom,
      minThreshold,
      idealStock,
      costPrice,
      sellingPrice,
      initialStock,
      initialLocationId,
    } = body;

    // Validation
    if (!name || !sku || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Name, SKU, and Category are required fields." },
        { status: 400 }
      );
    }

    const trimmedSku = sku.trim().toUpperCase();

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({
      where: { sku: trimmedSku },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Product with SKU '${trimmedSku}' already exists.` },
        { status: 409 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Selected category does not exist." },
        { status: 400 }
      );
    }

    const parsedMin = minThreshold !== undefined ? Number(minThreshold) : 10;
    const parsedIdeal = idealStock !== undefined ? Number(idealStock) : 50;
    const parsedInitial = initialStock !== undefined ? Number(initialStock) : 0;

    // Create product in database
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: name.trim(),
          sku: trimmedSku,
          barcode: barcode?.trim() || null,
          description: description?.trim() || null,
          categoryId,
          uom: uom || "Units",
          minThreshold: isNaN(parsedMin) ? 10 : parsedMin,
          idealStock: isNaN(parsedIdeal) ? 50 : parsedIdeal,
          initialStock: isNaN(parsedInitial) ? 0 : parsedInitial,
          costPrice: costPrice ? Number(costPrice) : null,
          sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        },
      });

      // If initial stock and a specific sub-location were provided, initialize StockLevel
      if (initialLocationId && parsedInitial > 0) {
        await tx.stockLevel.create({
          data: {
            productId: product.id,
            locationId: initialLocationId,
            quantity: parsedInitial,
          },
        });
      }

      return product;
    });

    // Audit log
    await logAuthEvent("PRODUCT_CREATED", user?.id, {
      productId: newProduct.id,
      sku: newProduct.sku,
      name: newProduct.name,
    });

    return NextResponse.json({
      success: true,
      message: `Product ${newProduct.name} (${newProduct.sku}) created successfully.`,
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while creating product." },
      { status: 500 }
    );
  }
}
