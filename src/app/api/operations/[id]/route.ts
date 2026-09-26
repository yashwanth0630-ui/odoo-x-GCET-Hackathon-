import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.operationDocument.findUnique({
      where: { id },
      include: {
        sourceLocation: {
          include: { warehouse: true },
        },
        destinationLocation: {
          include: { warehouse: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
        stockMovements: {
          include: {
            product: { select: { name: true, sku: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Operation document not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Error fetching operation document:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load operation document" },
      { status: 500 }
    );
  }
}
