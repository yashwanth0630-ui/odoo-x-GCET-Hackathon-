import crypto from "crypto";
import prisma from "./prisma";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Hash an OTP code with SHA-256 for secure DB storage
 */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Create and persist a new OTP for a user
 */
export async function createPasswordResetOtp(userId: string): Promise<{
  otpCode: string;
  expiresAt: Date;
}> {
  // Invalidate any existing unused OTPs for this user
  await prisma.passwordResetOtp.updateMany({
    where: {
      userId,
      used: false,
    },
    data: {
      used: true,
    },
  });

  const otpCode = generateOtpCode();
  const otpHash = hashOtp(otpCode);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetOtp.create({
    data: {
      userId,
      otpHash,
      expiresAt,
      used: false,
      attempts: 0,
    },
  });

  return { otpCode, expiresAt };
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  otpRecordId?: string;
}

/**
 * Verify a provided 6-digit OTP code for a user
 */
export async function verifyPasswordResetOtp(
  userId: string,
  providedCode: string
): Promise<VerifyOtpResult> {
  const latestOtp = await prisma.passwordResetOtp.findFirst({
    where: {
      userId,
      used: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestOtp) {
    return {
      success: false,
      message: "No active password reset request found. Please request a new OTP.",
    };
  }

  // Check expiration
  if (new Date() > latestOtp.expiresAt) {
    await prisma.passwordResetOtp.update({
      where: { id: latestOtp.id },
      data: { used: true },
    });
    return {
      success: false,
      message: "OTP has expired. Please request a new one.",
    };
  }

  // Check rate limit / brute-force protection
  if (latestOtp.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.passwordResetOtp.update({
      where: { id: latestOtp.id },
      data: { used: true },
    });
    return {
      success: false,
      message: "Too many incorrect attempts. For security, this OTP is now invalid. Please request a new code.",
    };
  }

  const providedHash = hashOtp(providedCode);

  if (providedHash !== latestOtp.otpHash) {
    // Increment attempts
    await prisma.passwordResetOtp.update({
      where: { id: latestOtp.id },
      data: { attempts: latestOtp.attempts + 1 },
    });

    const remaining = MAX_OTP_ATTEMPTS - (latestOtp.attempts + 1);
    return {
      success: false,
      message: `Invalid OTP code. ${remaining} attempt(s) remaining.`,
    };
  }

  return {
    success: true,
    message: "OTP successfully verified.",
    otpRecordId: latestOtp.id,
  };
}

/**
 * Mark an OTP as completed/used after successful password reset
 */
export async function markOtpAsUsed(otpRecordId: string): Promise<void> {
  await prisma.passwordResetOtp.update({
    where: { id: otpRecordId },
    data: { used: true },
  });
}
