import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "./prisma";

export const SESSION_COOKIE_NAME = "stocksense_session";
const JWT_SECRET = process.env.JWT_SECRET || "stocksense_jwt_secret_dev_32_bytes_super_secure_key_2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  roleId: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Hash a plain-text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token using jose (Edge & Node compatible)
 */
export async function signJWT(payload: JWTPayload, expiresIn: string = "7d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Create a session in DB and return JWT token
 */
export async function createSession(
  userId: string,
  email: string,
  name: string,
  role: string,
  roleId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  // Session valid for 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Generate unique session record token
  const sessionToken = crypto.randomUUID();

  const session = await prisma.session.create({
    data: {
      userId,
      token: sessionToken,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });

  // Create signed JWT containing payload and session ID
  const jwt = await signJWT({
    userId,
    email,
    name,
    role,
    roleId,
    sessionId: session.id,
  });

  return { token: jwt, expiresAt };
}

/**
 * Invalidate a session by token or session ID
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  } catch (e) {
    // Ignore if already deleted
  }
}

/**
 * Invalidate all sessions for a user (e.g. after password reset)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Helper to get the current authenticated user on server-side
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      roleLabel: user.role.label,
      permissions: JSON.parse(user.role.permissions || "[]"),
      department: user.department,
      warehouseLocation: user.warehouseLocation,
      createdAt: user.createdAt,
    };
  } catch (error) {
    return null;
  }
}
