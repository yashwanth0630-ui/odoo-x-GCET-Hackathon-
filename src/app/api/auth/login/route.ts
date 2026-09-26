import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 2. Fetch User with Role
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        role: true,
      },
    });

    if (!user) {
      await logAuthEvent("LOGIN_FAILED_UNKNOWN_USER", null, { email: trimmedEmail }, ipAddress);
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Verify Account Status
    if (!user.isActive) {
      await logAuthEvent("LOGIN_BLOCKED_INACTIVE", user.id, { email: trimmedEmail }, ipAddress);
      return NextResponse.json(
        { success: false, message: "Your account has been deactivated. Please contact your Inventory Manager." },
        { status: 403 }
      );
    }

    // 4. Verify Password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAuthEvent("LOGIN_FAILED_BAD_PASSWORD", user.id, { email: trimmedEmail }, ipAddress);
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 5. Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6. Create Session & JWT
    const { token, expiresAt } = await createSession(
      user.id,
      user.email,
      user.name,
      user.role.name,
      user.role.id,
      userAgent,
      ipAddress
    );

    // 7. Audit log
    await logAuthEvent("LOGIN_SUCCESS", user.id, { role: user.role.name }, ipAddress);

    // 8. Set HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful. Redirecting to dashboard...",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleLabel: user.role.label,
        warehouseLocation: user.warehouseLocation,
        department: user.department,
      },
      redirectTo: "/dashboard",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: rememberMe ? expiresAt : undefined, // session cookie if not rememberMe, or 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
