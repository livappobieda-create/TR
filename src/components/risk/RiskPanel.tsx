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
  const [isGold, setIsGold] = useState(true); // Default to Gold based on user preference
  
  const [revLotSize, setRevLotSize] = useState("0.10");
  const [revStopLoss, setRevStopLoss] = useState("100");
  
  // --- Calculator 1: Risk to Lot ---
  const riskAmount = currentBalance * (parseFloat(riskPct || "0") / 100);
  const slPoints = parseFloat(stopLoss || "1") || 1;
  
  // Risk per 0.01 lot abstraction
  // Gold: 100 points = $10 risk on 0.01 lot
  // Forex: 10 points (1 pip) = $1 risk on 0.01 lot
  const riskPerMicroLot = isGold 
    ? (slPoints / 100) * 10 
    : (slPoints / 10) * 1;
    
  const recommendedLot = riskPerMicroLot > 0 ? (riskAmount / riskPerMicroLot) * 0.01 : 0;

  // --- Calculator 2: Lot to Risk ---
  const rLot = parseFloat(revLotSize || "0");
  const rSl = parseFloat(revStopLoss || "1") || 1;
  
  const revRiskPerMicro = isGold 
    ? (rSl / 100) * 10 
    : (rSl / 10) * 1;

  const revRiskAmount = (rLot / 0.01) * revRiskPerMicro;
  const revRiskPct = currentBalance > 0 ? (revRiskAmount / currentBalance) * 100 : 0;

  // Risk Classification
  let riskBadge = "Safe";
  let riskBadgeColor = "text-green-400 border-green-500/50 bg-green-500/10";
  if (revRiskPct > 5) {
    riskBadge = "Dangerous";
    riskBadgeColor = "text-red-500 border-red-500/50 bg-red-500/10";
  } else if (revRiskPct >= 2.5) {
    riskBadge = "Aggressive";
    riskBadgeColor = "text-pink-400 border-pink-500/50 bg-pink-500/10";
  } else if (revRiskPct >= 1.0) {
    riskBadge = "Moderate";
    riskBadgeColor = "text-yellow-400 border-yellow-500/50 bg-yellow-500/10";
  }

  // --- Live Summary Engine ---
  let suggestedRiskPct = 1.0;
  if (consistencyScore > 80 && winRate > 50) suggestedRiskPct = 1.5;
  if (consistencyScore < 50 || winRate < 40) suggestedRiskPct = 0.5;

  const safeRiskAmount = currentBalance * (suggestedRiskPct / 100);
  const suggestedMaxTrades = suggestedRiskPct > 0 ? Math.floor(5 / suggestedRiskPct) : 0; // Max 5% daily drawdown
  
  const safeMicroRisk = isGold ? (100 / 100) * 10 : (100 / 10) * 1; // 100pt SL assumption for safe lot
  const safeLot = safeMicroRisk > 0 ? (safeRiskAmount / safeMicroRisk) * 0.01 : 0;

  // Weekly simulation logic
  const weeklyDollarGain = currentBalance * Math.max(0, weeklyCompoundGrowth);
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
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">{t("suggestedRiskTrade") || "Suggested Risk / Trade"}</p>
            <p className="text-xl font-bold text-cyan-400">{formatPercent(suggestedRiskPct)}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">{t("suggestedSafeLot") || "Suggested Safe Lot (100pt SL)"}</p>
            <p className="text-xl font-bold text-green-400">{safeLot.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">{t("maxTradesDD") || "Max Trades (5% Daily DD)"}</p>
            <p className="text-xl font-bold text-purple-400">{suggestedMaxTrades}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">{t("safeMoneyAtRisk") || "Safe Money at Risk"}</p>
            <p className="text-xl font-bold text-pink-400">{formatCurrency(safeRiskAmount)}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lot Size Calculator */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-5">
            <Calculator className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{t("lotSizeCalculator") || "Lot Size Calculator"}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${!isGold ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                onClick={() => setIsGold(false)}
              >
                {t("standardForex") || "Standard Forex"}
              </button>
              <button 
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${isGold ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : 'border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                onClick={() => setIsGold(true)}
              >
                {t("goldXauusd") || "GOLD (XAUUSD)"}
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button onClick={() => setRiskPct("0.5")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white">{t("conservative") || "Conservative"} 0.5%</button>
              <button onClick={() => setRiskPct("1.0")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white">{t("balanced") || "Balanced"} 1.0%</button>
              <button onClick={() => setRiskPct("2.0")} className="flex-1 py-1 text-[10px] uppercase rounded bg-slate-800 text-slate-400 hover:text-white">{t("aggressive") || "Aggressive"} 2.0%</button>
            </div>

            <NeonInput
              label={t("riskPercentage") || "Risk Percentage (%)"}
              type="number"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
            />
            <NeonInput
              label={t("stopLossPoints") || "Stop Loss (Points)"}
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
            
            <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-slate-500 text-xs mb-1">{t("recommendedLotSize") || "Recommended Lot Size"}</p>
              <p className="text-4xl font-black text-cyan-400 font-mono drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]">
                {isFinite(recommendedLot) ? recommendedLot.toFixed(2) : "0.00"}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {t("risking") || "Risking"} <strong className="text-pink-400">{formatCurrency(riskAmount)}</strong>
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Reverse Risk Calculator */}
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3 mb-5">
              <Shield className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">{t("reverseRiskCalculator") || "Reverse Risk Calculator"}</h2>
            </div>
            
            <div className="space-y-4 pt-10">
              <NeonInput
                label={t("lotSize") || "Lot Size"}
                type="number"
                step="0.01"
                value={revLotSize}
                onChange={(e) => setRevLotSize(e.target.value)}
              />
              <NeonInput
                label={t("stopLossPoints") || "Stop Loss (Points)"}
                type="number"
                value={revStopLoss}
                onChange={(e) => setRevStopLoss(e.target.value)}
              />
              
              <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-500 text-xs">{t("actualRiskPercentage") || "Actual Risk Percentage"}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${riskBadgeColor}`}>
                    {riskBadge}
                  </span>
                </div>
                <p className={`text-4xl font-black font-mono mb-2 ${revRiskPct > 5 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : revRiskPct > 2.5 ? 'text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`}>
                  {isFinite(revRiskPct) ? formatPercent(revRiskPct) : "0.0%"}
                </p>
                <p className="text-sm text-slate-400">
                  {t("risking") || "Risking"} <strong className="text-white">{formatCurrency(revRiskAmount)}</strong>
                </p>
                
                <div className="mt-4 space-y-2 text-left">
                  <p className="text-xs text-slate-500 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-500" />
                    <span>
                      {t("consecutiveLossWarning") || `At this risk level, 3 consecutive losses would cause a ${(revRiskPct * 3).toFixed(1)}% drawdown.`}
                    </span>
                  </p>
                  {isFunded && revRiskPct > 2.5 && (
                    <p className="text-xs text-red-400 flex items-start gap-1.5 bg-red-950/30 p-2 rounded border border-red-900/50 mt-2">
                      <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{t("fundedWarning") || "This lot size is highly likely to violate funded account daily drawdown limits."}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* Weekly Compounding Preview */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-green-400" />
              <h2 className="text-base font-bold text-white">{t("weeklyCompoundingPreview") || "Weekly Compounding Preview"}</h2>
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
                      <tr key={day} className="hover:bg-slate-800/20">
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
            <p className="text-xs text-slate-500 mt-3 text-center">
              {t("weeklySimDesc") || "Projection based on your real consistency score and expected return. Lot size is kept fixed for safety."}
            </p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
