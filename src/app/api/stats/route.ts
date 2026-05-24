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
      transactions: { orderBy: { date: "asc" } },
      dailyEntries: { orderBy: { date: "asc" } }
    },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Compute real statistics using the new engine
  const statistics = calculateAnalytics(account, account.trades, account.transactions, account.dailyEntries);

  console.log("----- ANALYTICS DEBUG PIPELINE -----");
  console.log(`Account ID: ${account.id} | Total Trades in DB: ${account.trades?.length || 0}`);
  console.log("Calculated Statistics Keys:");
  console.log(Object.keys(statistics));
  console.log("Calculated Statistics Payload:");
  console.log(JSON.stringify({
    totalTrades: statistics.totalTrades,
    winningTrades: statistics.winningTrades,
    losingTrades: statistics.losingTrades,
    winRate: statistics.winRate,
    profitFactor: statistics.profitFactor,
    grossProfit: statistics.grossProfit,
    grossLoss: statistics.grossLoss,
    netProfit: statistics.netProfit
  }, null, 2));
  console.log("------------------------------------");

  // Generate an Equity Curve purely from daily grouped PnL and transactions
  // This matches the anti-double counting logic from the analytics engine
  const dailySnapshots: Record<string, { balance: number, pnl: number }> = {};
  
  // Trades have priority
  for (const t of account.trades) {
    const dayStr = t.date.toISOString().substring(0, 10);
    if (!dailySnapshots[dayStr]) dailySnapshots[dayStr] = { balance: 0, pnl: 0 };
    dailySnapshots[dayStr].pnl += t.pnl;
  }
  
  // Fallback to daily entries
  for (const d of account.dailyEntries) {
    const dayStr = d.date.toISOString().substring(0, 10);
    if (dailySnapshots[dayStr] === undefined || dailySnapshots[dayStr].pnl === 0) {
      if (!dailySnapshots[dayStr]) dailySnapshots[dayStr] = { balance: 0, pnl: 0 };
      dailySnapshots[dayStr].pnl = d.dailyPnl;
    }
  }

  type TimelineEvent = 
    | { type: "PNL"; date: Date; amount: number }
    | { type: "TRANSACTION"; date: Date; amount: number; txType: string };

  const timeline: TimelineEvent[] = [];
  
  for (const [dayStr, data] of Object.entries(dailySnapshots)) {
    timeline.push({ type: "PNL", date: new Date(dayStr + "T12:00:00Z"), amount: data.pnl });
  }
  
  for (const tx of account.transactions) {
    timeline.push({ type: "TRANSACTION", date: tx.date, amount: tx.amount, txType: tx.type });
  }
  
  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  let currentEquity = account.initialBalance;

  for (const event of timeline) {
    const dayStr = event.date.toISOString().substring(0, 10);
    
    if (event.type === "PNL") {
      currentEquity += event.amount;
      if (!dailySnapshots[dayStr]) dailySnapshots[dayStr] = { balance: currentEquity, pnl: event.amount };
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

  const equityCurve = Object.keys(dailySnapshots).sort().map(dateStr => {
    const pnl = dailySnapshots[dateStr].pnl;
    const balance = dailySnapshots[dateStr].balance;
    const prevBalance = balance - pnl;
    const pnlPct = prevBalance > 0 ? (pnl / prevBalance) * 100 : 0;
    return {
      date: dateStr,
      balance,
      pnl,
      pnlPct,
    };
  });

  // Add initial starting point if no trades yet, or just prefix it
  if (equityCurve.length === 0 || equityCurve[0].date !== account.createdAt.toISOString().substring(0, 10)) {
    equityCurve.unshift({
      date: account.createdAt.toISOString().substring(0, 10),
      balance: account.initialBalance,
      pnl: 0,
      pnlPct: 0,
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
