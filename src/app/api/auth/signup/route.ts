import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role: roleName, department, warehouseLocation } = body;

    // 1. Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 3. Resolve Role
    const targetRoleName = roleName || "WAREHOUSE_STAFF";
    const roleRecord = await prisma.role.findUnique({
      where: { name: targetRoleName },
    });

    if (!roleRecord) {
      return NextResponse.json(
        { success: false, message: `Invalid role selected: ${targetRoleName}` },
        { status: 400 }
      );
    }

    // 4. Create User
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        roleId: roleRecord.id,
        department: department?.trim() || null,
        warehouseLocation: warehouseLocation?.trim() || null,
        isActive: true,
        lastLoginAt: new Date(),
      },
      include: {
        role: true,
      },
    });

    // 5. Create Session & JWT
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;

    const { token, expiresAt } = await createSession(
      user.id,
      user.email,
      user.name,
      user.role.name,
      user.role.id,
      userAgent,
      ipAddress
    );

    // 6. Audit Trail
    await logAuthEvent(
      "USER_REGISTERED",
      user.id,
      { role: user.role.name, email: user.email },
      ipAddress
    );

    // 7. Set HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      message: "Registration successful! Welcome to StockSense.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleLabel: user.role.label,
        warehouseLocation: user.warehouseLocation,
      },
      redirectTo: "/dashboard",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
