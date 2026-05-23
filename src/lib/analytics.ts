import { Trade, Transaction, TradingAccount, TradeResult } from "@prisma/client";

export interface AnalyticsMetrics {
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  averageRR: number;
  maxDrawdown: number;
  currentDrawdown: number;
  currentStreak: number;
  winningStreak: number;
  losingStreak: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  equityGrowthPct: number;
  consistencyScore: number;
  weeklyCompoundGrowth: number;
  monthlyCompoundGrowth: number;
  expectedBalanceNextWeek: number;
  expectedWeeklyProfit: number;
  expectedBalanceNextMonth: number;
  expectedMonthlyProfit: number;
  expectedBalanceNextYear: number;
  currentBalance: number;
}

export function calculateAnalytics(
  account: TradingAccount,
  trades: Trade[],
  transactions: Transaction[]
): AnalyticsMetrics {
  const initialBalance = account.initialBalance;

  // 1. Basic Trade Counts
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.result === "WIN").length;
  const losingTrades = trades.filter((t) => t.result === "LOSS").length;
  const breakevenTrades = trades.filter((t) => t.result === "BREAKEVEN").length;

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // 2. Gross & Net Profit
  const grossProfit = trades
    .filter((t) => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = trades
    .filter((t) => t.pnl < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl), 0);
  const netProfit = grossProfit - grossLoss;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  // 3. Averages
  const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const averageRR = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? averageWin : 0;

  // 4. Streaks
  let currentStreak = 0;
  let winningStreak = 0;
  let losingStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  // Sort trades chronologically
  const sortedTrades = [...trades].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (let i = 0; i < sortedTrades.length; i++) {
    const t = sortedTrades[i];
    if (t.result === "WIN") {
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > winningStreak) winningStreak = tempWinStreak;
      currentStreak = tempWinStreak;
    } else if (t.result === "LOSS") {
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > losingStreak) losingStreak = tempLossStreak;
      currentStreak = -tempLossStreak;
    } else {
      // Breakeven resets streaks or leaves them alone? Usually resets.
      tempWinStreak = 0;
      tempLossStreak = 0;
      currentStreak = 0;
    }
  }

  // 5. Equity Curve & Drawdown
  // Start with initial balance, then apply deposits/withdrawals and trades in chronological order.
  // To be precise, we need a combined timeline.
  type TimelineEvent = 
    | { type: "TRADE"; date: Date; pnl: number }
    | { type: "TRANSACTION"; date: Date; amount: number; txType: string };

  const timeline: TimelineEvent[] = [
    ...sortedTrades.map(t => ({ type: "TRADE" as const, date: t.date, pnl: t.pnl })),
    ...transactions.map(tx => ({ 
      type: "TRANSACTION" as const, 
      date: tx.date, 
      amount: tx.amount, 
      txType: tx.type 
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let currentEquity = initialBalance;
  let peakEquity = initialBalance;
  let maxDrawdownPct = 0;

  for (const event of timeline) {
    if (event.type === "TRADE") {
      currentEquity += event.pnl;
    } else if (event.type === "TRANSACTION") {
      if (event.txType === "DEPOSIT") {
        currentEquity += event.amount;
        // Adjust peak equity to not count deposit as profit
        peakEquity += event.amount; 
      } else {
        currentEquity -= event.amount;
        // Adjust peak equity down so withdrawal isn't seen as drawdown
        peakEquity -= event.amount;
      }
    }

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }

    const drawdown = peakEquity - currentEquity;
    const drawdownPct = peakEquity > 0 ? (drawdown / peakEquity) * 100 : 0;
    
    if (drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
    }
  }

  // Determine actual current balance from initial + netProfit + deposits - withdrawals
  const totalDeposits = transactions.filter(t => t.type === "DEPOSIT").reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === "WITHDRAWAL").reduce((sum, t) => sum + t.amount, 0);
  const calculatedCurrentBalance = initialBalance + netProfit + totalDeposits - totalWithdrawals;

  const currentDrawdownVal = peakEquity - calculatedCurrentBalance;
  const currentDrawdownPct = peakEquity > 0 ? (currentDrawdownVal / peakEquity) * 100 : 0;

  // 6. Growth
  // We use initial + deposits as the baseline investment.
  const baselineInvestment = initialBalance + totalDeposits;
  const equityGrowthPct = baselineInvestment > 0 
    ? ((calculatedCurrentBalance - baselineInvestment) / baselineInvestment) * 100 
    : 0;

  // 7. Time-based metrics (Weekly/Monthly Compounding)
  const firstTradeDate = sortedTrades.length > 0 ? sortedTrades[0].date : new Date();
  const daysActive = Math.max(1, (new Date().getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksActive = Math.max(1, daysActive / 7);
  const monthsActive = Math.max(1, daysActive / 30.44);

  // Annualized or periodic compounding rate = (End/Start)^(1/periods) - 1
  const returnRatio = baselineInvestment > 0 ? calculatedCurrentBalance / baselineInvestment : 1;
  
  const weeklyCompoundGrowth = (Math.pow(Math.max(0, returnRatio), 1 / weeksActive) - 1) * 100;
  const monthlyCompoundGrowth = (Math.pow(Math.max(0, returnRatio), 1 / monthsActive) - 1) * 100;

  // 8. Consistency Score (0-100)
  // High consistency = tight standard deviation of returns, stable win rate, lower drawdown
  const drawdownPenalty = Math.min(40, maxDrawdownPct * 2);
  const winRatePenalty = Math.max(0, 50 - winRate);
  const pfPenalty = profitFactor >= 1.5 ? 0 : Math.max(0, (1.5 - profitFactor) * 20);
  
  let consistencyScore = 100 - drawdownPenalty - winRatePenalty - pfPenalty;
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));
  
  if (totalTrades === 0) {
    consistencyScore = 0;
  }

  // 9. Smart Future Projections (Mathematical compounding using consistency-smoothed return)
  const rawWeeklyReturn = weeklyCompoundGrowth / 100;
  
  // Volatility reduction: scale down projections if consistency is low
  // E.g., 50% consistency means we only project 50% of our historical average going forward
  const consistencyMultiplier = Math.max(0.1, consistencyScore / 100);
  
  // Further dampen if win rate is dangerous (< 40%)
  const winRateMultiplier = Math.min(1, winRate / 40);
  
  let effectiveWeeklyReturn = rawWeeklyReturn * consistencyMultiplier * winRateMultiplier;
  
  // Realistic growth cap: no more than 6% weekly projected growth regardless of past luck
  effectiveWeeklyReturn = Math.max(-0.15, Math.min(0.06, effectiveWeeklyReturn));

  const expectedBalanceNextWeek = calculatedCurrentBalance * (1 + effectiveWeeklyReturn);
  const expectedWeeklyProfit = expectedBalanceNextWeek - calculatedCurrentBalance;

  // Monthly uses 4 weeks of compounding
  const expectedBalanceNextMonth = calculatedCurrentBalance * Math.pow(1 + effectiveWeeklyReturn, 4);
  const expectedMonthlyProfit = expectedBalanceNextMonth - calculatedCurrentBalance;

  // Yearly uses 52 weeks
  const expectedBalanceNextYear = calculatedCurrentBalance * Math.pow(1 + effectiveWeeklyReturn, 52);

  return {
    winRate,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    profitFactor,
    averageWin,
    averageLoss,
    averageRR,
    maxDrawdown: maxDrawdownPct,
    currentDrawdown: currentDrawdownPct,
    currentStreak,
    winningStreak,
    losingStreak,
    grossProfit,
    grossLoss,
    netProfit,
    equityGrowthPct,
    consistencyScore,
    weeklyCompoundGrowth: isNaN(weeklyCompoundGrowth) ? 0 : weeklyCompoundGrowth,
    monthlyCompoundGrowth: isNaN(monthlyCompoundGrowth) ? 0 : monthlyCompoundGrowth,
    expectedBalanceNextWeek,
    expectedWeeklyProfit,
    expectedBalanceNextMonth,
    expectedMonthlyProfit,
    expectedBalanceNextYear,
    currentBalance: calculatedCurrentBalance
  };
}
