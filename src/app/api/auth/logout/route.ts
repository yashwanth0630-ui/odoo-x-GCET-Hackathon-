import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT, invalidateSession } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const payload = await verifyJWT(token);
      if (payload?.sessionId) {
        await invalidateSession(payload.sessionId);
      }
      if (payload?.userId) {
        await logAuthEvent("LOGOUT_SUCCESS", payload.userId);
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
      redirectTo: "/auth/login",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({
      success: true,
      message: "Logged out.",
      redirectTo: "/auth/login",
    });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
