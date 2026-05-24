"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonInput } from "@/components/ui/NeonInput";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Calculator, Shield, Activity, Target, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/context/LangContext";

interface RiskPanelProps {
  currentBalance: number;
  consistencyScore: number;
  winRate: number;
  weeklyCompoundGrowth?: number;
  isFunded?: boolean;
}

export function RiskPanel({ currentBalance, consistencyScore, winRate, weeklyCompoundGrowth = 0, isFunded = false }: RiskPanelProps) {
  const { t } = useLang();
  const [riskPct, setRiskPct] = useState("1.0");
  const [stopLoss, setStopLoss] = useState("100");
  const [isGold, setIsGold] = useState(true);
  
  const [revLotSize, setRevLotSize] = useState("0.10");
  const [revStopLoss, setRevStopLoss] = useState("100");
  
  // --- Calculator 1: Risk to Lot ---
  const riskAmount = currentBalance * (parseFloat(riskPct || "0") / 100);
  const slPips = parseFloat(stopLoss || "1") || 1;
  
  // Both Gold and Forex follow the exact same pip-to-dollar math based on the provided model:
  // 1 Pip = $0.10 on 0.01 lot. 
  // 100 Pips = $10.00 on 0.01 lot.
  const riskPerMicroLot = slPips * 0.1;
    
  const recommendedLot = riskPerMicroLot > 0 ? (riskAmount / riskPerMicroLot) * 0.01 : 0;

  // --- Calculator 2: Lot to Risk ---
  const rLot = parseFloat(revLotSize || "0");
  const rSl = parseFloat(revStopLoss || "1") || 1;
  
  const revRiskPerMicro = rSl * 0.1;
  const revRiskAmount = (rLot / 0.01) * revRiskPerMicro;
  const revRiskPct = currentBalance > 0 ? (revRiskAmount / currentBalance) * 100 : 0;
  
  const consecutiveToDD = revRiskPct > 0 ? Math.floor(5 / revRiskPct) : 0; // Assuming 5% daily limit

  // Risk Classification
  let riskBadge = "Conservative";
  let riskBadgeColor = "text-cyan-400 border-cyan-500/50 bg-cyan-500/10";
  let glowColor = "hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]";
  
  if (revRiskPct > 5) {
    riskBadge = "Overleveraged";
    riskBadgeColor = "text-red-500 border-red-500/50 bg-red-500/10";
    glowColor = "shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse";
  } else if (revRiskPct > 2.5) {
    riskBadge = "Aggressive";
    riskBadgeColor = "text-orange-400 border-orange-500/50 bg-orange-500/10";
    glowColor = "hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]";
  } else if (revRiskPct >= 1.0) {
    riskBadge = "Disciplined";
    riskBadgeColor = "text-green-400 border-green-500/50 bg-green-500/10";
    glowColor = "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]";
  }

  // --- Live Summary Engine ---
  let suggestedRiskPct = 1.0;
  if (consistencyScore > 80 && winRate > 50) suggestedRiskPct = 1.5;
  if (consistencyScore < 50 || winRate < 40) suggestedRiskPct = 0.5;

  const safeRiskAmount = currentBalance * (suggestedRiskPct / 100);
  const suggestedMaxTrades = suggestedRiskPct > 0 ? Math.floor(5 / suggestedRiskPct) : 0; 
  const safeMicroRisk = 100 * 0.1; // 100 pip SL assumption
  const safeLot = safeMicroRisk > 0 ? (safeRiskAmount / safeMicroRisk) * 0.01 : 0;

  // --- Realistic Weekly Simulation ---
  // Cap growth between 3% to 6%
  const baseGrowthCap = 0.06;
  const volatilityPenalty = (100 - consistencyScore) * 0.0003; 
  const winRatePenalty = winRate < 50 ? (50 - winRate) * 0.0005 : 0;
  
  const cappedWeeklyGrowth = Math.max(0.01, Math.min(baseGrowthCap, (weeklyCompoundGrowth || 0.02) - volatilityPenalty - winRatePenalty));
  
  const weeklyDollarGain = currentBalance * cappedWeeklyGrowth;
  const dailyDollarGain = weeklyDollarGain / 5;
  let runningWeeklyBalance = currentBalance;
  const fixedWeeklyLot = recommendedLot;

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
              <button onClick={() => setRiskPct("0.5")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">{t("conservative") || "Conservative"} 0.5%</button>
              <button onClick={() => setRiskPct("1.0")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">{t("balanced") || "Balanced"} 1.0%</button>
              <button onClick={() => setRiskPct("2.0")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">{t("aggressive") || "Aggressive"} 2.0%</button>
            </div>

            <NeonInput
              label={t("riskPercentage") || "Risk Percentage (%)"}
              type="number"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
            />
            <NeonInput
              label={t("stopLossPips" as any) || "Stop Loss (Pips)"}
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              hint={isGold ? "Model: 100 XAUUSD Pips = $10 risk on 0.01 lot" : "Model: 10 Forex Pips = $1 risk on 0.01 lot"}
            />
            
            <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
              <p className="text-slate-500 text-xs mb-1 relative z-10">{t("recommendedLotSize") || "Recommended Lot Size"}</p>
              <p className="text-4xl font-black text-cyan-400 font-mono drop-shadow-[0_0_15px_rgba(0,245,255,0.4)] relative z-10">
                {isFinite(recommendedLot) ? recommendedLot.toFixed(2) : "0.00"}
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
                label={t("lotSize") || "Lot Size"}
                type="number"
                step="0.01"
                value={revLotSize}
                onChange={(e) => setRevLotSize(e.target.value)}
              />
              <NeonInput
                label={t("stopLossPips" as any) || "Stop Loss (Pips)"}
                type="number"
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
                  {isFinite(revRiskPct) ? formatPercent(revRiskPct) : "0.0%"}
                </p>
                <p className="text-sm text-slate-400">
                  {t("risking") || "Risking"} <strong className="text-white">{formatCurrency(revRiskAmount)}</strong>
                </p>
                
                <div className="mt-4 space-y-2 text-left">
                  <p className="text-xs text-slate-500 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-500" />
                    <span>
                      {t("consecutiveLossWarning") || `At this risk level, ${consecutiveToDD} consecutive losses hit a 5% drawdown.`}
                    </span>
                  </p>
                  {isFunded && revRiskPct > 2.5 && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-red-400 flex items-start gap-1.5 bg-red-950/30 p-2 rounded border border-red-900/50 mt-2"
                    >
                      <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{t("fundedWarning") || "PROP FIRM WARNING: This lot size is highly likely to violate funded account daily drawdown limits."}</span>
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* Weekly Compounding Preview */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-green-400" />
              <h2 className="text-base font-bold text-white">{t("weeklyCompoundingPreview") || "Realistic Weekly Projection"}</h2>
            </div>
            <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">{t("dayLabel") || "Day"}</th>
                    <th className="px-4 py-2 font-medium">{t("estBalance") || "Est. Balance"}</th>
                    <th className="px-4 py-2 font-medium text-right">{t("lotSize") || "Lot Size"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[1, 2, 3, 4, 5].map(day => {
                    const dayProfit = dailyDollarGain;
                    runningWeeklyBalance += dayProfit;
                    
                    return (
                      <tr key={day} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-slate-300">{t("dayLabel") || "Day"} {day}</td>
                        <td className="px-4 py-3 font-mono text-cyan-300">
                          {formatCurrency(runningWeeklyBalance)}
                          {dayProfit > 0 && <span className="text-[10px] text-green-500 ml-2">+{formatCurrency(dayProfit)}</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {isFinite(fixedWeeklyLot) ? fixedWeeklyLot.toFixed(2) : "0.00"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-cyan-950/20 border-t border-cyan-500/30">
                    <td colSpan={2} className="px-4 py-3 text-xs text-cyan-400 font-bold">
                      {t("nextWeekRecommendedLot") || "Next Week's Lot (Assuming SL)"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-cyan-400">
                      {isFinite(riskPerMicroLot) && riskPerMicroLot > 0 
                        ? ((runningWeeklyBalance * (parseFloat(riskPct || "1") / 100)) / riskPerMicroLot * 0.01).toFixed(2) 
                        : "0.00"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
              {t("weeklySimDesc") || `Projection capped at ${formatPercent(baseGrowthCap)}. Adjusted for your consistency (${consistencyScore}%) and win rate (${winRate}%).`}
            </p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
