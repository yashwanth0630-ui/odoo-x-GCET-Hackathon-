import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // RECEIPT, DELIVERY, INTERNAL_TRANSFER, ADJUSTMENT
    const status = searchParams.get("status"); // DRAFT, WAITING, READY, DONE, CANCELED
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {};

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search } },
        { partnerName: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const documents = await prisma.operationDocument.findMany({
      where,
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
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Error fetching operations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load operation documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      type, // RECEIPT, DELIVERY, INTERNAL_TRANSFER
      partnerName,
      sourceLocationId,
      destinationLocationId,
      notes,
      items, // array of { productId, quantity }
    } = body;

    if (!type || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Operation type and at least one item are required." },
        { status: 400 }
      );
    }

    if (type === "RECEIPT" && !destinationLocationId) {
      return NextResponse.json(
        { success: false, message: "Destination location is required for incoming receipts." },
        { status: 400 }
      );
    }

    if (type === "DELIVERY" && !sourceLocationId) {
      return NextResponse.json(
        { success: false, message: "Source location is required for outgoing deliveries." },
        { status: 400 }
      );
    }

    if (type === "INTERNAL_TRANSFER" && (!sourceLocationId || !destinationLocationId)) {
      return NextResponse.json(
        { success: false, message: "Both source and destination locations are required for internal transfers." },
        { status: 400 }
      );
    }

    if (type === "INTERNAL_TRANSFER" && sourceLocationId === destinationLocationId) {
      return NextResponse.json(
        { success: false, message: "Source and destination locations cannot be identical." },
        { status: 400 }
      );
    }

    // Generate unique sequential reference number
    const prefix =
      type === "RECEIPT"
        ? "WH/IN"
        : type === "DELIVERY"
        ? "WH/OUT"
        : type === "INTERNAL_TRANSFER"
        ? "WH/INT"
        : "INV/ADJ";

    const count = await prisma.operationDocument.count({
      where: { type },
    });
    const referenceNumber = `${prefix}/${String(count + 1).padStart(4, "0")}`;

    const doc = await prisma.operationDocument.create({
      data: {
        referenceNumber,
        type,
        status: type === "DELIVERY" ? "WAITING" : "READY",
        partnerName: partnerName?.trim() || null,
        sourceLocationId: sourceLocationId || null,
        destinationLocationId: destinationLocationId || null,
        notes: notes?.trim() || null,
        createdById: user?.id || null,
        items: {
          create: items.map((it: any) => ({
            productId: it.productId,
            quantity: Number(it.quantity) || 1,
            picked: false,
            packed: false,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
      },
    });

    await logAuthEvent("OPERATION_DOCUMENT_CREATED", user?.id, {
      referenceNumber: doc.referenceNumber,
      type: doc.type,
    });

    return NextResponse.json({
      success: true,
      message: `Document ${doc.referenceNumber} created successfully.`,
      document: doc,
    });
  } catch (error) {
    console.error("Error creating operation document:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create operation document" },
      { status: 500 }
    );
  }
}
