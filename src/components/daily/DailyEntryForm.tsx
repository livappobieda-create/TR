"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  TrendingUp,
  TrendingDown,
  Zap,
  Calendar,
  DollarSign,
  Percent,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonInput } from "@/components/ui/NeonInput";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { computeDailyMetrics } from "@/lib/stats";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useLang } from "@/context/LangContext";

interface DailyEntryFormProps {
  accountId: string;
  defaultStartBalance?: number;
  onSaved?: () => void;
}

export function DailyEntryForm({
  accountId,
  defaultStartBalance = 0,
  onSaved,
}: DailyEntryFormProps) {
  const { t, isArabic } = useLang();
  const [startBalance, setStartBalance] = useState(
    String(defaultStartBalance || "")
  );
  const [endBalance, setEndBalance] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [metrics, setMetrics] = useState<ReturnType<typeof computeDailyMetrics> | null>(null);

  const start = parseFloat(startBalance) || 0;
  const end = parseFloat(endBalance) || 0;

  useEffect(() => {
    if (endBalance && start > 0) {
      setMetrics(computeDailyMetrics(start, end));
    } else {
      setMetrics(null);
    }
  }, [start, end, endBalance]);

  const save = useCallback(async () => {
    if (!endBalance || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/daily-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          startBalance: start,
          endBalance: end,
          date,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setEndBalance("");
        setStartBalance(String(end));
        setTimeout(() => {
          setSuccess(false);
          onSaved?.();
        }, 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [accountId, start, end, endBalance, date, onSaved, saving]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") save();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  const weeklyEst = metrics ? metrics.dailyPnlPct * 5 : 0;
  const monthlyEst = metrics ? metrics.dailyPnlPct * 22 : 0;

  const isProfit = metrics ? metrics.dailyPnl >= 0 : null;

  return (
    <GlassCard
      className={`max-w-2xl mx-auto relative overflow-hidden transition-all duration-500 ${
        success
          ? "glass-card-success"
          : isProfit === true
          ? "border-green-500/20"
          : isProfit === false
          ? "border-pink-500/20"
          : ""
      }`}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-500"
        style={{
          background: success
            ? "linear-gradient(90deg, transparent, #39ff14, transparent)"
            : isProfit === true
            ? "linear-gradient(90deg, transparent, #00f5ff, transparent)"
            : isProfit === false
            ? "linear-gradient(90deg, transparent, #ff2d95, transparent)"
            : "linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent)",
        }}
      />

      <div className="flex items-center gap-3 mb-6">
        <div
          className="p-2 rounded-xl shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(176,38,255,0.15))",
            border: "1px solid rgba(0,245,255,0.2)",
          }}
        >
          <Zap className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gradient">{t("oneClickEntry")}</h2>
          <p className="text-xs text-slate-500">{t("oneClickHint")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <NeonInput
          label={t("date")}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          icon={<Calendar className="h-4 w-4" />}
        />
        <NeonInput
          label={t("startBalance")}
          type="number"
          step="0.01"
          value={startBalance}
          onChange={(e) => setStartBalance(e.target.value)}
          placeholder="10000.00"
          autoFocus
          icon={<DollarSign className="h-4 w-4" />}
        />
        <NeonInput
          label={t("endBalance")}
          type="number"
          step="0.01"
          value={endBalance}
          onChange={(e) => setEndBalance(e.target.value)}
          placeholder="10250.00"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      {/* Live metrics */}
      <AnimatePresence>
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5"
          >
            {/* Big PnL display */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`rounded-xl p-4 mb-4 text-center ${
                metrics.dailyPnl >= 0
                  ? "bg-green-500/5 border border-green-500/20"
                  : "bg-pink-500/5 border border-pink-500/20"
              }`}
            >
              <p className="text-xs text-slate-500 mb-1">{t("dailyPnl")}</p>
              <p
                className={`text-4xl font-black font-mono ${
                  metrics.dailyPnl >= 0 ? "text-green-400" : "text-pink-400"
                }`}
                style={{
                  textShadow: metrics.dailyPnl >= 0
                    ? "0 0 20px rgba(57,255,20,0.4)"
                    : "0 0 20px rgba(255,45,149,0.4)",
                }}
              >
                <AnimatedNumber
                  value={metrics.dailyPnl}
                  format={formatCurrency}
                />
              </p>
              <p className={`text-base font-bold font-mono mt-1 ${
                metrics.dailyPnlPct >= 0 ? "text-green-400/70" : "text-pink-400/70"
              }`}>
                <AnimatedNumber
                  value={metrics.dailyPnlPct}
                  format={formatPercent}
                />
              </p>
            </motion.div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  labelKey: "equityChange",
                  value: metrics.equityChange,
                  fmt: formatCurrency,
                  pos: metrics.equityChange >= 0,
                },
                {
                  labelKey: "dailyPct",
                  value: metrics.dailyPnlPct,
                  fmt: formatPercent,
                  pos: metrics.dailyPnlPct >= 0,
                },
                {
                  labelKey: "estWeekly",
                  value: weeklyEst,
                  fmt: formatPercent,
                  pos: weeklyEst >= 0,
                },
                {
                  labelKey: "estMonthly",
                  value: monthlyEst,
                  fmt: formatPercent,
                  pos: monthlyEst >= 0,
                },
              ].map((item) => (
                <div
                  key={item.labelKey}
                  className="glass-card p-3 flex items-center gap-2"
                >
                  {item.pos ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate text-start">
                      {t(item.labelKey as any)}
                    </p>
                    <p
                      className={`font-mono font-bold text-sm text-start ${
                        item.pos ? "text-green-400" : "text-pink-400"
                      }`}
                    >
                      <AnimatedNumber value={item.value} format={item.fmt} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save button */}
      <motion.button
        type="button"
        onClick={save}
        disabled={saving || !endBalance || success}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
          success ? "neon-btn neon-btn-success" : "neon-btn"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.span
              key="ok"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="flex items-center gap-2"
            >
              <Check className="h-5 w-5 shrink-0" />
              {t("entrySaved")}
            </motion.span>
          ) : saving ? (
            <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
              {t("saving")}
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0" />
              {t("saveRefresh")}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {!endBalance && (
        <p className="text-center text-xs text-slate-600 mt-2">
          {t("oneClickHint")}
        </p>
      )}
    </GlassCard>
  );
}
