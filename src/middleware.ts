import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Use Node.js runtime — required for standalone output on Render
// Edge runtime has limitations with some jose operations in production
export const runtime = "nodejs";

const COOKIE_NAME = "neon-trade-session";

// Paths that are always public — no auth check at middleware level
// Note: API routes handle their own auth via getSession() in each handler
const PUBLIC_PATHS = [
  "/login",
  "/api/", // all API routes handle their own authentication
];

// Paths permanently disabled — redirect to login
const BLOCKED_PATHS = ["/register"];

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "neon-trade-dev-secret-change-in-production"
  );
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Always pass through Next.js internals & static assets ──
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".") // files with extensions (favicon.ico, images, etc.)
  ) {
    return NextResponse.next();
  }

  // ── 2. Block disabled paths ────────────────────────────────────
  if (BLOCKED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 3. Always allow public paths ───────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 4. Check auth token ────────────────────────────────────────
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  // ── 5. Redirect root based on auth state ───────────────────────
  if (pathname === "/") {
    const dest = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── 6. Unauthenticated → redirect to login ────────────────────
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 7. Authenticated user on /login → dashboard ───────────────
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude only Next.js build assets — everything else goes through middleware
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
