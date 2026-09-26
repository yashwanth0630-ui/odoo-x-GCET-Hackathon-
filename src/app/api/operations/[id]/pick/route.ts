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
        { success: false, message: "Pick operation is only available for Delivery Orders." },
        { status: 400 }
      );
    }

    if (document.status !== "WAITING" && document.status !== "READY") {
      return NextResponse.json(
        { success: false, message: `Cannot pick items: document status is "${document.status}".` },
        { status: 400 }
      );
    }

    // Mark all items as picked
    await prisma.operationItem.updateMany({
      where: { documentId: id },
      data: { picked: true },
    });

    // Advance status from WAITING -> READY
    if (document.status === "WAITING") {
      await prisma.operationDocument.update({
        where: { id },
        data: { status: "READY" },
      });
    }

    await logAuthEvent("ITEMS_PICKED", user.id, {
      documentId: id,
      referenceNumber: document.referenceNumber,
    });

    return NextResponse.json({
      success: true,
      message: `All items picked for ${document.referenceNumber}. Ready for packing.`,
    });
  } catch (error) {
    console.error("Error picking items:", error);
    return NextResponse.json(
      { success: false, message: "Failed to pick items" },
      { status: 500 }
    );
  }
}
