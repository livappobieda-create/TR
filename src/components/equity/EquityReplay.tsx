"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import {
  Play,
  Pause,
  SkipBack,
  FastForward,
  TrendingUp,
  TrendingDown,
  Activity,
  Maximize2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface EquityPoint {
  date: string;
  balance: number;
  pnl: number;
  pnlPct: number;
}

type ReplayMode = "weekly" | "monthly" | "full";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as EquityPoint;
  return (
    <div
      className="glass-card p-3 text-xs font-mono"
      style={{ border: "1px solid rgba(0,245,255,0.3)", minWidth: 150 }}
    >
      <p className="text-slate-400 mb-1.5">
        {new Date(d.date).toLocaleDateString()}
      </p>
      <p className="text-cyan-300 font-bold text-sm">{formatCurrency(d.balance)}</p>
      <p className={d.pnl >= 0 ? "text-green-400" : "text-pink-400"}>
        {d.pnl >= 0 ? "▲" : "▼"} {formatCurrency(Math.abs(d.pnl))} ({formatPercent(d.pnlPct)})
      </p>
    </div>
  );
};

export function EquityReplay({ data }: { data: EquityPoint[] }) {
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<ReplayMode>("full");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPnl = useRef<number | null>(null);
  const [lastEffect, setLastEffect] = useState<"win" | "loss" | null>(null);

  const filtered = useMemo(() => {
    if (mode === "full" || data.length === 0) return data;
    const days = mode === "weekly" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter((d) => new Date(d.date) >= cutoff);
  }, [data, mode]);

  const visible = useMemo(
    () => filtered.slice(0, Math.max(1, frame)),
    [filtered, frame]
  );

  const current = visible[visible.length - 1];
  const peak = useMemo(() => Math.max(...visible.map((v) => v.balance), 0), [visible]);
  const drawdown = peak > 0 && current ? ((peak - current.balance) / peak) * 100 : 0;
  const totalPnl = useMemo(() => {
    if (!visible.length) return 0;
    return visible[visible.length - 1].balance - visible[0].balance;
  }, [visible]);

  const winDays = useMemo(() => visible.filter((v) => v.pnl > 0).length, [visible]);
  const lossDays = useMemo(() => visible.filter((v) => v.pnl < 0).length, [visible]);

  // Track win/loss visual effect
  useEffect(() => {
    if (current && prevPnl.current !== null && current.pnl !== prevPnl.current) {
      if (current.pnl > 0) setLastEffect("win");
      else if (current.pnl < 0) setLastEffect("loss");
      setTimeout(() => setLastEffect(null), 600);
    }
    if (current) prevPnl.current = current.pnl;
  }, [current]);

  const tick = useCallback(() => {
    setFrame((f) => {
      if (f >= filtered.length) {
        setPlaying(false);
        return f;
      }
      return f + 1;
    });
  }, [filtered.length]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(tick, 350 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, tick]);

  function reset() {
    setFrame(1);
    setPlaying(false);
  }

  function togglePlay() {
    if (frame >= filtered.length) setFrame(1);
    setPlaying((p) => !p);
  }

  const progressPct = filtered.length ? (frame / filtered.length) * 100 : 0;

  return (
    <GlassCard className="w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-gradient">Equity Replay</h2>
          <p className="text-xs text-slate-500 mt-0.5">Cinematic day-by-day balance animation</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["weekly", "monthly", "full"] as ReplayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                mode === m
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-500 hover:text-cyan-300 border border-transparent"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Win/Loss flash overlay */}
      <AnimatePresence>
        {lastEffect && (
          <motion.div
            key={lastEffect}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: lastEffect === "win"
                ? "radial-gradient(ellipse at center, rgba(57,255,20,0.15), transparent 70%)"
                : "radial-gradient(ellipse at center, rgba(255,45,149,0.15), transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Chart */}
      <div className="h-72 md:h-96 mb-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible}>
            <defs>
              <linearGradient id="replayFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="replayLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="50%" stopColor="#b026ff" />
                <stop offset="100%" stopColor="#ff2d95" />
              </linearGradient>
              <filter id="lineGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              }
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
              width={48}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Zero reference line */}
            {visible.length > 0 && (
              <ReferenceLine
                y={visible[0].balance}
                stroke="rgba(148,163,184,0.2)"
                strokeDasharray="4 4"
              />
            )}

            <Area
              type="monotone"
              dataKey="balance"
              stroke="url(#replayLine)"
              strokeWidth={3}
              fill="url(#replayFill)"
              dot={false}
              isAnimationActive={false}
              style={{ filter: "drop-shadow(0 0 6px rgba(0,245,255,0.4))" }}
            />

            {/* Current point */}
            {current && (
              <ReferenceDot
                x={current.date}
                y={current.balance}
                r={7}
                fill={current.pnl >= 0 ? "#00f5ff" : "#ff2d95"}
                stroke="rgba(3,7,18,0.8)"
                strokeWidth={2}
                style={{
                  filter: `drop-shadow(0 0 8px ${current.pnl >= 0 ? "#00f5ff" : "#ff2d95"})`,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="glass-card p-3">
          <span className="text-slate-500 text-xs block mb-1">Balance</span>
          <span className="text-cyan-300 font-mono font-black text-sm">
            {current ? formatCurrency(current.balance) : "—"}
          </span>
        </div>
        <div className="glass-card p-3">
          <span className="text-slate-500 text-xs block mb-1">Drawdown</span>
          <span className={`font-mono font-black text-sm ${drawdown > 5 ? "text-pink-400" : "text-orange-400"}`}>
            {drawdown.toFixed(2)}%
          </span>
        </div>
        <div className="glass-card p-3">
          <span className="text-xs block mb-1">
            <span className="text-green-400">▲</span>
            <span className="text-slate-500"> Win Days</span>
          </span>
          <span className="text-green-400 font-mono font-black text-sm">{winDays}</span>
        </div>
        <div className="glass-card p-3">
          <span className="text-xs block mb-1">
            <span className="text-pink-400">▼</span>
            <span className="text-slate-500"> Loss Days</span>
          </span>
          <span className="text-pink-400 font-mono font-black text-sm">{lossDays}</span>
        </div>
      </div>

      {/* Today's PnL indicator */}
      {current && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.date}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-5 glass-card p-3"
          >
            {current.pnl >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-400 shrink-0" />
            ) : (
              <TrendingDown className="h-5 w-5 text-pink-400 shrink-0" />
            )}
            <span className="text-sm text-slate-400">
              {new Date(current.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <span className={`font-mono font-bold ml-auto text-sm ${current.pnl >= 0 ? "text-green-400" : "text-pink-400"}`}>
              {current.pnl >= 0 ? "+" : ""}{formatCurrency(current.pnl)}
            </span>
            <span className={`font-mono text-xs ${current.pnl >= 0 ? "text-green-400/70" : "text-pink-400/70"}`}>
              ({formatPercent(current.pnlPct)})
            </span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={reset}
          className="neon-btn-outline p-2.5 rounded-xl"
          title="Reset"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <motion.button
          onClick={togglePlay}
          className="neon-btn px-6 py-2.5 flex items-center gap-2 rounded-xl"
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {playing ? (
              <motion.span key="pause" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <Pause className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span key="play" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <Play className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-sm font-semibold">{playing ? "Pause" : "Play Replay"}</span>
        </motion.button>

        <div className="flex items-center gap-1.5 glass-card px-3 py-2">
          <FastForward className="h-3.5 w-3.5 text-slate-500" />
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                speed === s
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #00f5ff, #b026ff, #ff2d95)",
              boxShadow: "0 0 10px rgba(0,245,255,0.4)",
            }}
          />
        </div>
        <p className="text-center text-xs text-slate-600 mt-2 font-mono">
          Day {frame} / {filtered.length} —{" "}
          <span className={totalPnl >= 0 ? "text-green-400" : "text-pink-400"}>
            {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
          </span>{" "}
          total P&L
        </p>
      </div>
    </GlassCard>
  );
}
