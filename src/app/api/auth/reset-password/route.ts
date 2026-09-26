import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, invalidateAllUserSessions } from "@/lib/auth";
import { verifyPasswordResetOtp, markOtpAsUsed } from "@/lib/otp";
import { logAuthEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    // 1. Validation
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    // 2. Re-verify OTP validity
    const verification = await verifyPasswordResetOtp(user.id, otp);
    if (!verification.success || !verification.otpRecordId) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    // 3. Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // 4. Update user, mark OTP used, revoke active sessions
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetOtp.update({
        where: { id: verification.otpRecordId },
        data: { used: true },
      }),
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    // 5. Audit log
    await logAuthEvent("PASSWORD_RESET_SUCCESS", user.id, { email: user.email });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
      redirectTo: "/auth/login",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
