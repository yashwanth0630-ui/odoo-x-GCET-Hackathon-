import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id: productId } = await params;
    const body = await req.json();

    const { locationId, quantity, operation = "SET" } = body;

    if (!locationId || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: "Location and quantity are required." },
        { status: 400 }
      );
    }

    const qtyNumber = Number(quantity);
    if (isNaN(qtyNumber)) {
      return NextResponse.json(
        { success: false, message: "Quantity must be a valid number." },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { warehouse: true },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, message: "Location not found." },
        { status: 404 }
      );
    }

    const existingStock = await prisma.stockLevel.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    let newQuantity = qtyNumber;
    if (existingStock) {
      if (operation === "ADD") {
        newQuantity = existingStock.quantity + qtyNumber;
      } else if (operation === "SUBTRACT") {
        newQuantity = Math.max(0, existingStock.quantity - qtyNumber);
      }
    }

    const updatedStock = await prisma.stockLevel.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      update: {
        quantity: Math.max(0, newQuantity),
      },
      create: {
        productId,
        locationId,
        quantity: Math.max(0, newQuantity),
      },
      include: {
        location: {
          include: { warehouse: true },
        },
      },
    });

    await logAuthEvent("STOCK_LEVEL_ADJUSTED", user?.id, {
      productId,
      sku: product.sku,
      location: `${location.warehouse.name} > ${location.name}`,
      previousQty: existingStock?.quantity || 0,
      newQty: updatedStock.quantity,
      operation,
    });

    return NextResponse.json({
      success: true,
      message: `Stock for ${product.name} updated to ${updatedStock.quantity} units at ${location.name}.`,
      stockLevel: updatedStock,
    });
  } catch (error) {
    console.error("Error updating location stock:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update location stock." },
      { status: 500 }
    );
  }
}
