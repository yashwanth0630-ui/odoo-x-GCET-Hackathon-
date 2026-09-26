import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const totalStock = product.stockLevels.reduce((sum, s) => sum + s.quantity, 0);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        description: product.description,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        categoryCode: product.category.code,
        uom: product.uom,
        minThreshold: product.minThreshold,
        idealStock: product.idealStock,
        initialStock: product.initialStock,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        totalStock,
        isLowStock: totalStock <= product.minThreshold,
        stockLevels: product.stockLevels.map((sl) => ({
          id: sl.id,
          locationId: sl.locationId,
          locationName: sl.location.name,
          locationCode: sl.location.code,
          locationType: sl.location.type,
          warehouseId: sl.location.warehouse.id,
          warehouseName: sl.location.warehouse.name,
          warehouseCode: sl.location.warehouse.code,
          warehouseAddress: sl.location.warehouse.address,
          quantity: sl.quantity,
          updatedAt: sl.updatedAt,
        })),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve product" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
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
    } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    if (sku && sku !== existingProduct.sku) {
      const trimmedSku = sku.trim().toUpperCase();
      const duplicate = await prisma.product.findUnique({
        where: { sku: trimmedSku },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { success: false, message: `SKU '${trimmedSku}' is already in use by another product.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ? name.trim() : existingProduct.name,
        sku: sku ? sku.trim().toUpperCase() : existingProduct.sku,
        barcode: barcode !== undefined ? barcode?.trim() : existingProduct.barcode,
        description: description !== undefined ? description?.trim() : existingProduct.description,
        categoryId: categoryId || existingProduct.categoryId,
        uom: uom || existingProduct.uom,
        minThreshold: minThreshold !== undefined ? Number(minThreshold) : existingProduct.minThreshold,
        idealStock: idealStock !== undefined ? Number(idealStock) : existingProduct.idealStock,
        costPrice: costPrice !== undefined ? (costPrice ? Number(costPrice) : null) : existingProduct.costPrice,
        sellingPrice: sellingPrice !== undefined ? (sellingPrice ? Number(sellingPrice) : null) : existingProduct.sellingPrice,
      },
      include: {
        category: true,
      },
    });

    await logAuthEvent("PRODUCT_UPDATED", user?.id, {
      productId: updated.id,
      sku: updated.sku,
      name: updated.name,
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product: updated,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    await logAuthEvent("PRODUCT_DELETED", user?.id, {
      productId: id,
      sku: product.sku,
      name: product.name,
    });

    return NextResponse.json({
      success: true,
      message: `Product ${product.name} (${product.sku}) deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product." },
      { status: 500 }
    );
  }
}
