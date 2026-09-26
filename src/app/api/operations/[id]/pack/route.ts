import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const doc = await prisma.operationDocument.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!doc) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
    }

    if (doc.status === "DONE" || doc.status === "CANCELED") {
      return NextResponse.json(
        { success: false, message: `Cannot modify a document with status ${doc.status}` },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.operationItem.updateMany({
        where: { documentId: id },
        data: { packed: true },
      }),
      prisma.operationDocument.update({
        where: { id },
        data: { status: "READY" }, // Ready for validation / dispatch
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "All items marked as Packed into shipping parcels.",
    });
  } catch (error) {
    console.error("Error packing items:", error);
    return NextResponse.json({ success: false, message: "Failed to pack items" }, { status: 500 });
  }
}
