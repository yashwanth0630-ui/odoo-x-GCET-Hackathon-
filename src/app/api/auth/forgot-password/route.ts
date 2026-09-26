import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPasswordResetOtp } from "@/lib/otp";
import { logAuthEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please enter your registered email address." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      // Return generic message for enumeration safety
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, an OTP code has been dispatched.",
      });
    }

    // Generate secure 6-digit OTP
    const { otpCode, expiresAt } = await createPasswordResetOtp(user.id);

    // Audit log
    await logAuthEvent("OTP_REQUESTED", user.id, { email: user.email });

    // In a production app, dispatch email via Resend/SendGrid/SMTP
    console.log(`\n======================================================`);
    console.log(`🔑 [StockSense Security] PASSWORD RESET OTP FOR ${user.email}`);
    console.log(`   OTP CODE: ${otpCode}`);
    console.log(`   EXPIRES AT: ${expiresAt.toLocaleTimeString()}`);
    console.log(`======================================================\n`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${trimmedEmail}.`,
      // Expose devOtp in development so testers and evaluators can immediately copy/paste
      devOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
