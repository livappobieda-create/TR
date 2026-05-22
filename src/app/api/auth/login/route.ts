import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

// ─── PRIVATE SINGLE-USER SYSTEM ───────────────────────────────
// Only the one account matching ADMIN_EMAIL is authorized to log in.
// All other email attempts are rejected before any DB lookup.
const AUTHORIZED_EMAIL = (
  process.env.ADMIN_EMAIL || "journal@obieda.com"
).toLowerCase().trim();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // ── Allowlist check: reject any unauthorized email immediately ──
    if (email.toLowerCase().trim() !== AUTHORIZED_EMAIL) {
      // Uniform delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Verify against database ──
    const user = await prisma.user.findUnique({ where: { email: AUTHORIZED_EMAIL } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Create session ──
    const accounts = await prisma.tradingAccount.count({
      where: { userId: user.id },
    });

    const token = await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email },
      // First time ever → onboarding, otherwise → dashboard
      redirect: accounts > 0 ? "/dashboard" : "/onboarding",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
