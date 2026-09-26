import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const totalStock = product.stockLevels.reduce((acc, sl) => acc + sl.quantity, 0);

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        totalStock,
        stockStatus:
          totalStock === 0
            ? "OUT_OF_STOCK"
            : totalStock <= product.minThreshold
            ? "LOW_STOCK"
            : "IN_STOCK",
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, message: "Forbidden: Only Inventory Managers can update products." },
        { status: 403 }
      );
    }

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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(sku && { sku: sku.trim().toUpperCase() }),
        ...(barcode !== undefined && { barcode: barcode?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(categoryId && { categoryId }),
        ...(uom && { uom }),
        ...(minThreshold !== undefined && { minThreshold: Number(minThreshold) }),
        ...(idealStock !== undefined && { idealStock: Number(idealStock) }),
        ...(costPrice !== undefined && { costPrice: costPrice ? Number(costPrice) : null }),
        ...(sellingPrice !== undefined && {
          sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        }),
      },
      include: {
        category: true,
      },
    });

    await logAuthEvent("PRODUCT_UPDATED", user.id, {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    });

    return NextResponse.json({
      success: true,
      product,
      message: `Product "${product.name}" updated successfully.`,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "A product with this SKU already exists." },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, message: "Forbidden: Only Inventory Managers can delete products." },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    await logAuthEvent("PRODUCT_DELETED", user.id, { productId: id });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error: any) {
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete this product because it has related operation history or stock movements. Archive it instead.",
        },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
