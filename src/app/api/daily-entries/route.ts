import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeDailyMetrics } from "@/lib/stats";
import { dailyEntrySchema } from "@/lib/validations";
import { startOfDay } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = dailyEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { accountId, startBalance, endBalance, date: dateStr } = parsed.data;

    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: session.userId },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());
    const metrics = computeDailyMetrics(startBalance, endBalance);

    const entry = await prisma.dailyEntry.upsert({
      where: {
        accountId_date: { accountId, date },
      },
      create: {
        accountId,
        date,
        startBalance,
        endBalance,
        dailyPnl: metrics.dailyPnl,
        dailyPnlPct: metrics.dailyPnlPct,
        equityChange: metrics.equityChange,
      },
      update: {
        startBalance,
        endBalance,
        dailyPnl: metrics.dailyPnl,
        dailyPnlPct: metrics.dailyPnlPct,
        equityChange: metrics.equityChange,
      },
    });

    await prisma.tradingAccount.update({
      where: { id: accountId },
      data: { currentBalance: endBalance },
    });

    return NextResponse.json({ entry, metrics });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const account = await prisma.tradingAccount.findFirst({
    where: { id: accountId, userId: session.userId },
  });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.dailyEntry.findMany({
    where: { accountId },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ entries });
}
