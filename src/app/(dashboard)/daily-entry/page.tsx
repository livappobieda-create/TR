"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DailyEntryForm } from "@/components/daily/DailyEntryForm";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useAccounts } from "@/hooks/useAccounts";
import { useSelectedAccount } from "@/hooks/useSelectedAccount";
import { useStats } from "@/hooks/useStats";
import { StatsGrid } from "@/components/stats/StatsGrid";
import { useLang } from "@/context/LangContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useState } from "react";
import { PenLine, TrendingUp, TrendingDown, Zap, Calendar } from "lucide-react";

export default function DailyEntryPage() {
  const { accounts, loading, refresh } = useAccounts();
  const { selectedId, setSelectedId } = useSelectedAccount(accounts);
  const { data, refresh: refreshStats } = useStats(selectedId || null);
  const [showStats, setShowStats] = useState(false);
  const { t } = useLang();

  const account = accounts.find((a) => a.id === selectedId);

  if (!loading && accounts.length === 0) {
    return (
      <GlassCard className="text-center py-16">
        <Zap className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
        <p className="text-slate-400 mb-6">{t("createAccountFirst")}</p>
        <Link href="/onboarding" className="neon-btn inline-block">
          {t("setupAccountBtn")}
        </Link>
      </GlassCard>
    );
  }

  const stats = data?.statistics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gradient flex items-center gap-3">
          <PenLine className="h-8 w-8 text-cyan-400" />
          {t("dailyEntryTitle")}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {t("dailyEntrySubtitle")}
        </p>
        <div className="mt-4">
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

      {/* Quick stats strip */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            {
              labelKey: "today" as const,
              value: stats.dailyProfitPct,
              fmt: formatPercent,
              pos: stats.dailyProfitPct >= 0,
            },
            {
              labelKey: "thisWeek" as const,
              value: stats.weeklyProfitPct,
              fmt: formatPercent,
              pos: stats.weeklyProfitPct >= 0,
            },
            {
              labelKey: "thisMonth" as const,
              value: stats.monthlyProfitPct,
              fmt: formatPercent,
              pos: stats.monthlyProfitPct >= 0,
            },
            {
              labelKey: "totalPnl" as const,
              value: stats.totalPnl,
              fmt: formatCurrency,
              pos: stats.totalPnl >= 0,
            },
          ].map((item, i) => (
            <motion.div
              key={item.labelKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="glass-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{t(item.labelKey)}</span>
                  {item.pos ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-pink-400" />
                  )}
                </div>
                <p
                  className={`text-base font-black font-mono ${
                    item.pos ? "text-cyan-300" : "text-pink-400"
                  }`}
                >
                  <AnimatedNumber value={item.value} format={item.fmt} />
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Entry form */}
      {account && (
        <DailyEntryForm
          accountId={account.id}
          defaultStartBalance={account.currentBalance}
          onSaved={() => {
            refresh();
            refreshStats();
            setShowStats(true);
          }}
        />
      )}

      {/* Stats toggle */}
      {stats && (
        <div>
          <button
            onClick={() => setShowStats((s) => !s)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition-colors mb-4"
          >
            <span>{showStats ? t("hideStats") : t("showStats")}</span>
            <motion.span
              animate={{ rotate: showStats ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Calendar className="h-4 w-4" />
            </motion.span>
          </button>

          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  {t("updatedStatistics")}
                </h2>
                <StatsGrid stats={stats} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
