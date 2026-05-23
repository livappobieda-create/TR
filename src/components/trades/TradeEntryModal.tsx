"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonInput } from "@/components/ui/NeonInput";
import { useLang } from "@/context/LangContext";
import { X, Save, Target, Activity, DollarSign } from "lucide-react";

interface TradeEntryModalProps {
  accountId: string;
  onClose: () => void;
}

export function TradeEntryModal({ accountId, onClose }: TradeEntryModalProps) {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    symbol: "",
    direction: "BUY",
    lotSize: "",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    riskPercentage: "",
    pnl: "",
    rrRatio: "",
    result: "WIN",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          ...form,
          date: new Date(form.date).toISOString(),
          lotSize: parseFloat(form.lotSize),
          entryPrice: parseFloat(form.entryPrice),
          stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
          takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
          riskPercentage: form.riskPercentage ? parseFloat(form.riskPercentage) : null,
          pnl: parseFloat(form.pnl),
          rrRatio: form.rrRatio ? parseFloat(form.rrRatio) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save trade");
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200">
        <GlassCard className="max-h-[90vh] flex flex-col p-0">
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              {t.logTrade || "Log Trade"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <NeonInput
                label={t.date || "Date"}
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                required
              />
              <NeonInput
                label={t.symbol || "Symbol / Pair"}
                value={form.symbol}
                onChange={(e) => update("symbol", e.target.value)}
                placeholder={t.symbolPlaceholder || "EURUSD, XAUUSD"}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-cyan-300/80 font-medium block mb-2">
                  {t.direction || "Direction"}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => update("direction", "BUY")}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                      form.direction === "BUY"
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                        : "border-slate-700/50 text-slate-400"
                    }`}
                  >
                    {t.buy || "Buy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => update("direction", "SELL")}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                      form.direction === "SELL"
                        ? "border-pink-400 bg-pink-500/10 text-pink-200"
                        : "border-slate-700/50 text-slate-400"
                    }`}
                  >
                    {t.sell || "Sell"}
                  </button>
                </div>
              </div>
              <NeonInput
                label={t.lotSize || "Lot Size"}
                type="number"
                step="0.01"
                value={form.lotSize}
                onChange={(e) => update("lotSize", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <NeonInput
                label={t.entryPrice || "Entry Price"}
                type="number"
                step="0.00001"
                value={form.entryPrice}
                onChange={(e) => update("entryPrice", e.target.value)}
                required
              />
              <NeonInput
                label={t.stopLoss || "Stop Loss"}
                type="number"
                step="0.00001"
                value={form.stopLoss}
                onChange={(e) => update("stopLoss", e.target.value)}
              />
              <NeonInput
                label={t.takeProfit || "Take Profit"}
                type="number"
                step="0.00001"
                value={form.takeProfit}
                onChange={(e) => update("takeProfit", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <NeonInput
                label={t.pnl || "Profit/Loss ($)"}
                type="number"
                step="0.01"
                value={form.pnl}
                onChange={(e) => update("pnl", e.target.value)}
                required
              />
              <NeonInput
                label={t.riskPercentage || "Risk %"}
                type="number"
                step="0.01"
                value={form.riskPercentage}
                onChange={(e) => update("riskPercentage", e.target.value)}
              />
              <NeonInput
                label={t.rrRatio || "Risk/Reward"}
                type="number"
                step="0.01"
                value={form.rrRatio}
                onChange={(e) => update("rrRatio", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-cyan-300/80 font-medium block mb-2">
                {t.tradeResult || "Result"}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update("result", "WIN")}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                    form.result === "WIN"
                      ? "border-green-400 bg-green-500/10 text-green-200"
                      : "border-slate-700/50 text-slate-400"
                  }`}
                >
                  {t.win || "Win"}
                </button>
                <button
                  type="button"
                  onClick={() => update("result", "LOSS")}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                    form.result === "LOSS"
                      ? "border-red-400 bg-red-500/10 text-red-200"
                      : "border-slate-700/50 text-slate-400"
                  }`}
                >
                  {t.loss || "Loss"}
                </button>
                <button
                  type="button"
                  onClick={() => update("result", "BREAKEVEN")}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                    form.result === "BREAKEVEN"
                      ? "border-slate-400 bg-slate-500/20 text-slate-200"
                      : "border-slate-700/50 text-slate-400"
                  }`}
                >
                  {t.breakeven || "Breakeven"}
                </button>
              </div>
            </div>

            <NeonInput
              label={t.notes || "Notes"}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />

            {error && (
              <p className="text-sm text-pink-400">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/5 shrink-0 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 neon-btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 neon-btn flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t.saveChanges || "Save Trade"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
