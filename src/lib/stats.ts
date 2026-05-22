/**
 * Pure mathematical trading statistics engine — no AI/ML.
 */

export interface DailyRecord {
  date: Date;
  startBalance: number;
  endBalance: number;
  dailyPnl: number;
  dailyPnlPct: number;
}

export interface ComputedDaily {
  dailyPnl: number;
  dailyPnlPct: number;
  equityChange: number;
}

export function computeDailyMetrics(
  startBalance: number,
  endBalance: number
): ComputedDaily {
  const dailyPnl = endBalance - startBalance;
  const dailyPnlPct =
    startBalance !== 0 ? (dailyPnl / startBalance) * 100 : 0;
  const equityChange = dailyPnl;
  return { dailyPnl, dailyPnlPct, equityChange };
}

export function totalPnl(entries: DailyRecord[], initialBalance: number): number {
  if (entries.length === 0) return 0;
  const last = entries[entries.length - 1];
  return last.endBalance - initialBalance;
}

export function totalProfitPercent(
  initialBalance: number,
  currentBalance: number
): number {
  if (initialBalance === 0) return 0;
  return ((currentBalance - initialBalance) / initialBalance) * 100;
}

export function periodProfitPercent(
  entries: DailyRecord[],
  days: number
): number {
  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  if (sorted.length < 2) return sorted[0]?.dailyPnlPct ?? 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const inPeriod = sorted.filter((e) => e.date >= cutoff);
  if (inPeriod.length < 2) {
    const start = inPeriod[0]?.startBalance ?? sorted[0].startBalance;
    const end = inPeriod[inPeriod.length - 1]?.endBalance ?? start;
    return start !== 0 ? ((end - start) / start) * 100 : 0;
  }
  const startBal = inPeriod[0].startBalance;
  const endBal = inPeriod[inPeriod.length - 1].endBalance;
  return startBal !== 0 ? ((endBal - startBal) / startBal) * 100 : 0;
}

export function winRate(entries: DailyRecord[]): number {
  if (entries.length === 0) return 0;
  const wins = entries.filter((e) => e.dailyPnl > 0).length;
  return (wins / entries.length) * 100;
}

export function averageRiskReward(entries: DailyRecord[]): number {
  const wins = entries.filter((e) => e.dailyPnl > 0);
  const losses = entries.filter((e) => e.dailyPnl < 0);
  if (losses.length === 0) return wins.length > 0 ? Infinity : 0;
  const avgWin =
    wins.length > 0
      ? wins.reduce((s, e) => s + Math.abs(e.dailyPnl), 0) / wins.length
      : 0;
  const avgLoss =
    losses.reduce((s, e) => s + Math.abs(e.dailyPnl), 0) / losses.length;
  if (avgLoss === 0) return avgWin > 0 ? Infinity : 0;
  return avgWin / avgLoss;
}

export function calculateDrawdownSeries(
  balances: number[]
): { drawdown: number; drawdownPct: number }[] {
  let peak = balances[0] ?? 0;
  return balances.map((bal) => {
    if (bal > peak) peak = bal;
    const drawdown = peak - bal;
    const drawdownPct = peak !== 0 ? (drawdown / peak) * 100 : 0;
    return { drawdown, drawdownPct };
  });
}

export function maxDrawdown(entries: DailyRecord[]): number {
  const balances = entries.map((e) => e.endBalance);
  if (balances.length === 0) return 0;
  const series = calculateDrawdownSeries(balances);
  return Math.max(...series.map((s) => s.drawdownPct), 0);
}

export function currentDrawdown(
  entries: DailyRecord[],
  currentBalance: number
): number {
  const balances = [...entries.map((e) => e.endBalance), currentBalance];
  if (balances.length === 0) return 0;
  const series = calculateDrawdownSeries(balances);
  return series[series.length - 1]?.drawdownPct ?? 0;
}

export function profitFactor(entries: DailyRecord[]): number {
  const grossProfit = entries
    .filter((e) => e.dailyPnl > 0)
    .reduce((s, e) => s + e.dailyPnl, 0);
  const grossLoss = Math.abs(
    entries.filter((e) => e.dailyPnl < 0).reduce((s, e) => s + e.dailyPnl, 0)
  );
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

export function consistencyScore(entries: DailyRecord[]): number {
  if (entries.length < 2) return entries.length === 1 ? 100 : 0;
  const pnls = entries.map((e) => e.dailyPnlPct);
  const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
  const variance =
    pnls.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / pnls.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 100;
  const score = Math.max(0, 100 - stdDev * 2);
  return Math.min(100, score);
}

export function avgDailyGain(entries: DailyRecord[]): number {
  const gains = entries.filter((e) => e.dailyPnl > 0);
  if (gains.length === 0) return 0;
  return gains.reduce((s, e) => s + e.dailyPnl, 0) / gains.length;
}

export function avgDailyLoss(entries: DailyRecord[]): number {
  const losses = entries.filter((e) => e.dailyPnl < 0);
  if (losses.length === 0) return 0;
  return losses.reduce((s, e) => s + e.dailyPnl, 0) / losses.length;
}

export function consecutiveStreaks(entries: DailyRecord[]): {
  maxWins: number;
  maxLosses: number;
  currentWins: number;
  currentLosses: number;
} {
  let maxWins = 0;
  let maxLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;
  let streakWins = 0;
  let streakLosses = 0;

  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  for (const e of sorted) {
    if (e.dailyPnl > 0) {
      streakWins++;
      streakLosses = 0;
      maxWins = Math.max(maxWins, streakWins);
    } else if (e.dailyPnl < 0) {
      streakLosses++;
      streakWins = 0;
      maxLosses = Math.max(maxLosses, streakLosses);
    } else {
      streakWins = 0;
      streakLosses = 0;
    }
  }

  const last = sorted[sorted.length - 1];
  if (last) {
    if (last.dailyPnl > 0) {
      currentWins = streakWins;
      currentLosses = 0;
    } else if (last.dailyPnl < 0) {
      currentLosses = streakLosses;
      currentWins = 0;
    }
  }

  return { maxWins, maxLosses, currentWins, currentLosses };
}

export function compoundingRate(
  entries: DailyRecord[],
  days: number
): number {
  const pct = periodProfitPercent(entries, days);
  const periods = days / 7;
  if (periods <= 0) return 0;
  return pct / periods;
}

export function riskExposure(
  entries: DailyRecord[],
  accountSize: number
): number {
  if (entries.length === 0 || accountSize === 0) return 0;
  const recent = entries.slice(-5);
  const avgAbsMove =
    recent.reduce((s, e) => s + Math.abs(e.dailyPnl), 0) / recent.length;
  return (avgAbsMove / accountSize) * 100;
}

export function accountGrowth(
  initialBalance: number,
  currentBalance: number
): number {
  return totalProfitPercent(initialBalance, currentBalance);
}

export interface FullStatistics {
  dailyProfitPct: number;
  weeklyProfitPct: number;
  monthlyProfitPct: number;
  yearlyProfitPct: number;
  totalPnl: number;
  totalProfitPct: number;
  winRate: number;
  averageRR: number;
  drawdown: number;
  maxDrawdown: number;
  riskExposure: number;
  profitFactor: number;
  consistencyScore: number;
  avgDailyGain: number;
  avgDailyLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentConsecutiveWins: number;
  currentConsecutiveLosses: number;
  accountGrowth: number;
  equityGrowth: number;
  weeklyCompounding: number;
  monthlyCompounding: number;
}

export function computeFullStatistics(
  entries: DailyRecord[],
  initialBalance: number,
  currentBalance: number
): FullStatistics {
  const streaks = consecutiveStreaks(entries);
  return {
    dailyProfitPct: periodProfitPercent(entries, 1),
    weeklyProfitPct: periodProfitPercent(entries, 7),
    monthlyProfitPct: periodProfitPercent(entries, 30),
    yearlyProfitPct: periodProfitPercent(entries, 365),
    totalPnl: totalPnl(entries, initialBalance),
    totalProfitPct: totalProfitPercent(initialBalance, currentBalance),
    winRate: winRate(entries),
    averageRR: averageRiskReward(entries),
    drawdown: currentDrawdown(entries, currentBalance),
    maxDrawdown: maxDrawdown(entries),
    riskExposure: riskExposure(entries, currentBalance),
    profitFactor: profitFactor(entries),
    consistencyScore: consistencyScore(entries),
    avgDailyGain: avgDailyGain(entries),
    avgDailyLoss: avgDailyLoss(entries),
    maxConsecutiveWins: streaks.maxWins,
    maxConsecutiveLosses: streaks.maxLosses,
    currentConsecutiveWins: streaks.currentWins,
    currentConsecutiveLosses: streaks.currentLosses,
    accountGrowth: accountGrowth(initialBalance, currentBalance),
    equityGrowth: totalProfitPercent(initialBalance, currentBalance),
    weeklyCompounding: compoundingRate(entries, 7),
    monthlyCompounding: compoundingRate(entries, 30),
  };
}

/** Prop firm phase progress */
export interface PhaseProgress {
  phase: string;
  profitProgressPct: number;
  remainingTargetPct: number;
  drawdownUsedPct: number;
  dailyDrawdownUsedPct: number;
  maxDrawdownDistancePct: number;
  daysRemaining: number;
  status: "safe" | "warning" | "danger";
  warnings: string[];
}

export function computePhaseProgress(params: {
  phase: string;
  challengeSize: number;
  profitTarget: number;
  currentProfitProgress: number;
  dailyDrawdownLimit: number;
  maxDrawdownLimit: number;
  currentDrawdown: number;
  todayDrawdownPct?: number;
  phaseDaysRemaining: number;
}): PhaseProgress {
  const {
    challengeSize,
    profitTarget,
    currentProfitProgress,
    dailyDrawdownLimit,
    maxDrawdownLimit,
    currentDrawdown,
    todayDrawdownPct = 0,
    phaseDaysRemaining,
    phase,
  } = params;

  const profitProgressPct =
    profitTarget > 0
      ? Math.min(100, (currentProfitProgress / profitTarget) * 100)
      : 0;
  const remainingTargetPct = Math.max(0, 100 - profitProgressPct);

  const drawdownUsedPct =
    maxDrawdownLimit > 0
      ? Math.min(100, (currentDrawdown / maxDrawdownLimit) * 100)
      : 0;

  const dailyDrawdownUsedPct =
    dailyDrawdownLimit > 0
      ? Math.min(100, (todayDrawdownPct / dailyDrawdownLimit) * 100)
      : 0;

  const maxDrawdownDistancePct = Math.max(
    0,
    maxDrawdownLimit - currentDrawdown
  );

  const warnings: string[] = [];
  let status: PhaseProgress["status"] = "safe";

  if (drawdownUsedPct >= 80) {
    status = "danger";
    warnings.push("Approaching maximum drawdown limit");
  } else if (drawdownUsedPct >= 60) {
    status = "warning";
    warnings.push("Drawdown usage elevated");
  }

  if (dailyDrawdownUsedPct >= 80) {
    status = "danger";
    warnings.push("Daily drawdown limit nearly breached");
  } else if (dailyDrawdownUsedPct >= 60 && status !== "danger") {
    status = "warning";
    warnings.push("Daily drawdown elevated");
  }

  if (remainingTargetPct <= 10 && profitProgressPct >= 90) {
    warnings.push("Near phase completion target");
  }

  return {
    phase,
    profitProgressPct,
    remainingTargetPct,
    drawdownUsedPct,
    dailyDrawdownUsedPct,
    maxDrawdownDistancePct,
    daysRemaining: phaseDaysRemaining,
    status,
    warnings,
  };
}
