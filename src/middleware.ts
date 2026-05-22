import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ─── PRIVATE SINGLE-USER SYSTEM ───────────────────────────────
// Only /login is a valid unauthenticated path.
// /register is disabled — this is NOT a public platform.
const PUBLIC_PATHS = ["/login"];
const BLOCKED_PATHS = ["/register"]; // permanently redirect to /login

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "neon-trade-dev-secret-change-in-production"
);

async function getUserFromToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("neon-trade-session")?.value;

  // Block all registration attempts — disabled for private system
  if (BLOCKED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const user = token ? await getUserFromToken(token) : null;

  // Unauthenticated user trying to access protected route
  if (!user && !isPublic && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated user visiting login page → send to dashboard
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Root → redirect based on auth state
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/dashboard" : "/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
