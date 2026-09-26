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
              include: {
                category: true,
                stockLevels: {
                  include: { location: { include: { warehouse: true } } },
                },
              },
            },
          },
        },
        stockMovements: {
          include: {
            product: true,
            sourceLocation: true,
            destinationLocation: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Error retrieving operation document:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve document" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to delete operational documents." },
        { status: 401 }
      );
    }

    if (user.role !== "INVENTORY_MANAGER") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only Inventory Managers can delete operational documents." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const document = await prisma.operationDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    if (document.status === "DONE") {
      return NextResponse.json(
        { success: false, message: "Cannot delete a validated/completed operation document." },
        { status: 400 }
      );
    }

    await prisma.operationDocument.delete({
      where: { id },
    });

    await logAuthEvent("OPERATION_DOCUMENT_DELETED", user.id, {
      documentId: id,
      referenceNumber: document.referenceNumber,
      type: document.type,
    });

    return NextResponse.json({
      success: true,
      message: `Document ${document.referenceNumber} deleted.`,
    });
  } catch (error) {
    console.error("Error deleting operation document:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete operation document" },
      { status: 500 }
    );
  }
}
