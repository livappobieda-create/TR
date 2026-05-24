"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Info, Calculator, Database, Target } from "lucide-react";
import { useLang } from "@/context/LangContext";
import type { TranslationKey } from "@/lib/i18n";
import type { AnalyticsMetrics } from "@/lib/analytics";

export interface MetricDetail {
  key: keyof AnalyticsMetrics;
  labelKey: TranslationKey;
  value: string;
  isPositiveDisplay: boolean;
}

interface MetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricDetail | null;
}

export function MetricModal({ isOpen, onClose, metric }: MetricModalProps) {
  const { t, lang } = useLang();
  const isRtl = lang === "ar";

  if (!metric) return null;

  const descKey = `desc_${metric.key}` as TranslationKey;
  const formKey = `form_${metric.key}` as TranslationKey;

  // Determine source type based on metric
  let sourceType = "sourceTrades";
  if (
    [
      "profitableDaysPct",
      "averageDailyGain",
      "averageDailyLoss",
      "currentDrawdown",
      "maxDrawdown",
      "equityGrowthPct",
      "weeklyCompoundGrowth",
      "monthlyCompoundGrowth",
    ].includes(metric.key)
  ) {
    sourceType = "sourceDaily";
  } else if (metric.key === "netProfit" || metric.key === "currentBalance") {
    sourceType = "sourceMixed";
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              dir={isRtl ? "rtl" : "ltr"}
              className="w-full max-w-md glass-panel p-6 pointer-events-auto shadow-2xl shadow-cyan-900/20 border border-cyan-500/30"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {t(metric.labelKey as TranslationKey)}
                  </h2>
                  <div className="text-3xl font-mono font-black text-cyan-400">
                    {metric.value}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6">
                {/* Meaning */}
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 mb-2 text-sm font-medium">
                    <Info className="h-4 w-4" />
                    {t("meaningLabel" as any)}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {t(descKey) || "Description not available."}
                  </p>
                </div>

                {/* Formula */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-2 text-purple-400 mb-2 text-sm font-medium">
                    <Calculator className="h-4 w-4" />
                    {t("formulaLabel" as any)}
                  </div>
                  <code className="text-slate-200 font-mono text-sm block bg-black/40 p-2 rounded border border-slate-800">
                    {t(formKey) || "Formula not available."}
                  </code>
                </div>

                {/* Data Source */}
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-2 text-sm font-medium">
                    <Database className="h-4 w-4" />
                    {t("sourceLabel" as any)}
                  </div>
                  <div className="text-slate-300 text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 opacity-50" />
                    {t(sourceType as TranslationKey)}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
