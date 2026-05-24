"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { AnalyticsMetrics } from "@/lib/analytics";
import { useLang } from "@/context/LangContext";
import type { TranslationKey } from "@/lib/i18n";
import { MetricModal, type MetricDetail } from "./MetricModal";
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
  key: keyof AnalyticsMetrics;
  labelKey: TranslationKey;
  format: "currency" | "percent" | "number" | "ratio";
  icon: React.ReactNode;
  category: "profit" | "risk" | "streak" | "growth";
}

const statItems: StatItem[] = [
  { key: "netProfit", labelKey: "statTotalPnl", format: "currency", icon: <Zap className="h-3.5 w-3.5" />, category: "profit" },
  { key: "grossProfit", labelKey: "statGrossProfit" as any, format: "currency", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "grossLoss", labelKey: "statGrossLoss" as any, format: "currency", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "winRate", labelKey: "statWinRate", format: "percent", icon: <Target className="h-3.5 w-3.5" />, category: "profit" },
  { key: "averageRR", labelKey: "statAvgRR", format: "ratio", icon: <BarChart2 className="h-3.5 w-3.5" />, category: "profit" },
  { key: "currentDrawdown", labelKey: "statCurrentDrawdown", format: "percent", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "maxDrawdown", labelKey: "statMaxDrawdown", format: "percent", icon: <Shield className="h-3.5 w-3.5" />, category: "risk" },
  { key: "profitFactor", labelKey: "statProfitFactor", format: "ratio", icon: <BarChart2 className="h-3.5 w-3.5" />, category: "profit" },
  { key: "consistencyScore", labelKey: "statConsistency", format: "number", icon: <Activity className="h-3.5 w-3.5" />, category: "profit" },
  { key: "averageWin", labelKey: "statAvgTradeWin" as any, format: "currency", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "profit" },
  { key: "averageLoss", labelKey: "statAvgTradeLoss" as any, format: "currency", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "averageDailyGain", labelKey: "statAvgDailyGain", format: "currency", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "profit" },
  { key: "averageDailyLoss", labelKey: "statAvgDailyLoss", format: "currency", icon: <TrendingDown className="h-3.5 w-3.5" />, category: "risk" },
  { key: "totalTrades", labelKey: "statTotalTrades" as any, format: "number", icon: <BarChart2 className="h-3.5 w-3.5" />, category: "profit" },
  { key: "winningTrades", labelKey: "statWinningTrades" as any, format: "number", icon: <Zap className="h-3.5 w-3.5" />, category: "streak" },
  { key: "losingTrades", labelKey: "statLosingTrades" as any, format: "number", icon: <Clock className="h-3.5 w-3.5" />, category: "streak" },
  { key: "profitableDaysPct", labelKey: "statProfitableDays" as any, format: "percent", icon: <Target className="h-3.5 w-3.5" />, category: "profit" },
  { key: "winningStreak", labelKey: "statMaxWinStreak", format: "number", icon: <Zap className="h-3.5 w-3.5" />, category: "streak" },
  { key: "losingStreak", labelKey: "statMaxLossStreak", format: "number", icon: <Clock className="h-3.5 w-3.5" />, category: "streak" },
  { key: "equityGrowthPct", labelKey: "statAccountGrowth", format: "percent", icon: <TrendingUp className="h-3.5 w-3.5" />, category: "growth" },
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

function isNegativeMetric(key: keyof AnalyticsMetrics): boolean {
  return (
    key === "currentDrawdown" ||
    key === "maxDrawdown" ||
    key === "averageLoss" ||
    key === "averageDailyLoss" ||
    key === "losingStreak" ||
    key === "grossLoss" ||
    key === "losingTrades"
  );
}

export function StatsGrid({ stats }: { stats: AnalyticsMetrics }) {
  const { t } = useLang();
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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

          const label = t(item.labelKey) || item.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const formattedValue = formatValue(safeValue, item.format);

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
            >
              <button
                onClick={() => setSelectedMetric({
                  key: item.key,
                  labelKey: item.labelKey,
                  value: formattedValue,
                  isPositiveDisplay
                })}
                className="w-full text-left glass-card p-4 relative overflow-hidden group hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(0,245,255,0.1)] transition-all cursor-pointer"
                style={{ background: categoryColors[item.category] }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 truncate mr-2">{label}</p>
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
              </button>
            </motion.div>
          );
        })}
      </div>

      <MetricModal 
        isOpen={selectedMetric !== null} 
        onClose={() => setSelectedMetric(null)} 
        metric={selectedMetric} 
      />
    </>
  );
}
