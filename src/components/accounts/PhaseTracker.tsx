"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Target,
  Shield,
  Clock,
  TrendingDown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseProgress } from "@/lib/stats";

const PHASES = [
  { key: "CHALLENGE_PHASE_1", label: "Phase 1", shortLabel: "P1" },
  { key: "CHALLENGE_PHASE_2", label: "Phase 2", shortLabel: "P2" },
  { key: "FUNDED", label: "Funded", shortLabel: "✓" },
];

interface PhaseTrackerProps {
  currentPhase: string;
  progress: PhaseProgress;
}

function NeonProgressBar({
  value,
  label,
  colorClass,
  warning,
  sublabel,
}: {
  value: number;
  label: string;
  colorClass: string;
  warning?: boolean;
  sublabel?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {sublabel && <span className="text-slate-600 font-mono text-[10px]">{sublabel}</span>}
          <span
            className={`font-mono font-bold ${
              warning ? "text-orange-400" : pct >= 90 ? "text-green-400" : "text-cyan-300"
            }`}
          >
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
        <motion.div
          className={cn("h-full rounded-full", colorClass, warning && "warning-glow")}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            boxShadow: warning
              ? "0 0 12px rgba(255, 107, 53, 0.6)"
              : "0 0 8px rgba(0, 245, 255, 0.4)",
          }}
        />
        {/* Shimmer */}
        {!warning && pct > 5 && (
          <motion.div
            className="absolute top-0 h-full w-4 bg-white/20 skew-x-12"
            initial={{ left: "-20px" }}
            animate={{ left: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        )}
      </div>
    </div>
  );
}

function SVGCircularProgress({
  value,
  label,
  status,
  sublabel,
}: {
  value: number;
  label: string;
  status: PhaseProgress["status"];
  sublabel?: string;
}) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = circ - (pct / 100) * circ;

  const stroke =
    status === "danger"
      ? "#ff2d95"
      : status === "warning"
      ? "#ff6b35"
      : pct >= 90
      ? "#39ff14"
      : "#00f5ff";

  const trackStroke =
    status === "danger"
      ? "rgba(255,45,149,0.1)"
      : "rgba(30,41,59,0.8)";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="96" height="96" className="-rotate-90">
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={trackStroke}
            strokeWidth="7"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${stroke})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-lg font-black font-mono"
            style={{ color: stroke }}
          >
            {pct.toFixed(0)}%
          </span>
          {sublabel && (
            <span className="text-[9px] text-slate-600 font-mono">{sublabel}</span>
          )}
        </div>
      </div>
      <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

export function PhaseTracker({ currentPhase, progress }: PhaseTrackerProps) {
  const phaseIndex = PHASES.findIndex((p) => p.key === currentPhase);

  return (
    <div className="space-y-6">
      {/* Phase steps */}
      <div className="flex items-center gap-0">
        {PHASES.map((phase, i) => {
          const active = i === phaseIndex;
          const done = i < phaseIndex;
          const locked = i > phaseIndex;
          return (
            <div key={phase.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  animate={active ? { boxShadow: ["0 0 12px rgba(0,245,255,0.3)", "0 0 24px rgba(0,245,255,0.6)", "0 0 12px rgba(0,245,255,0.3)"] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative",
                    active
                      ? "border-cyan-400 bg-cyan-500/20"
                      : done
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-slate-700 bg-slate-900/50"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : active ? (
                    <Target className="h-5 w-5 text-cyan-400" />
                  ) : (
                    <Shield className="h-4 w-4 text-slate-600" />
                  )}
                  {active && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-cyan-400 phase-dot-active" />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-1.5 font-medium hidden sm:block ${
                    active ? "text-cyan-300" : done ? "text-green-400/70" : "text-slate-600"
                  }`}
                >
                  {phase.label}
                </span>
                <span className={`text-xs mt-1 font-bold sm:hidden ${
                  active ? "text-cyan-300" : done ? "text-green-400/70" : "text-slate-600"
                }`}>
                  {phase.shortLabel}
                </span>
              </div>
              {i < PHASES.length - 1 && (
                <div
                  className="flex-1 h-px mx-1 transition-all duration-700"
                  style={{
                    background: i < phaseIndex
                      ? "linear-gradient(90deg, rgba(57,255,20,0.5), rgba(0,245,255,0.5))"
                      : "rgba(51,65,85,0.5)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Circular gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SVGCircularProgress
          value={progress.profitProgressPct}
          label="Profit Target"
          status={progress.status}
          sublabel={`${progress.remainingTargetPct.toFixed(0)}% left`}
        />
        <SVGCircularProgress
          value={100 - progress.remainingTargetPct}
          label="Phase Done"
          status="safe"
        />
        <SVGCircularProgress
          value={progress.drawdownUsedPct}
          label="Drawdown Used"
          status={progress.drawdownUsedPct >= 80 ? "danger" : progress.drawdownUsedPct >= 60 ? "warning" : "safe"}
        />
        <div className="flex flex-col items-center justify-center glass-card p-4 text-center">
          <Clock className="h-4 w-4 text-purple-400 mb-1" />
          <span
            className="text-3xl font-black text-purple-300 font-mono"
            style={{ textShadow: "0 0 16px rgba(176,38,255,0.5)" }}
          >
            {progress.daysRemaining}
          </span>
          <span className="text-xs text-slate-500 mt-0.5">Days Left</span>
        </div>
      </div>

      {/* Progress bars */}
      <div className="grid md:grid-cols-2 gap-4">
        <NeonProgressBar
          value={progress.profitProgressPct}
          label="Profit Progress"
          colorClass="bg-gradient-to-r from-cyan-600 to-cyan-400"
          sublabel={`${progress.remainingTargetPct.toFixed(1)}% remaining`}
        />
        <NeonProgressBar
          value={progress.drawdownUsedPct}
          label="Max Drawdown Usage"
          colorClass="bg-gradient-to-r from-orange-600 to-pink-500"
          warning={progress.drawdownUsedPct >= 60}
          sublabel={`${progress.maxDrawdownDistancePct.toFixed(2)}% safe`}
        />
        <NeonProgressBar
          value={progress.dailyDrawdownUsedPct}
          label="Daily Drawdown"
          colorClass="bg-gradient-to-r from-yellow-600 to-orange-500"
          warning={progress.dailyDrawdownUsedPct >= 60}
        />
        <div className="glass-card p-3 flex items-center gap-3">
          <TrendingDown className="h-5 w-5 text-orange-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Distance from violation</p>
            <p
              className="font-mono font-black text-orange-300"
              style={{ textShadow: "0 0 10px rgba(255,107,53,0.4)" }}
            >
              {progress.maxDrawdownDistancePct.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {progress.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "rounded-xl p-4 border space-y-2",
              progress.status === "danger"
                ? "border-pink-500/50 bg-pink-500/[0.08] warning-glow"
                : "border-orange-500/40 bg-orange-500/[0.08]"
            )}
          >
            {progress.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <AlertTriangle
                  className={cn(
                    "h-4 w-4 shrink-0",
                    progress.status === "danger" ? "text-pink-400" : "text-orange-400"
                  )}
                />
                <span
                  className={
                    progress.status === "danger" ? "text-pink-300" : "text-orange-300"
                  }
                >
                  {w}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
