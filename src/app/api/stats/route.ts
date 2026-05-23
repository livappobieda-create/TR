import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateAnalytics } from "@/lib/analytics";
import { computePhaseProgress } from "@/lib/stats";

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
    include: { 
      trades: { orderBy: { date: "asc" } },
      transactions: { orderBy: { date: "asc" } }
    },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Compute real statistics using the new engine
  const statistics = calculateAnalytics(account, account.trades, account.transactions);

  // Generate an Equity Curve purely from trades/transactions
  // We'll create a snapshot per day
  type TimelineEvent = 
    | { type: "TRADE"; date: Date; pnl: number }
    | { type: "TRANSACTION"; date: Date; amount: number; txType: string };

  const timeline: TimelineEvent[] = [
    ...account.trades.map(t => ({ type: "TRADE" as const, date: t.date, pnl: t.pnl })),
    ...account.transactions.map(tx => ({ 
      type: "TRANSACTION" as const, 
      date: tx.date, 
      amount: tx.amount, 
      txType: tx.type 
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let currentEquity = account.initialBalance;
  let dailySnapshots: Record<string, { balance: number, pnl: number }> = {};

  for (const event of timeline) {
    const dayStr = event.date.toISOString().substring(0, 10);
    
    if (event.type === "TRADE") {
      currentEquity += event.pnl;
      if (!dailySnapshots[dayStr]) dailySnapshots[dayStr] = { balance: currentEquity, pnl: 0 };
      dailySnapshots[dayStr].pnl += event.pnl;
      dailySnapshots[dayStr].balance = currentEquity;
    } else {
      if (event.txType === "DEPOSIT") {
        currentEquity += event.amount;
      } else {
        currentEquity -= event.amount;
      }
      if (!dailySnapshots[dayStr]) dailySnapshots[dayStr] = { balance: currentEquity, pnl: 0 };
      dailySnapshots[dayStr].balance = currentEquity;
    }
  }

  const equityCurve = Object.keys(dailySnapshots).sort().map(dateStr => ({
    date: dateStr,
    balance: dailySnapshots[dateStr].balance,
    pnl: dailySnapshots[dateStr].pnl,
  }));

  // Add initial starting point if no trades yet, or just prefix it
  if (equityCurve.length === 0 || equityCurve[0].date !== account.createdAt.toISOString().substring(0, 10)) {
    equityCurve.unshift({
      date: account.createdAt.toISOString().substring(0, 10),
      balance: account.initialBalance,
      pnl: 0
    });
  }

  let phaseProgress = null;
  if (account.isFunded && account.challengeSize) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayDrawdownPct = dailySnapshots[todayStr] && dailySnapshots[todayStr].pnl < 0
      ? Math.abs((dailySnapshots[todayStr].pnl / account.challengeSize) * 100)
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
      currentBalance: statistics.currentBalance,
      isFunded: account.isFunded,
      phase: account.phase,
    },
    equityCurve,
  });
}
