import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPasswordResetOtp } from "@/lib/otp";
import { logAuthEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP code are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found or invalid request." },
        { status: 404 }
      );
    }

    const result = await verifyPasswordResetOtp(user.id, otp);

    if (!result.success) {
      await logAuthEvent("OTP_VERIFICATION_FAILED", user.id, { email: user.email, reason: result.message });
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    await logAuthEvent("OTP_VERIFICATION_SUCCESS", user.id, { email: user.email });

    return NextResponse.json({
      success: true,
      message: "OTP successfully verified. Please enter your new password.",
      otpRecordId: result.otpRecordId,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify OTP code." },
      { status: 500 }
    );
  }
}
