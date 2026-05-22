"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { FullStatistics } from "@/lib/stats";
import { useLang } from "@/context/LangContext";
import type { TranslationKey } from "@/lib/i18n";
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
  labelKey: TranslationKey;
  format: "currency" | "percent" | "number" | "ratio";
  icon: React.ReactNode;
  category: "profit" | "risk" | "streak" | "growth";
}

const statItems: StatItem[] = [
  { key: "totalPnl", labelKey: "statTotalPnl", format: "currency", icon: <Zap className="h-3.5 w-3.5" />, category: "profit" },
  { key: "totalProfitPct", labelKey: "statTotalProfitPct", format: "percent", icon: <Percent className="h-3.5 w-3.5" />, category: "profit" },
  { key: "dailyProfitPct", labelKey: "statDailyProfitPct", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "weeklyProfitPct", labelKey: "statWeeklyProfitPct", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "monthlyProfitPct", labelKey: "statMonthlyProfitPct", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "yearlyProfitPct", labelKey: "statYearlyProfitPct", format: "percent", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "winRate", labelKey: "statWinRate", format: "percent", icon: <Target className="h-3.5 w-3.5" />, category: "profit" },
  { key: "averageRR", labelKey: "statAvgRR", format: "ratio", icon: <BarChart2 className="h-3.5 w-3.5" />, category: "profit" },
  { key: "drawdown", labelKey: "statCurrentDrawdown", format: "percent", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "maxDrawdown", labelKey: "statMaxDrawdown", format: "percent", icon: <Shield className="h-3.5 w-3.5" />, category: "risk" },
  { key: "riskExposure", labelKey: "statRiskExposure", format: "percent", icon: <Shield className="h-3.5 w-3.5" />, category: "risk" },
  { key: "profitFactor", labelKey: "statProfitFactor", format: "ratio", icon: <BarChart2 className="h-3.5 w-3.5" />, category: "profit" },
  { key: "consistencyScore", labelKey: "statConsistency", format: "number", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "avgDailyGain", labelKey: "statAvgDailyGain", format: "currency", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "profit" },
  { key: "avgDailyLoss", labelKey: "statAvgDailyLoss", format: "currency", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "maxConsecutiveWins", labelKey: "statMaxWinStreak", format: "number", icon: <Zap className="h-3.5 w-3.5" />, category: "streak" },
  { key: "maxConsecutiveLosses", labelKey: "statMaxLossStreak", format: "number", icon: <Clock className="h-3.5 w-3.5" />, category: "streak" },
  { key: "currentConsecutiveWins", labelKey: "statCurrentWinStreak", format: "number", icon: <Zap className="h-3.5 w-3.5" />, category: "streak" },
  { key: "currentConsecutiveLosses", labelKey: "statCurrentLossStreak", format: "number", icon: <Clock className="h-3.5 w-3.5" />, category: "streak" },
  { key: "accountGrowth", labelKey: "statAccountGrowth", format: "percent", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "growth" },
  { key: "equityGrowth", labelKey: "statEquityGrowth", format: "percent", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "growth" },
  { key: "weeklyCompounding", labelKey: "statWeeklyCompounding", format: "percent", icon: <RefreshCw className="h-3.5 w-3.5" />, category: "growth" },
  { key: "monthlyCompounding", labelKey: "statMonthlyCompounding", format: "percent", icon: <RefreshCw className="h-3.5 w-3.5" />, category: "growth" },
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
  const { t } = useLang();
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
                <p className="text-xs text-slate-500 truncate mr-2">{t(item.labelKey)}</p>
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
