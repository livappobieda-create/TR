/**
 * Registration is DISABLED.
 * This is a private single-user trading journal system.
 * Only one authorized account is permitted.
 * The authorized account is configured via .env (ADMIN_EMAIL / ADMIN_PASSWORD).
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Registration is disabled. This is a private system.",
      code: "REGISTRATION_DISABLED",
    },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Not found" },
    { status: 404 }
  );
}
