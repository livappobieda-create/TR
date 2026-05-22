"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { PhaseTracker } from "@/components/accounts/PhaseTracker";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EditAccountModal } from "@/components/accounts/EditAccountModal";
import { DeleteAccountModal } from "@/components/accounts/DeleteAccountModal";
import { useAccounts } from "@/hooks/useAccounts";
import { useSelectedAccount } from "@/hooks/useSelectedAccount";
import { useStats } from "@/hooks/useStats";
import { useLang } from "@/context/LangContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  PenLine,
  BarChart3,
  Play,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Shield,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Zap,
  Edit2,
  Trash2,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  format: (n: number) => string;
  positive?: boolean;
  icon: React.ReactNode;
  delay?: number;
  accentColor?: "cyan" | "purple" | "pink" | "green";
}

function StatCard({ label, value, format, positive, icon, delay = 0, accentColor = "cyan" }: StatCardProps) {
  const { t } = useLang();
  const colors = {
    cyan: { text: "text-cyan-300", border: "border-cyan-500/40", glow: "rgba(0,245,255,0.1)" },
    purple: { text: "text-purple-300", border: "border-purple-500/40", glow: "rgba(176,38,255,0.1)" },
    pink: { text: "text-pink-400", border: "border-pink-500/40", glow: "rgba(255,45,149,0.1)" },
    green: { text: "text-green-400", border: "border-green-500/40", glow: "rgba(57,255,20,0.08)" },
  }[accentColor];

  const isPositive = positive ?? value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div
        className="glass-card p-4 sm:p-5 relative overflow-hidden group"
        style={{ borderTop: `2px solid ${isPositive ? "rgba(0,245,255,0.4)" : "rgba(255,45,149,0.4)"}` }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top, ${colors.glow}, transparent 70%)` }}
        />

        <div className="flex items-start justify-between mb-2 relative">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider leading-tight">{label}</p>
          <span className={`${isPositive ? "text-cyan-400/60" : "text-pink-400/60"} shrink-0`}>{icon}</span>
        </div>

        <p className={`stat-value text-xl sm:text-2xl font-black font-mono relative ${isPositive ? "text-cyan-300" : "text-pink-400"}`}>
          <AnimatedNumber value={value} format={format} />
        </p>

        <div className={`flex items-center gap-1 mt-1.5 text-xs ${isPositive ? "text-green-400" : "text-pink-400"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span className="font-mono">{isPositive ? t("positive") : t("negative")}</span>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  desc,
  color,
  delay,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link href={href}>
        <div className="glass-card p-5 hover:border-cyan-400/30 transition-all duration-300 cursor-pointer group relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `radial-gradient(ellipse at bottom-left, ${color}, transparent 70%)` }}
          />
          <div className="relative">
            <div
              className="inline-flex p-2.5 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300"
              style={{ background: `${color}`, border: `1px solid ${color}` }}
            >
              <Icon className="h-6 w-6 text-cyan-300" />
            </div>
            <h3 className="font-bold text-white mb-1 flex items-center gap-1.5">
              {label}
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" />
            </h3>
            <p className="text-sm text-slate-500">{desc}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { accounts, loading, refresh } = useAccounts();
  const { selectedId, setSelectedId } = useSelectedAccount(accounts);
  const { data, loading: statsLoading, refresh: refreshStats } = useStats(
    selectedId || null
  );
  const { t, isArabic } = useLang();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  function handleAccountDeleted(id: string) {
    refresh();
    if (selectedId === id) {
      setSelectedId("");
    }
  }

  if (!loading && accounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4"
      >
        <div
          className="p-5 sm:p-6 rounded-3xl mb-6 sm:mb-8 relative"
          style={{
            background: "linear-gradient(135deg, rgba(0,245,255,0.1), rgba(176,38,255,0.1))",
            border: "1px solid rgba(0,245,255,0.2)",
            boxShadow: "0 0 60px rgba(0,245,255,0.1), 0 0 120px rgba(176,38,255,0.05)",
          }}
        >
          <Zap className="h-12 w-12 sm:h-16 sm:w-16 text-cyan-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gradient mb-3">{t("noAccountsTitle")}</h2>
        <p className="text-slate-400 mb-8 max-w-sm text-sm sm:text-base">
          {t("noAccountsDesc")}
        </p>
        <Link
          href="/onboarding"
          className="neon-btn flex items-center gap-2 text-sm sm:text-base px-6 sm:px-8 py-3"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("setupAccount")}
        </Link>
      </motion.div>
    );
  }

  const stats = data?.statistics;
  const phase = data?.phaseProgress;
  const account = data?.account;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl font-black text-gradient"
          >
            {t("commandCenter")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-xs sm:text-sm mt-1 flex items-center gap-1.5"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"
              style={{ boxShadow: "0 0 6px #39ff14" }}
            />
            {t("realtimeMath")}
          </motion.p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { refresh(); refreshStats(); }}
            className="text-slate-500 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-cyan-400/5"
            title={t("refreshData")}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Edit / Delete account buttons */}
          {selectedAccount && (
            <>
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-cyan-500/5 border border-transparent hover:border-cyan-500/20"
                title={t("editAccount")}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("editAccount")}</span>
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-pink-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-pink-500/5 border border-transparent hover:border-pink-500/20"
                title={t("deleteAccount")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("deleteAccount")}</span>
              </button>
            </>
          )}

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

      {/* Stats Cards */}
      {statsLoading || !stats ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-28 skeleton" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label={t("currentBalance")}
              value={account!.currentBalance}
              format={formatCurrency}
              positive={account!.currentBalance >= account!.initialBalance}
              icon={<Activity className="h-4 w-4" />}
              delay={0}
              accentColor="cyan"
            />
            <StatCard
              label={t("totalPnl")}
              value={stats.totalPnl}
              format={formatCurrency}
              icon={<Activity className="h-4 w-4" />}
              delay={0.05}
              accentColor={stats.totalPnl >= 0 ? "green" : "pink"}
            />
            <StatCard
              label={t("winRate")}
              value={stats.winRate}
              format={(n) => formatPercent(n)}
              icon={<Target className="h-4 w-4" />}
              delay={0.1}
              accentColor={stats.winRate >= 50 ? "cyan" : "pink"}
            />
            <StatCard
              label={t("accountGrowth")}
              value={stats.accountGrowth}
              format={formatPercent}
              icon={<TrendingUp className="h-4 w-4" />}
              delay={0.15}
              accentColor={stats.accountGrowth >= 0 ? "cyan" : "pink"}
            />
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: t("maxDrawdown"), value: stats.maxDrawdown, fmt: formatPercent, color: "text-orange-400" },
              { label: t("profitFactor"), value: Number.isFinite(stats.profitFactor) ? stats.profitFactor : 0, fmt: (n: number) => n >= 99 ? "∞" : n.toFixed(2), color: "text-cyan-300" },
              { label: t("weeklyPct"), value: stats.weeklyProfitPct, fmt: formatPercent, color: stats.weeklyProfitPct >= 0 ? "text-green-400" : "text-pink-400" },
              { label: t("monthlyPct"), value: stats.monthlyProfitPct, fmt: formatPercent, color: stats.monthlyProfitPct >= 0 ? "text-green-400" : "text-pink-400" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
              >
                <div className="glass-card p-3 sm:p-4">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={`text-base sm:text-lg font-black font-mono ${item.color}`}>
                    <AnimatedNumber value={item.value} format={item.fmt} />
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Equity sparkline */}
          {data!.equityCurve.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    {t("equityCurve")} — {data!.equityCurve.length} {t("tradingDays")}
                  </h2>
                  <Link href="/equity-replay" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    {t("replay")} <Play className="h-3 w-3" />
                  </Link>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data!.equityCurve}>
                      <defs>
                        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#00f5ff" />
                          <stop offset="60%" stopColor="#b026ff" />
                          <stop offset="100%" stopColor="#ff2d95" />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        stroke="#334155"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        stroke="#334155"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(3,7,18,0.95)",
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
                        stroke="url(#lineGrad)"
                        strokeWidth={2.5}
                        fill="url(#eqGrad)"
                        dot={false}
                        animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Phase Tracker */}
          {phase && account?.isFunded && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <GlassCard>
                <div className="flex items-center gap-3 mb-5">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-gradient">
                    {t("phaseTracker")} — {account.phase.replace(/_/g, " ")}
                  </h2>
                  {account.isFunded && (
                    <span className="badge badge-cyan ml-auto">{t("fundedLabel")}</span>
                  )}
                </div>
                <PhaseTracker
                  currentPhase={account.phase}
                  progress={phase}
                />
              </GlassCard>
            </motion.div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3"
        >
          {t("quickActions")}
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/daily-entry"
            icon={PenLine}
            label={t("dailyEntry")}
            desc={t("dailyEntryDesc")}
            color="rgba(0,245,255,0.08)"
            delay={0.42}
          />
          <QuickActionCard
            href="/analytics"
            icon={BarChart3}
            label={t("analyticsTitle")}
            desc={t("analyticsDesc")}
            color="rgba(176,38,255,0.08)"
            delay={0.46}
          />
          <QuickActionCard
            href="/equity-replay"
            icon={Play}
            label={t("equityReplayTitle")}
            desc={t("equityReplayDesc")}
            color="rgba(255,45,149,0.06)"
            delay={0.5}
          />
        </div>
      </div>

      {/* Footer stat strip */}
      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
        >
          {[
            { label: t("consistencyScore"), value: stats.consistencyScore.toFixed(0), suffix: "/100" },
            { label: t("avgWinDay"), value: formatCurrency(stats.avgDailyGain) },
            { label: t("maxWinStreak"), value: String(stats.maxConsecutiveWins), suffix: ` ${t("tradingDays")}` },
            { label: t("riskExposure"), value: formatPercent(stats.riskExposure) },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-slate-500 mb-0.5">{s.label}</p>
              <p className="text-sm font-black font-mono text-cyan-300">
                {s.value}{s.suffix ?? ""}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Account Management Modals ─────────────────────── */}
      {selectedAccount && (
        <>
          <EditAccountModal
            account={selectedAccount}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => {
              refresh();
              refreshStats();
            }}
          />
          <DeleteAccountModal
            account={selectedAccount}
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onDeleted={handleAccountDeleted}
          />
        </>
      )}
    </div>
  );
}
