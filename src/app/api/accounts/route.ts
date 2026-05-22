import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accountSetupSchema } from "@/lib/validations";
import type { AccountPhase, AccountType } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.userId, isActive: true },
    include: {
      dailyEntries: { orderBy: { date: "asc" } },
      _count: { select: { dailyEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = accountSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const account = await prisma.tradingAccount.create({
      data: {
        userId: session.userId,
        name: d.name,
        initialBalance: d.initialBalance,
        currentBalance: d.currentBalance,
        accountType: d.accountType as AccountType,
        isFunded: d.isFunded,
        propFirmName: d.isFunded ? d.propFirmName : null,
        challengeSize: d.isFunded ? d.challengeSize : null,
        profitTarget: d.isFunded ? d.profitTarget : null,
        dailyDrawdownLimit: d.isFunded ? d.dailyDrawdownLimit : null,
        maxDrawdownLimit: d.isFunded ? d.maxDrawdownLimit : null,
        currentDrawdown: d.isFunded ? (d.currentDrawdown ?? 0) : 0,
        currentProfitProgress: d.isFunded ? (d.currentProfitProgress ?? 0) : 0,
        phase: (d.phase ?? "CHALLENGE_PHASE_1") as AccountPhase,
        phaseDaysRemaining: d.phaseDaysRemaining ?? 30,
      },
    });

    return NextResponse.json({ account });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
