"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonInput } from "@/components/ui/NeonInput";
import { useLang } from "@/context/LangContext";
import { X, Save, Wallet } from "lucide-react";

interface TransactionModalProps {
  accountId: string;
  onClose: () => void;
}

export function TransactionModal({ accountId, onClose }: TransactionModalProps) {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    type: "DEPOSIT",
    amount: "",
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
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          ...form,
          date: new Date(form.date).toISOString(),
          amount: parseFloat(form.amount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save transaction");
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
      <div className="w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200">
        <GlassCard className="p-0">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-cyan-400" />
              {t.addTransaction || "Add Transaction"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <NeonInput
              label={t.date || "Date"}
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
            />

            <div>
              <label className="text-sm text-cyan-300/80 font-medium block mb-2">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update("type", "DEPOSIT")}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                    form.type === "DEPOSIT"
                      ? "border-green-400 bg-green-500/10 text-green-200"
                      : "border-slate-700/50 text-slate-400"
                  }`}
                >
                  {t.deposit || "Deposit"}
                </button>
                <button
                  type="button"
                  onClick={() => update("type", "WITHDRAWAL")}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                    form.type === "WITHDRAWAL"
                      ? "border-pink-400 bg-pink-500/10 text-pink-200"
                      : "border-slate-700/50 text-slate-400"
                  }`}
                >
                  {t.withdrawal || "Withdrawal"}
                </button>
              </div>
            </div>

            <NeonInput
              label={t.amount || "Amount ($)"}
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              required
            />

            <NeonInput
              label={t.notes || "Notes"}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />

            {error && (
              <p className="text-sm text-pink-400">{error}</p>
            )}
          </div>

          <div className="p-5 border-t border-white/5 flex gap-3">
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
              {t.saveChanges || "Save"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
