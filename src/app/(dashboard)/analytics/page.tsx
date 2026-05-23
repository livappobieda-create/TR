"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { StatsGrid } from "@/components/stats/StatsGrid";
import { PhaseTracker } from "@/components/accounts/PhaseTracker";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useAccounts } from "@/hooks/useAccounts";
import { useSelectedAccount } from "@/hooks/useSelectedAccount";
import { useStats } from "@/hooks/useStats";
import { useLang } from "@/context/LangContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Activity,
  Shield,
} from "lucide-react";

type Period = "7d" | "30d" | "90d" | "all";

export default function AnalyticsPage() {
  const { accounts, loading } = useAccounts();
  const { selectedId, setSelectedId } = useSelectedAccount(accounts);
  const [period, setPeriod] = useState<Period>("all");
  const { data, loading: statsLoading } = useStats(selectedId || null);
  const { t } = useLang();

  const PERIODS: { value: Period; labelKey: "period7d" | "period30d" | "period90d" | "periodAll" }[] = [
    { value: "7d", labelKey: "period7d" },
    { value: "30d", labelKey: "period30d" },
    { value: "90d", labelKey: "period90d" },
    { value: "all", labelKey: "periodAll" },
  ];

  if (!loading && accounts.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-slate-400 mb-4">{t("noAccountsYet")}</p>
        <Link href="/onboarding" className="neon-btn inline-block">
          {t("setupAccountBtn")}
        </Link>
      </GlassCard>
    );
  }

  const filterByPeriod = (curve: Array<{ date: string; balance: number; pnl: number }> | undefined) => {
    if (!curve || period === "all") return curve ?? [];
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return curve.filter((p) => new Date(p.date) >= cutoff);
  };

  const filteredCurve = filterByPeriod(data?.equityCurve ?? []);

  const pnlBarData = filteredCurve.map((p) => ({
    date: p.date,
    pnl: p.pnl,
    fill: p.pnl >= 0 ? "#00f5ff" : "#ff2d95",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gradient">{t("analyticsTitle")}</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {t("analyticsSubtitleFull")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          <AccountSelector
            accounts={accounts.map((a) => ({
              id: a.id,
              name: a.name,
              currentBalance: a.currentBalance,
              isFunded: a.isFunded,
            }))}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {statsLoading || !data ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-48 skeleton" />
          ))}
        </div>
      ) : (
        <>
          {/* Phase tracker */}
          {data.phaseProgress && data.account.isFunded && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard>
                <div className="flex items-center gap-3 mb-5">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-gradient">{t("fundedAccountPhase")}</h2>
                  <span className="badge badge-purple ml-auto">
                    {data.account.phase.replace(/_/g, " ")}
                  </span>
                </div>
                <PhaseTracker
                  currentPhase={data.account.phase}
                  progress={data.phaseProgress}
                />
              </GlassCard>
            </motion.div>
          )}

          {/* Equity curve */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <GlassCard>
              <div className="flex items-center gap-3 mb-5">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">{t("equityCurve")}</h2>
                <span className="text-xs text-slate-500 ml-auto font-mono">
                  {filteredCurve.length} {t("tradingDays")}
                </span>
              </div>
              {filteredCurve.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  {t("addMoreEntries")}
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredCurve}>
                      <defs>
                        <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="equityLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#00f5ff" />
                          <stop offset="60%" stopColor="#b026ff" />
                          <stop offset="100%" stopColor="#ff2d95" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        }
                        stroke="#334155"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: "#1e293b" }}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        stroke="#334155"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: "#1e293b" }}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(3,7,18,0.97)",
                          border: "1px solid rgba(0,245,255,0.25)",
                          borderRadius: 10,
                          fontSize: 12,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                        formatter={(v: number) => [formatCurrency(v), t("balance")]}
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="url(#equityLine)"
                        strokeWidth={2.5}
                        fill="url(#equityFill)"
                        dot={false}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Daily PnL bars */}
          {pnlBarData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard>
                <div className="flex items-center gap-3 mb-5">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white">{t("dailyPnlChart")}</h2>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pnlBarData} barSize={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        }
                        stroke="#334155"
                        fontSize={9}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => formatCurrency(v)}
                        stroke="#334155"
                        fontSize={9}
                        tickLine={false}
                        width={70}
                      />
                      <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(3,7,18,0.97)",
                          border: "1px solid rgba(0,245,255,0.25)",
                          borderRadius: 10,
                          fontSize: 12,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                        formatter={(v: number) => [
                          formatCurrency(v),
                          v >= 0 ? t("profit") : t("loss"),
                        ]}
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                      />
                      <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                        {pnlBarData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.pnl >= 0 ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)"} 
                            style={{ filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))" }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Performance summary */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard>
              <div className="flex items-center gap-3 mb-5">
                <Calendar className="h-5 w-5 text-pink-400" />
                <h2 className="text-base font-bold text-white">{t("performanceSummary")}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { labelKey: "expectedNextWeek", value: data.statistics.expectedBalanceNextWeek, fmt: formatCurrency, color: "text-cyan-300" },
                  { labelKey: "expectedWeeklyProfit", value: data.statistics.expectedWeeklyProfit, fmt: formatCurrency, color: "text-green-400" },
                  { labelKey: "expectedNextMonth", value: data.statistics.expectedBalanceNextMonth, fmt: formatCurrency, color: "text-purple-400" },
                  { labelKey: "expectedMonthlyProfit", value: data.statistics.expectedMonthlyProfit, fmt: formatCurrency, color: "text-green-400" },
                ].map((item) => (
                  <div key={item.labelKey} className="glass-card p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">{t(item.labelKey as any) || item.labelKey}</p>
                    <p className={`text-xl font-black font-mono ${item.color}`}>
                      <AnimatedNumber value={item.value} format={item.fmt} />
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {t("basedOnAvg") || "Based on smoothed growth factor"} <span className="font-bold text-slate-300">{formatPercent(data.statistics.weeklyCompoundGrowth)}</span>
              </p>
            </GlassCard>
          </motion.div>

          {/* Full stats grid */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">{t("completeStats")}</h2>
              <span className="badge badge-cyan ml-auto">20 {t("metrics")}</span>
            </div>
            <StatsGrid stats={data.statistics} />
          </motion.div>
        </>
      )}
    </div>
  );
}
