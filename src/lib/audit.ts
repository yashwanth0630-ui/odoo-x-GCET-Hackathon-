import prisma from "./prisma";

export async function logAuthEvent(
  action: string,
  userId?: string | null,
  details?: Record<string, unknown>,
  ipAddress?: string | null
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
