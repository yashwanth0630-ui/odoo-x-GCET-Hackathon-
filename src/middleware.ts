import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "stocksense_session";
const JWT_SECRET = process.env.JWT_SECRET || "stocksense_jwt_secret_dev_32_bytes_super_secure_key_2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function isValidToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return !!payload?.userId;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasValidSession = token ? await isValidToken(token) : false;

  // Protected routes: /dashboard, /products, /operations, /settings and subroutes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/operations") ||
    pathname.startsWith("/settings")
  ) {
    if (!hasValidSession) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth pages: If already logged in, redirect straight to /dashboard
  if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup")) {
    if (hasValidSession) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/operations/:path*",
    "/settings/:path*",
    "/auth/login",
    "/auth/signup",
  ],
};
