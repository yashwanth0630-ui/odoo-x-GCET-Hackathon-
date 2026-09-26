import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description,
        productCount: c._count.products,
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to create categories." },
        { status: 401 }
      );
    }

    if (user.role !== "INVENTORY_MANAGER") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only Inventory Managers can create categories." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: "Category name and code are required." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      category,
      message: "Category created successfully.",
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "A category with this name or code already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
