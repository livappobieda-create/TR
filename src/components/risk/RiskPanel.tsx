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
}

export function RiskPanel({ currentBalance, consistencyScore, winRate }: RiskPanelProps) {
  const { t } = useLang();
  const [riskPct, setRiskPct] = useState("1.0");
  const [stopLoss, setStopLoss] = useState("100");
  const [isGold, setIsGold] = useState(false);
  
  const [revLotSize, setRevLotSize] = useState("0.10");
  const [revStopLoss, setRevStopLoss] = useState("100");
  
  // Normal forex: 1 point = $1 on 1 lot
  // Gold (User specified): 100 points = $10 on 0.01 lot => 1 point = $10 on 1 lot
  const multiplier = isGold ? 10 : 1;

  // --- Calculator 1: Risk to Lot ---
  const riskAmount = currentBalance * (parseFloat(riskPct || "0") / 100);
  const slPoints = parseFloat(stopLoss || "1") || 1;
  const recommendedLot = riskAmount / (slPoints * multiplier);

  // --- Calculator 2: Lot to Risk ---
  const rLot = parseFloat(revLotSize || "0");
  const rSl = parseFloat(revStopLoss || "1") || 1;
  const revRiskAmount = rLot * rSl * multiplier;
  const revRiskPct = (revRiskAmount / currentBalance) * 100;

  // --- Live Summary Engine ---
  // Adjust suggested risk based on consistency and win rate
  let suggestedRiskPct = 1.0;
  if (consistencyScore > 80 && winRate > 50) suggestedRiskPct = 1.5;
  if (consistencyScore < 50 || winRate < 40) suggestedRiskPct = 0.5;

  const safeRiskAmount = currentBalance * (suggestedRiskPct / 100);
  const suggestedMaxTrades = Math.floor(5 / suggestedRiskPct); // Max 5% daily drawdown
  const safeLot = safeRiskAmount / (100 * multiplier); // Assume 100 points SL for safe lot

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
                <p className="text-slate-500 text-xs mb-1">{t("actualRiskPercentage") || "Actual Risk Percentage"}</p>
                <p className={`text-4xl font-black font-mono ${revRiskPct > 3 ? 'text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]'}`}>
                  {isFinite(revRiskPct) ? formatPercent(revRiskPct) : "0.0%"}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {t("risking") || "Risking"} <strong className="text-pink-400">{formatCurrency(revRiskAmount)}</strong>
                </p>
                {revRiskPct > 3 && (
                  <p className="text-xs text-pink-500 mt-2 flex justify-center items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {t("highRiskExposure") || "High Risk Exposure"}
                  </p>
                )}
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
                    // Estimate balance growth by suggested Risk target
                    const rPct = parseFloat(riskPct || "1") / 100;
                    // Assume winning 1 RR per day for aggressive compounding preview
                    const dayBalance = currentBalance * Math.pow(1 + rPct, day - 1);
                    const dayLot = (dayBalance * rPct) / (slPoints * multiplier);
                    
                    return (
                      <tr key={day} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 text-slate-300">{t("dayLabel") || "Day"} {day}</td>
                        <td className="px-4 py-3 font-mono text-cyan-300">{formatCurrency(dayBalance)}</td>
                        <td className="px-4 py-3 text-right font-mono text-green-400">{isFinite(dayLot) ? dayLot.toFixed(2) : "0.00"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              {t("assumes1RPerDay") || "Assumes +1R per day hitting target continuously"}
            </p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
