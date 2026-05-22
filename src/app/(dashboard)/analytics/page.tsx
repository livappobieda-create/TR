"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { useStats } from "@/hooks/useStats";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Activity,
  Shield,
  ChevronDown,
} from "lucide-react";

type Period = "7d" | "30d" | "90d" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "all", label: "All" },
];

export default function AnalyticsPage() {
  const { accounts, loading } = useAccounts();
  const [selectedId, setSelectedId] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const { data, loading: statsLoading } = useStats(selectedId || null);

  useEffect(() => {
    if (accounts.length && !selectedId) setSelectedId(accounts[0].id);
  }, [accounts, selectedId]);

  if (!loading && accounts.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-slate-400 mb-4">No accounts yet.</p>
        <Link href="/onboarding" className="neon-btn inline-block">
          Set Up Account
        </Link>
      </GlassCard>
    );
  }

  const filterByPeriod = (curve: Array<{ date: string; balance: number; pnl: number; pnlPct: number }> | undefined) => {
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
          <h1 className="text-3xl font-black text-gradient">Analytics Engine</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Pure mathematical formulas — zero AI — 20+ metrics
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
                {p.label}
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
                  <h2 className="text-base font-bold text-gradient">Funded Account Phase</h2>
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
                <h2 className="text-base font-bold text-white">Equity Curve</h2>
                <span className="text-xs text-slate-500 ml-auto font-mono">
                  {filteredCurve.length} days
                </span>
              </div>
              {filteredCurve.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Add more daily entries to see the equity curve.
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
                        formatter={(v: number) => [formatCurrency(v), "Balance"]}
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
                  <h2 className="text-base font-bold text-white">Daily P&L</h2>
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
                          v >= 0 ? "Profit" : "Loss",
                        ]}
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                      />
                      <Bar
                        dataKey="pnl"
                        radius={[3, 3, 0, 0]}
                        fill="#00f5ff"
                        style={{ filter: "url(#glow)" }}
                      />
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
                <h2 className="text-base font-bold text-white">Performance Summary</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "This Week", value: data.statistics.weeklyProfitPct, fmt: formatPercent },
                  { label: "This Month", value: data.statistics.monthlyProfitPct, fmt: formatPercent },
                  { label: "This Year", value: data.statistics.yearlyProfitPct, fmt: formatPercent },
                  { label: "All Time", value: data.statistics.totalProfitPct, fmt: formatPercent },
                ].map((item) => (
                  <div key={item.label} className="glass-card p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p
                      className={`text-xl font-black font-mono ${
                        item.value >= 0 ? "text-cyan-300" : "text-pink-400"
                      }`}
                    >
                      <AnimatedNumber value={item.value} format={item.fmt} />
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Full stats grid */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Complete Statistics</h2>
              <span className="badge badge-cyan ml-auto">21 metrics</span>
            </div>
            <StatsGrid stats={data.statistics} />
          </motion.div>
        </>
      )}
    </div>
  );
}
