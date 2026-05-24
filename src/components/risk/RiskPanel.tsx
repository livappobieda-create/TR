"use client";

import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonInput } from "@/components/ui/NeonInput";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Calculator, Shield, Activity, Target, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/context/LangContext";

interface RiskPanelProps {
  currentBalance: number;
  consistencyScore: number;
  winRate: number;
  weeklyCompoundGrowth?: number;
  isFunded?: boolean;
  averageRR?: number;
  currentDrawdown?: number;
}

// Better deterministic pseudo-random generator (Mulberry32)
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function RiskPanel({ 
  currentBalance, 
  consistencyScore, 
  winRate, 
  weeklyCompoundGrowth = 0, 
  isFunded = false,
  averageRR = 1.5,
  currentDrawdown = 0
}: RiskPanelProps) {
  const { t } = useLang();
  
  // Independent States
  const [riskPct, setRiskPct] = useState("1.0");
  const [stopLoss, setStopLoss] = useState("100");
  const [isGold, setIsGold] = useState(true);
  
  const [revLotSize, setRevLotSize] = useState("0.10");
  const [revStopLoss, setRevStopLoss] = useState("100");

  const [simLotSize, setSimLotSize] = useState("0.10");
  
  // Clean inputs
  const parseSafe = (val: string) => {
    const cleaned = val.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // --- Risk Engine ---
  const numericRiskPct = parseSafe(riskPct);
  const riskAmount = currentBalance * (numericRiskPct / 100);
  const slPips = parseSafe(stopLoss) || 1;
  
  const riskPerMicroLot = slPips * 0.1;
  const recommendedLot = riskPerMicroLot > 0 ? (riskAmount / riskPerMicroLot) * 0.01 : 0;

  // --- Reverse Calculator ---
  const rLot = parseSafe(revLotSize);
  const rSl = parseSafe(revStopLoss) || 1;
  const revRiskPerMicro = rSl * 0.1;
  const revRiskAmount = (rLot / 0.01) * revRiskPerMicro;
  const revRiskPct = currentBalance > 0 ? (revRiskAmount / currentBalance) * 100 : 0;
  const consecutiveToDD = revRiskPct > 0 ? Math.floor(5 / revRiskPct) : 0;

  // --- Psychological Risk Meter & Badges ---
  let riskBadge = t("conservative" as any) || "Conservative";
  let riskBadgeColor = "text-cyan-400 border-cyan-500/50 bg-cyan-500/10";
  let glowColor = "hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]";
  
  if (revRiskPct > 5) {
    riskBadge = t("overleveraged" as any) || "Overleveraged";
    riskBadgeColor = "text-red-500 border-red-500/50 bg-red-500/10";
    glowColor = "shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse";
  } else if (revRiskPct > 2.5) {
    riskBadge = t("aggressive" as any) || "Aggressive";
    riskBadgeColor = "text-orange-400 border-orange-500/50 bg-orange-500/10";
    glowColor = "hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]";
  } else if (revRiskPct >= 1.0) {
    riskBadge = t("disciplined" as any) || "Disciplined";
    riskBadgeColor = "text-green-400 border-green-500/50 bg-green-500/10";
    glowColor = "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]";
  }

  // --- Live Summary Engine ---
  let suggestedRiskPct = 1.0;
  if (consistencyScore > 80 && winRate > 50) suggestedRiskPct = 1.5;
  if (consistencyScore < 50 || winRate < 40) suggestedRiskPct = 0.5;

  const safeRiskAmount = currentBalance * (suggestedRiskPct / 100);
  const suggestedMaxTrades = suggestedRiskPct > 0 ? Math.floor(5 / suggestedRiskPct) : 0; 
  const safeMicroRisk = 100 * 0.1;
  const safeLot = safeMicroRisk > 0 ? (safeRiskAmount / safeMicroRisk) * 0.01 : 0;

  // --- Realistic Weekly Simulation Engine ---
  const weekSeed = Math.floor(currentBalance); 
  const simSlPips = slPips;
  
  const simulatedDays = useMemo(() => {
    const days = [];
    let runningBalance = currentBalance;
    let peakBalance = currentBalance;
    let simMaxDD = 0;
    const wrFactor = Math.max(0, Math.min(1, winRate / 100));
    const safeAverageRR = averageRR > 0 ? averageRR : 1.5;
    
    const random = mulberry32(weekSeed);
    
    // Fixed simulated risk amount derived from the manually chosen simLotSize
    const parsedSimLot = parseSafe(simLotSize);
    const simRiskAmount = (parsedSimLot / 0.01) * (simSlPips * 0.1);

    for (let i = 0; i < 5; i++) {
      const rand = random();
      const outcomeRand = random();
      
      let rMultiple = 0;
      
      if (rand < 0.20) {
        // Neutral Day
        rMultiple = 0;
      } else {
        const isWin = (rand - 0.20) / 0.80 < wrFactor;
        if (isWin) {
          if (outcomeRand < 0.2) rMultiple = safeAverageRR * 1.5; // Strong win
          else if (outcomeRand > 0.8) rMultiple = safeAverageRR * 0.5; // Partial win
          else rMultiple = safeAverageRR; // Normal win
        } else {
          if (outcomeRand < 0.2) rMultiple = -1.0; // Full loss
          else if (outcomeRand > 0.8) rMultiple = -0.4; // Defensive partial loss
          else rMultiple = -0.8; // Normal loss
        }
      }
      
      // Calculate PNL based on exact formula
      const consistencyMod = Math.max(0.1, consistencyScore / 100);
      const volatilityMod = currentDrawdown > 5 ? 0.9 : 1.0; 
      
      const dailyPnl = simRiskAmount * rMultiple * consistencyMod * volatilityMod;
      runningBalance += dailyPnl;
      
      if (runningBalance > peakBalance) peakBalance = runningBalance;
      const dd = peakBalance > 0 ? (peakBalance - runningBalance) / peakBalance * 100 : 0;
      if (dd > simMaxDD) simMaxDD = dd;
      
      let label = t("neutralDay" as any) || "Neutral Day";
      if (rMultiple >= 1.5) label = t("strongWinDay" as any) || "Strong Win Day";
      else if (rMultiple > 0 && rMultiple < 1.5) label = t("recoveryDay" as any) || "Positive Day";
      else if (rMultiple <= -1.0) label = t("volatileDay" as any) || "Volatile Day";
      else if (rMultiple < 0 && rMultiple > -1.0) label = t("defensiveDay" as any) || "Defensive Day";
      
      days.push({ day: i + 1, rMultiple, pnl: dailyPnl, balance: runningBalance, label });
    }
    
    return { days, endingBalance: runningBalance, maxDD: simMaxDD };
  }, [currentBalance, winRate, averageRR, consistencyScore, currentDrawdown, simLotSize, simSlPips, weekSeed, t]);

  const { days, endingBalance, maxDD } = simulatedDays;
  const weeklyProfit = endingBalance - currentBalance;
  const weeklyReturnPct = currentBalance > 0 ? (weeklyProfit / currentBalance) * 100 : 0;
  
  // Next week lot formula
  const nextWeekRiskAmt = endingBalance * (numericRiskPct / 100);
  const nextWeekLot = riskPerMicroLot > 0 ? (nextWeekRiskAmt / riskPerMicroLot) * 0.01 : 0;

  return (
    <div className="space-y-6">
      
      {/* Live Risk Summary */}
      <GlassCard className="border-cyan-500/30">
        <div className="flex items-center gap-3 mb-5">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-gradient">{t("liveRiskSummary") || "Live Risk Summary"}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all">
            <p className="text-xs text-slate-500 mb-1">{t("suggestedRiskTrade") || "Suggested Risk / Trade"}</p>
            <p className="text-xl font-bold text-cyan-400">{formatPercent(suggestedRiskPct)}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-green-500/30 transition-all">
            <p className="text-xs text-slate-500 mb-1">{t("suggestedSafeLot") || "Safe Lot (100 Pip SL)"}</p>
            <p className="text-xl font-bold text-green-400">{safeLot.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-all">
            <p className="text-xs text-slate-500 mb-1">{t("maxTradesDD") || "Max Daily Trades (5% DD)"}</p>
            <p className="text-xl font-bold text-purple-400">{suggestedMaxTrades}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-pink-500/30 transition-all">
            <p className="text-xs text-slate-500 mb-1">{t("maxDailyLossRemaining" as any) || "Max Daily Loss Remaining"}</p>
            <p className="text-xl font-bold text-pink-400">{formatCurrency(currentBalance * 0.05)}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lot Size Calculator */}
        <GlassCard className="transition-all hover:border-cyan-500/20">
          <div className="flex items-center gap-3 mb-5">
            <Calculator className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{t("lotSizeCalculator") || "Lot Size Calculator"}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${!isGold ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                onClick={() => setIsGold(false)}
              >
                {t("standardForex") || "Standard Forex"}
              </button>
              <button 
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${isGold ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                onClick={() => setIsGold(true)}
              >
                {t("goldXauusd") || "GOLD (XAUUSD)"}
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button onClick={() => setRiskPct("0.5")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">{t("conservative" as any) || "Conservative"} 0.5%</button>
              <button onClick={() => setRiskPct("1.0")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">{t("balanced") || "Balanced"} 1.0%</button>
              <button onClick={() => setRiskPct("2.0")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">{t("aggressive" as any) || "Aggressive"} 2.0%</button>
            </div>

            <NeonInput
              id="calc-risk-pct"
              label={t("riskPercentage") || "Risk Percentage (%)"}
              type="text"
              inputMode="decimal"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
            />
            <NeonInput
              id="calc-stop-loss"
              label={t("stopLossPips" as any) || "Stop Loss (Pips)"}
              type="text"
              inputMode="numeric"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              hint={isGold ? "Model: 100 XAUUSD Pips = $10 risk on 0.01 lot" : "Model: 10 Forex Pips = $1 risk on 0.01 lot"}
            />
            
            <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
              <p className="text-slate-500 text-xs mb-1 relative z-10">{t("recommendedLotSize") || "Recommended Lot Size"}</p>
              <p className="text-4xl font-black text-cyan-400 font-mono drop-shadow-[0_0_15px_rgba(0,245,255,0.4)] relative z-10">
                {isFinite(recommendedLot) && recommendedLot > 0 ? recommendedLot.toFixed(2) : "0.00"}
              </p>
              <p className="text-sm text-slate-400 mt-2 relative z-10">
                {t("risking") || "Risking"} <strong className="text-pink-400">{formatCurrency(riskAmount)}</strong>
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Reverse Risk Calculator */}
        <div className="space-y-6">
          <GlassCard className={`transition-all duration-500 ${glowColor}`}>
            <div className="flex items-center gap-3 mb-5">
              <Shield className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">{t("reverseRiskCalculator") || "Reverse Risk Calculator"}</h2>
            </div>
            
            <div className="space-y-4 pt-4">
              <NeonInput
                id="rev-lot-size"
                label={t("lotSize") || "Lot Size"}
                type="text"
                inputMode="decimal"
                value={revLotSize}
                onChange={(e) => setRevLotSize(e.target.value)}
              />
              <NeonInput
                id="rev-stop-loss"
                label={t("stopLossPips" as any) || "Stop Loss (Pips)"}
                type="text"
                inputMode="numeric"
                value={revStopLoss}
                onChange={(e) => setRevStopLoss(e.target.value)}
              />
              
              <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-500 text-xs">{t("psychologicalRiskMeter" as any) || "Risk Meter"}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${riskBadgeColor} transition-colors`}>
                    {riskBadge}
                  </span>
                </div>
                <p className={`text-4xl font-black font-mono mb-2 transition-colors ${revRiskPct > 5 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : revRiskPct > 2.5 ? 'text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]' : revRiskPct >= 1 ? 'text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`}>
                  {isFinite(revRiskPct) && revRiskPct > 0 ? formatPercent(revRiskPct) : "0.0%"}
                </p>
                <p className="text-sm text-slate-400">
                  {t("risking") || "Risking"} <strong className="text-white">{formatCurrency(revRiskAmount)}</strong>
                </p>
              </div>
            </div>
          </GlassCard>
          
          {/* Risk Commentary Engine */}
          <GlassCard className="border-indigo-500/20">
            <h3 className="text-xs uppercase text-indigo-400 font-bold mb-3">{t("riskCommentary" as any) || "Risk Commentary"}</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {numericRiskPct > 3 && winRate < 45 && (
                <li className="flex items-start gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("highInstabilityWarning" as any) || "High probability of account instability. Win rate is too low for this risk level."}</span>
                </li>
              )}
              {numericRiskPct >= 5 && (
                <li className="flex items-start gap-2 text-orange-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("highlyAggressiveWarning" as any) || "5% risk per trade is considered highly aggressive."}</span>
                </li>
              )}
              {numericRiskPct > 3 && (
                <li className="flex items-start gap-2 text-yellow-400">
                  <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("reduceRiskSuggestion" as any) || "Reducing risk to 1%-2% may improve long-term consistency."}</span>
                </li>
              )}
              {consecutiveToDD <= 3 && consecutiveToDD > 0 && (
                <li className="flex items-start gap-2 text-pink-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("consecutiveLossWarning" as any) || `Three consecutive losses at this risk level may cause a major drawdown violation.`}</span>
                </li>
              )}
              {isFunded && revRiskPct > 2.5 && (
                <li className="flex items-start gap-2 text-red-500 font-bold">
                  <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("fundedWarning" as any) || "PROP FIRM WARNING: This lot size is highly likely to violate funded account limits."}</span>
                </li>
              )}
            </ul>
            {(numericRiskPct <= 3 && consecutiveToDD > 3 && (!isFunded || revRiskPct <= 2.5) && (winRate >= 45 || numericRiskPct <= 2)) && (
              <p className="text-sm text-green-400 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("riskIsBalanced" as any) || "Your risk parameters are well balanced and safe."}
              </p>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Weekly Compounding Preview */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-green-400" />
            <h2 className="text-base font-bold text-white">{t("weeklyCompoundingPreview") || "Realistic Weekly Projection"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{t("lotSize") || "Lot Size"}:</span>
            <div className="w-24">
              <NeonInput
                id="sim-lot-size"
                type="text"
                inputMode="decimal"
                value={simLotSize}
                onChange={(e) => setSimLotSize(e.target.value)}
                className="py-1 text-xs"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium w-1/3">{t("dayLabel") || "Day"}</th>
                <th className="px-4 py-3 font-medium">{t("outcome" as any) || "Outcome"}</th>
                <th className="px-4 py-3 font-medium text-right">{t("estBalance") || "Balance"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {days.map((day) => {
                const isWin = day.pnl > 0;
                const isLoss = day.pnl < 0;
                const isStrong = day.rMultiple >= 1.5;
                
                let textColor = "text-slate-400";
                let glow = "";
                let Icon = Minus;
                
                if (isWin) {
                  textColor = isStrong ? "text-cyan-400" : "text-green-400";
                  glow = isStrong ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]";
                  Icon = TrendingUp;
                } else if (isLoss) {
                  textColor = "text-red-400";
                  glow = "drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]";
                  Icon = TrendingDown;
                }

                return (
                  <tr key={day.day} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-slate-300">{t("dayLabel") || "Day"} {day.day}</span>
                        <span className={`text-[10px] ${textColor} ${glow}`}>{day.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 font-mono ${textColor} ${glow}`}>
                        <Icon className="h-3 w-3" />
                        <span>{day.pnl > 0 ? "+" : ""}{formatCurrency(day.pnl)}</span>
                        <span className="text-[10px] opacity-70 ml-1">({day.rMultiple > 0 ? "+" : ""}{day.rMultiple.toFixed(1)}R)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-300">
                      {formatCurrency(day.balance)}
                      <div className={`text-[10px] ${day.balance >= currentBalance ? "text-green-500" : "text-red-500"} opacity-70`}>
                        {day.balance >= currentBalance ? "+" : ""}{(((day.balance - currentBalance) / currentBalance) * 100).toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Weekly Summary Under Table */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
            <p className="text-[10px] uppercase text-slate-500 mb-1">{t("expectedReturn" as any) || "Expected Return"}</p>
            <p className={`text-lg font-bold font-mono ${weeklyProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {weeklyProfit >= 0 ? "+" : ""}{formatPercent(weeklyReturnPct)}
            </p>
          </div>
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
            <p className="text-[10px] uppercase text-slate-500 mb-1">{t("projectedProfit" as any) || "Projected Profit"}</p>
            <p className={`text-lg font-bold font-mono ${weeklyProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {weeklyProfit >= 0 ? "+" : ""}{formatCurrency(weeklyProfit)}
            </p>
          </div>
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
            <p className="text-[10px] uppercase text-slate-500 mb-1">{t("estMaxDD" as any) || "Est. Max DD"}</p>
            <p className="text-lg font-bold font-mono text-pink-400">
              {maxDD.toFixed(1)}%
            </p>
          </div>
          <div className="bg-slate-900/40 p-3 rounded-lg border border-cyan-900/30 relative">
            <p className="text-[10px] uppercase text-cyan-500 mb-1">{t("nextWeekLot" as any) || "Next Week Lot"}</p>
            <p className="text-lg font-bold font-mono text-cyan-400">
              {isFinite(nextWeekLot) && nextWeekLot > 0 ? nextWeekLot.toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-4 text-center leading-relaxed">
          {t("weeklySimDescV2" as any) || `Lot size is strictly fixed for the entire week. Projections are mathematically weighted by your ${winRate.toFixed(1)}% Win Rate, ${averageRR.toFixed(2)} Avg RR, and ${consistencyScore.toFixed(0)} Consistency Score.`}
        </p>
      </GlassCard>

    </div>
  );
}
