import { Trade, Transaction, TradingAccount, DailyEntry } from "@prisma/client";

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
  dailyProfitPct: number;
  weeklyProfitPct: number;
  monthlyProfitPct: number;
  totalPnl: number;
  
  // New Daily Metrics
  profitableDaysPct: number;
  averageDailyGain: number;
  averageDailyLoss: number;
}

export function calculateAnalytics(
  account: TradingAccount,
  trades: Trade[],
  transactions: Transaction[],
  dailyEntries: DailyEntry[] = []
): AnalyticsMetrics {
  const baseBalance = account.initialBalance;

  // 1. Trade-Level Metrics (Exclusively from Trades table)
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.result === "WIN").length;
  const losingTrades = trades.filter((t) => t.result === "LOSS").length;
  const breakevenTrades = trades.filter((t) => t.result === "BREAKEVEN").length;

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const grossProfit = trades
    .filter((t) => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = trades
    .filter((t) => t.pnl < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl), 0);
  
  // Notice we use the strict Trade-based netProfit for pure trading stats.
  // We will calculate a separate global netProfit below for the balance.
  const tradeNetProfit = grossProfit - grossLoss;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const averageRR = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? averageWin : 0;

  // Streaks (Exclusively from Trades)
  let currentStreak = 0;
  let winningStreak = 0;
  let losingStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

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
      tempWinStreak = 0;
      tempLossStreak = 0;
      currentStreak = 0;
    }
  }

  // 2. Daily Timeline & Equity Curve
  // Priority: 1. Sum of Trades for a day. 2. Manual DailyEntry.
  const dailySnapshots: Record<string, number> = {};
  
  // Aggregate Trades per day
  for (const t of trades) {
    const dayStr = t.date.toISOString().substring(0, 10);
    dailySnapshots[dayStr] = (dailySnapshots[dayStr] || 0) + t.pnl;
  }
  
  // Fallback to DailyEntries if no trades exist for that day
  for (const d of dailyEntries) {
    const dayStr = d.date.toISOString().substring(0, 10);
    if (dailySnapshots[dayStr] === undefined) {
      dailySnapshots[dayStr] = d.dailyPnl;
    }
  }

  // Calculate Daily Stats
  const activeDays = Object.values(dailySnapshots);
  const totalDays = activeDays.length;
  const profitableDays = activeDays.filter(pnl => pnl > 0).length;
  const profitableDaysPct = totalDays > 0 ? (profitableDays / totalDays) * 100 : 0;
  
  const dailyGains = activeDays.filter(pnl => pnl > 0);
  const dailyLosses = activeDays.filter(pnl => pnl < 0);
  const averageDailyGain = dailyGains.length > 0 ? dailyGains.reduce((a,b)=>a+b, 0) / dailyGains.length : 0;
  const averageDailyLoss = dailyLosses.length > 0 ? Math.abs(dailyLosses.reduce((a,b)=>a+b, 0)) / dailyLosses.length : 0;

  // Build Chronological Timeline for Equity & Drawdown
  // Note: We need the exact dates for accurate chronological math alongside transactions.
  type TimelineEvent = 
    | { type: "PNL"; date: Date; amount: number }
    | { type: "TRANSACTION"; date: Date; amount: number; txType: string };

  const timelineEvents: TimelineEvent[] = [];
  
  for (const [dayStr, pnl] of Object.entries(dailySnapshots)) {
    // We assign it to noon UTC to ensure consistent day ordering
    const d = new Date(dayStr + "T12:00:00Z");
    timelineEvents.push({ type: "PNL", date: d, amount: pnl });
  }
  
  for (const tx of transactions) {
    timelineEvents.push({ type: "TRANSACTION", date: tx.date, amount: tx.amount, txType: tx.type });
  }
  
  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 3. Equity Curve & Drawdown Calculation
  let currentEquity = baseBalance;
  let peakEquity = baseBalance;
  let maxDrawdownPct = 0;
  let totalTimelinePnl = 0; // Total net profit from all valid days

  for (const event of timelineEvents) {
    if (event.type === "PNL") {
      currentEquity += event.amount;
      totalTimelinePnl += event.amount;
    } else if (event.type === "TRANSACTION") {
      if (event.txType === "DEPOSIT") {
        currentEquity += event.amount;
        peakEquity += event.amount; 
      } else {
        currentEquity -= event.amount;
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

  // 4. Final Balance & Current Drawdown
  const totalDeposits = transactions.filter(t => t.type === "DEPOSIT").reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === "WITHDRAWAL").reduce((sum, t) => sum + t.amount, 0);
  const calculatedCurrentBalance = account.currentBalance;

  const currentDrawdownVal = peakEquity - calculatedCurrentBalance;
  const currentDrawdownPct = peakEquity > 0 ? (currentDrawdownVal / peakEquity) * 100 : 0;

  // 5. Growth & Compounding
  const baselineInvestment = baseBalance + totalDeposits;
  const equityGrowthPct = baselineInvestment > 0 
    ? ((calculatedCurrentBalance - baselineInvestment) / baselineInvestment) * 100 
    : 0;

  const firstEventDate = timelineEvents.length > 0 ? timelineEvents[0].date : new Date();
  const daysActive = Math.max(1, (new Date().getTime() - firstEventDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksActive = Math.max(1, daysActive / 7);
  const monthsActive = Math.max(1, daysActive / 30.44);

  const returnRatio = baselineInvestment > 0 ? calculatedCurrentBalance / baselineInvestment : 1;
  const weeklyCompoundGrowth = (Math.pow(Math.max(0, returnRatio), 1 / weeksActive) - 1) * 100;
  const monthlyCompoundGrowth = (Math.pow(Math.max(0, returnRatio), 1 / monthsActive) - 1) * 100;

  // 6. Consistency Score
  // Now using standard deviation-like approach or heavily penalizing high daily variance?
  // We'll stick to a modified proprietary score leveraging real trade win rate.
  const drawdownPenalty = Math.min(40, maxDrawdownPct * 2);
  const winRatePenalty = Math.max(0, 50 - winRate);
  const pfPenalty = profitFactor >= 1.5 ? 0 : Math.max(0, (1.5 - profitFactor) * 20);
  
  let consistencyScore = 100 - drawdownPenalty - winRatePenalty - pfPenalty;
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));
  
  if (totalTrades === 0 && totalDays === 0) {
    consistencyScore = 0;
  } else if (totalTrades === 0) {
    // If only DailyEntries exist, rely purely on profitable days %
    const dailyPfPenalty = Math.max(0, 50 - profitableDaysPct);
    consistencyScore = Math.max(0, Math.min(100, 100 - drawdownPenalty - dailyPfPenalty));
  }

  // 7. Future Projections
  const rawWeeklyReturn = weeklyCompoundGrowth / 100;
  const consistencyMultiplier = Math.max(0.1, consistencyScore / 100);
  const winRateMultiplier = Math.min(1, (totalTrades > 0 ? winRate : profitableDaysPct) / 40);
  let effectiveWeeklyReturn = rawWeeklyReturn * consistencyMultiplier * winRateMultiplier;
  effectiveWeeklyReturn = Math.max(-0.15, Math.min(0.06, effectiveWeeklyReturn));

  const expectedBalanceNextWeek = calculatedCurrentBalance * (1 + effectiveWeeklyReturn);
  const expectedWeeklyProfit = expectedBalanceNextWeek - calculatedCurrentBalance;
  const expectedBalanceNextMonth = calculatedCurrentBalance * Math.pow(1 + effectiveWeeklyReturn, 4);
  const expectedMonthlyProfit = expectedBalanceNextMonth - calculatedCurrentBalance;
  const expectedBalanceNextYear = calculatedCurrentBalance * Math.pow(1 + effectiveWeeklyReturn, 52);

  // 8. Period Profits
  const nowTime = new Date().getTime();
  const getBalanceAtTime = (cutoffTime: number) => {
    let bal = baseBalance;
    for (const event of timelineEvents) {
      if (event.date.getTime() <= cutoffTime) {
        if (event.type === "PNL") bal += event.amount;
        else if (event.type === "TRANSACTION") {
          bal += event.txType === "DEPOSIT" ? event.amount : -event.amount;
        }
      } else {
        break;
      }
    }
    return bal;
  };

  const balanceOneDayAgo = getBalanceAtTime(nowTime - (1000 * 60 * 60 * 24));
  const balanceSevenDaysAgo = getBalanceAtTime(nowTime - (1000 * 60 * 60 * 24 * 7));
  const balanceThirtyDaysAgo = getBalanceAtTime(nowTime - (1000 * 60 * 60 * 24 * 30));

  const dailyProfitPct = balanceOneDayAgo > 0 ? ((calculatedCurrentBalance - balanceOneDayAgo) / balanceOneDayAgo) * 100 : 0;
  const weeklyProfitPct = balanceSevenDaysAgo > 0 ? ((calculatedCurrentBalance - balanceSevenDaysAgo) / balanceSevenDaysAgo) * 100 : 0;
  const monthlyProfitPct = balanceThirtyDaysAgo > 0 ? ((calculatedCurrentBalance - balanceThirtyDaysAgo) / balanceThirtyDaysAgo) * 100 : 0;

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
    netProfit: totalTimelinePnl, // True net profit without double counting
    equityGrowthPct,
    consistencyScore,
    weeklyCompoundGrowth: isNaN(weeklyCompoundGrowth) ? 0 : weeklyCompoundGrowth,
    monthlyCompoundGrowth: isNaN(monthlyCompoundGrowth) ? 0 : monthlyCompoundGrowth,
    expectedBalanceNextWeek,
    expectedWeeklyProfit,
    expectedBalanceNextMonth,
    expectedMonthlyProfit,
    expectedBalanceNextYear,
    currentBalance: calculatedCurrentBalance,
    dailyProfitPct,
    weeklyProfitPct,
    monthlyProfitPct,
    totalPnl: totalTimelinePnl,
    profitableDaysPct,
    averageDailyGain,
    averageDailyLoss,
  };
}
