import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        label: true,
        description: true,
        permissions: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const parsedRoles = roles.map((r) => ({
      ...r,
      permissions: JSON.parse(r.permissions || "[]"),
    }));

    return NextResponse.json({ success: true, roles: parsedRoles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load system roles" },
      { status: 500 }
    );
  }
}
