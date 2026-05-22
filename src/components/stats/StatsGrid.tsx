"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { FullStatistics } from "@/lib/stats";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Shield,
  Zap,
  BarChart2,
  Percent,
  Clock,
  RefreshCw,
} from "lucide-react";

interface StatItem {
  key: keyof FullStatistics;
  label: string;
  format: "currency" | "percent" | "number" | "ratio";
  icon: React.ReactNode;
  category: "profit" | "risk" | "streak" | "growth";
}

const statItems: StatItem[] = [
  { key: "totalPnl", label: "Total P&L", format: "currency", icon: <Zap className="h-3.5 w-3.5" />, category: "profit" },
  { key: "totalProfitPct", label: "Total Profit %", format: "percent", icon: <Percent className="h-3.5 w-3.5" />, category: "profit" },
  { key: "dailyProfitPct", label: "Daily Profit %", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "weeklyProfitPct", label: "Weekly Profit %", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "monthlyProfitPct", label: "Monthly Profit %", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "yearlyProfitPct", label: "Yearly Profit %", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "winRate", label: "Win Rate", format: "percent", icon: <Target className="h-3.5 w-3.5" />, category: "profit" },
  { key: "averageRR", label: "Avg Risk/Reward", format: "ratio", icon: <BarChart2 className="h-3.5 w-3.5" />, category: "profit" },
  { key: "drawdown", label: "Current Drawdown", format: "percent", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "maxDrawdown", label: "Max Drawdown", format: "percent", icon: <Shield className="h-3.5 w-3.5" />, category: "risk" },
  { key: "riskExposure", label: "Risk Exposure", format: "percent", icon: <Shield className="h-3.5 w-3.5" />, category: "risk" },
  { key: "profitFactor", label: "Profit Factor", format: "ratio", icon: <BarChart2 className="h-3.5 w-3.5" />, category: "profit" },
  { key: "consistencyScore", label: "Consistency", format: "number", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "avgDailyGain", label: "Avg Daily Gain", format: "currency", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "profit" },
  { key: "avgDailyLoss", label: "Avg Daily Loss", format: "currency", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "maxConsecutiveWins", label: "Max Win Streak", format: "number", icon: <Zap className="h-3.5 w-3.5" />, category: "streak" },
  { key: "maxConsecutiveLosses", label: "Max Loss Streak", format: "number", icon: <Clock className="h-3.5 w-3.5" />, category: "streak" },
  { key: "currentConsecutiveWins", label: "Current Win Streak", format: "number", icon: <Zap className="h-3.5 w-3.5" />, category: "streak" },
  { key: "currentConsecutiveLosses", label: "Current Loss Streak", format: "number", icon: <Clock className="h-3.5 w-3.5" />, category: "streak" },
  { key: "accountGrowth", label: "Account Growth", format: "percent", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "growth" },
  { key: "equityGrowth", label: "Equity Growth", format: "percent", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "growth" },
  { key: "weeklyCompounding", label: "Weekly Compounding", format: "percent", icon: <RefreshCw className="h-3.5 w-3.5" />, category: "growth" },
  { key: "monthlyCompounding", label: "Monthly Compounding", format: "percent", icon: <RefreshCw className="h-3.5 w-3.5" />, category: "growth" },
];

function formatValue(value: number, format: string): string {
  if (!Number.isFinite(value)) return "∞";
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "ratio":
      return value >= 100 ? "∞" : value.toFixed(2);
    default:
      return value.toFixed(value % 1 === 0 ? 0 : 2);
  }
}

function isNegativeMetric(key: keyof FullStatistics): boolean {
  return (
    key === "drawdown" ||
    key === "maxDrawdown" ||
    key === "riskExposure" ||
    key === "avgDailyLoss" ||
    key === "maxConsecutiveLosses" ||
    key === "currentConsecutiveLosses"
  );
}

export function StatsGrid({ stats }: { stats: FullStatistics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {statItems.map((item, i) => {
        const raw = stats[item.key] as number;
        const safeValue = Number.isFinite(raw) ? raw : 0;
        const isNeg = isNegativeMetric(item.key);
        const isPositiveDisplay = isNeg ? safeValue <= 0 : safeValue >= 0;

        const categoryColors = {
          profit: "rgba(0,245,255,0.04)",
          risk: "rgba(255,45,149,0.04)",
          streak: "rgba(176,38,255,0.04)",
          growth: "rgba(57,255,20,0.04)",
        };

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
          >
            <div
              className="glass-card p-4 relative overflow-hidden group hover:border-cyan-400/20 transition-colors"
              style={{ background: categoryColors[item.category] }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 truncate mr-2">{item.label}</p>
                <span
                  className={`shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${
                    isPositiveDisplay ? "text-cyan-400" : "text-pink-400"
                  }`}
                >
                  {item.icon}
                </span>
              </div>
              <motion.p
                className={`text-base font-black font-mono ${
                  isPositiveDisplay ? "text-cyan-300" : "text-pink-400"
                }`}
              >
                <AnimatedNumber
                  value={safeValue}
                  format={(n) => formatValue(n, item.format)}
                />
              </motion.p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
