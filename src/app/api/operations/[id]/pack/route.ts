import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function POST(
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

    const { id } = await params;

    const document = await prisma.operationDocument.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Operation document not found." },
        { status: 404 }
      );
    }

    if (document.type !== "DELIVERY") {
      return NextResponse.json(
        { success: false, message: "Pack operation is only available for Delivery Orders." },
        { status: 400 }
      );
    }

    // Verify all items are picked first
    const unpickedItems = document.items.filter((item) => !item.picked);
    if (unpickedItems.length > 0) {
      return NextResponse.json(
        { success: false, message: "All items must be picked before packing. Pick items first." },
        { status: 400 }
      );
    }

    // Mark all items as packed
    await prisma.operationItem.updateMany({
      where: { documentId: id },
      data: { packed: true },
    });

    await logAuthEvent("ITEMS_PACKED", user.id, {
      documentId: id,
      referenceNumber: document.referenceNumber,
    });

    return NextResponse.json({
      success: true,
      message: `All items packed for ${document.referenceNumber}. Ready for validation and dispatch.`,
    });
  } catch (error) {
    console.error("Error packing items:", error);
    return NextResponse.json(
      { success: false, message: "Failed to pack items" },
      { status: 500 }
    );
  }
}
