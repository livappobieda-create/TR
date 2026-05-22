import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    console.log(`[Middleware] Processing request for: ${pathname}`);

    // TEMPORARY DEBUG: Allow ALL routes without authentication
    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] CRITICAL ERROR:", error);
    // Attempt to pass through even if middleware fails
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

