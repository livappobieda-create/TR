import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fix = searchParams.get("fix") === "true";

    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: session.userId },
      include: {
        trades: true,
        transactions: true,
        dailyEntries: true,
      },
    });

    const mismatches = [];

    for (const account of accounts) {
      // Recompute what the balance "should" be if we started from initialBalance and applied all events
      const allEvents = [
        ...account.trades.map((t) => ({ pnl: t.pnl, date: t.date })),
        ...account.dailyEntries.map((d) => ({ pnl: d.dailyPnl, date: d.date })),
      ];

      const netProfit = allEvents.reduce((sum, e) => sum + e.pnl, 0);
      const totalDeposits = account.transactions.filter(t => t.type === "DEPOSIT").reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawals = account.transactions.filter(t => t.type === "WITHDRAWAL").reduce((sum, t) => sum + t.amount, 0);
      
      const computedEquityFromInitial = account.initialBalance + netProfit + totalDeposits - totalWithdrawals;

      // If the account was created with a custom currentBalance that differs from initialBalance,
      // the base for computing the true currentBalance should actually be the *original* currentBalance snapshot.
      // But we don't have the "original currentBalance" stored separately from the live currentBalance.
      // However, if the current live balance is entirely out of sync with the mathematical reality, we log it.

      // Heuristic: If there are NO trades/transactions, but initial != current, it means they imported an existing snapshot.
      // If there ARE trades, the expected balance is the creation balance + profits.
      
      if (Math.abs(computedEquityFromInitial - account.currentBalance) > 0.01) {
        mismatches.push({
          accountId: account.id,
          name: account.name,
          storedCurrentBalance: account.currentBalance,
          computedFromInitial: computedEquityFromInitial,
          difference: account.currentBalance - computedEquityFromInitial,
          hasTrades: allEvents.length > 0,
        });

        if (fix && allEvents.length > 0) {
          // Careful: only auto-fix if we assume initialBalance was the true start of ALL historical data.
          // If the user wants to force fix, we update it.
          await prisma.tradingAccount.update({
            where: { id: account.id },
            data: { currentBalance: computedEquityFromInitial }
          });
        }
      }
    }

    return NextResponse.json({
      message: fix ? "Reconciliation executed." : "Reconciliation analysis completed.",
      mismatchesFound: mismatches.length,
      mismatches,
    });
  } catch (error) {
    console.error("[API/Reconcile] Error:", error);
    return NextResponse.json({ error: "Failed to run reconciliation" }, { status: 500 });
  }
}
