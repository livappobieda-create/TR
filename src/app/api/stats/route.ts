import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeFullStatistics,
  computePhaseProgress,
  type DailyRecord,
} from "@/lib/stats";

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
    include: { dailyEntries: { orderBy: { date: "asc" } } },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const records: DailyRecord[] = account.dailyEntries.map((e) => ({
    date: e.date,
    startBalance: e.startBalance,
    endBalance: e.endBalance,
    dailyPnl: e.dailyPnl,
    dailyPnlPct: e.dailyPnlPct,
  }));

  const statistics = computeFullStatistics(
    records,
    account.initialBalance,
    account.currentBalance
  );

  let phaseProgress = null;
  if (account.isFunded && account.challengeSize) {
    const todayEntry = account.dailyEntries[account.dailyEntries.length - 1];
    const todayDrawdownPct =
      todayEntry && todayEntry.dailyPnl < 0
        ? Math.abs((todayEntry.dailyPnl / account.challengeSize) * 100)
        : 0;

    phaseProgress = computePhaseProgress({
      phase: account.phase,
      challengeSize: account.challengeSize,
      profitTarget: account.profitTarget ?? 0,
      currentProfitProgress: account.currentProfitProgress,
      dailyDrawdownLimit: account.dailyDrawdownLimit ?? 0,
      maxDrawdownLimit: account.maxDrawdownLimit ?? 0,
      currentDrawdown: account.currentDrawdown,
      todayDrawdownPct,
      phaseDaysRemaining: account.phaseDaysRemaining,
    });
  }

  return NextResponse.json({
    statistics,
    phaseProgress,
    account: {
      id: account.id,
      name: account.name,
      initialBalance: account.initialBalance,
      currentBalance: account.currentBalance,
      isFunded: account.isFunded,
      phase: account.phase,
    },
    equityCurve: account.dailyEntries.map((e) => ({
      date: e.date.toISOString(),
      balance: e.endBalance,
      pnl: e.dailyPnl,
      pnlPct: e.dailyPnlPct,
    })),
  });
}
