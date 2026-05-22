"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, CheckCircle2, Building2, Wallet } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  accountType: string;
  isFunded: boolean;
  propFirmName?: string | null;
  challengeSize?: number | null;
  profitTarget?: number | null;
  dailyDrawdownLimit?: number | null;
  maxDrawdownLimit?: number | null;
  currentDrawdown?: number | null;
  currentProfitProgress?: number | null;
  phase?: string | null;
  phaseDaysRemaining?: number | null;
  notes?: string | null;
}

interface EditAccountModalProps {
  account: Account;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Account) => void;
}

const ACCOUNT_TYPES = [
  { value: "PROP_FIRM", icon: Building2, labelKey: "propFirm" },
  { value: "LIVE", icon: Wallet, labelKey: "live" },
  { value: "PERSONAL", icon: Wallet, labelKey: "personal" },
  { value: "DEMO", icon: Wallet, labelKey: "demo" },
] as const;

const PHASES = [
  { value: "CHALLENGE_PHASE_1", labelKey: "phase1" },
  { value: "CHALLENGE_PHASE_2", labelKey: "phase2" },
  { value: "FUNDED", labelKey: "funded" },
] as const;

export function EditAccountModal({ account, open, onClose, onSaved }: EditAccountModalProps) {
  const { t, isArabic } = useLang();
  const [form, setForm] = useState({ ...account });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ ...account });
      setSuccess(false);
      setError("");
    }
  }, [open, account]);

  function set(key: keyof Account, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          initialBalance: Number(form.initialBalance),
          currentBalance: Number(form.currentBalance),
          accountType: form.accountType,
          isFunded: form.isFunded,
          propFirmName: form.propFirmName,
          challengeSize: form.challengeSize ? Number(form.challengeSize) : null,
          profitTarget: form.profitTarget ? Number(form.profitTarget) : null,
          dailyDrawdownLimit: form.dailyDrawdownLimit ? Number(form.dailyDrawdownLimit) : null,
          maxDrawdownLimit: form.maxDrawdownLimit ? Number(form.maxDrawdownLimit) : null,
          currentDrawdown: form.currentDrawdown ? Number(form.currentDrawdown) : null,
          currentProfitProgress: form.currentProfitProgress
            ? Number(form.currentProfitProgress)
            : null,
          phase: form.phase,
          phaseDaysRemaining: form.phaseDaysRemaining ? Number(form.phaseDaysRemaining) : null,
          notes: form.notes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Update failed");
        return;
      }
      const { account: updated } = await res.json();
      setSuccess(true);
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 900);
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="edit-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            key="edit-card"
            initial={{ opacity: 0, y: 32, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-full max-w-lg rounded-2xl relative"
            style={{
              background: "rgba(6,10,26,0.96)",
              border: "1px solid rgba(0,245,255,0.2)",
              boxShadow: "0 0 0 1px rgba(0,245,255,0.06), 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,245,255,0.04)",
            }}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {/* Top accent */}
            <div
              className="h-0.5 rounded-t-2xl"
              style={{ background: "linear-gradient(90deg, transparent, #00f5ff, #b026ff, transparent)" }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800/70">
              <h2 className="text-lg font-black text-white">{t("editAccountTitle")}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Account Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                  {t("accountName")}
                </label>
                <input
                  className="neon-input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t("accountNamePlaceholder")}
                />
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                    {t("initialBalance")}
                  </label>
                  <input
                    className="neon-input"
                    type="number"
                    value={form.initialBalance}
                    onChange={(e) => set("initialBalance", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                    {t("currentBalanceLabel")}
                  </label>
                  <input
                    className="neon-input"
                    type="number"
                    value={form.currentBalance}
                    onChange={(e) => set("currentBalance", e.target.value)}
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                  {t("accountType")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        set("accountType", value);
                        set("isFunded", value === "PROP_FIRM");
                      }}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-semibold transition-all",
                        form.accountType === value
                          ? "border-cyan-400/50 text-cyan-300 bg-cyan-500/10"
                          : "border-slate-700/50 text-slate-500 hover:border-slate-600"
                      )}
                    >
                      {t(labelKey as Parameters<typeof t>[0])}
                    </button>
                  ))}
                </div>
              </div>

              {/* Funded fields */}
              <AnimatePresence>
                {form.isFunded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div
                      className="pt-3 border-t"
                      style={{ borderColor: "rgba(176,38,255,0.2)" }}
                    >
                      <p className="text-xs font-semibold text-purple-400 mb-3 uppercase tracking-wider">
                        {t("propFirmDetails")}
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500">{t("propFirmName")}</label>
                          <input
                            className="neon-input"
                            value={form.propFirmName ?? ""}
                            onChange={(e) => set("propFirmName", e.target.value)}
                            placeholder={t("propFirmNamePlaceholder")}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-500">{t("profitTarget")} ($)</label>
                            <input
                              className="neon-input"
                              type="number"
                              value={form.profitTarget ?? ""}
                              onChange={(e) => set("profitTarget", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-500">{t("challengeSize")} ($)</label>
                            <input
                              className="neon-input"
                              type="number"
                              value={form.challengeSize ?? ""}
                              onChange={(e) => set("challengeSize", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-500">{t("dailyDrawdownLimit")} (%)</label>
                            <input
                              className="neon-input"
                              type="number"
                              value={form.dailyDrawdownLimit ?? ""}
                              onChange={(e) => set("dailyDrawdownLimit", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-500">{t("maxDrawdownLimit")} (%)</label>
                            <input
                              className="neon-input"
                              type="number"
                              value={form.maxDrawdownLimit ?? ""}
                              onChange={(e) => set("maxDrawdownLimit", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-500">{t("currentDrawdown")} (%)</label>
                            <input
                              className="neon-input"
                              type="number"
                              value={form.currentDrawdown ?? ""}
                              onChange={(e) => set("currentDrawdown", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-500">{t("currentProfitProgress")} ($)</label>
                            <input
                              className="neon-input"
                              type="number"
                              value={form.currentProfitProgress ?? ""}
                              onChange={(e) => set("currentProfitProgress", e.target.value)}
                            />
                          </div>
                        </div>
                        {/* Phase */}
                        <div className="space-y-2">
                          <label className="text-xs text-slate-500">{t("currentPhase")}</label>
                          <div className="grid grid-cols-3 gap-2">
                            {PHASES.map(({ value, labelKey }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => set("phase", value)}
                                className={cn(
                                  "py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all",
                                  form.phase === value
                                    ? "border-purple-400/50 text-purple-300 bg-purple-500/10"
                                    : "border-slate-700/50 text-slate-500 hover:border-slate-600"
                                )}
                              >
                                {t(labelKey as Parameters<typeof t>[0])}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500">{t("phaseDaysRemaining")}</label>
                          <input
                            className="neon-input"
                            type="number"
                            value={form.phaseDaysRemaining ?? ""}
                            onChange={(e) => set("phaseDaysRemaining", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                  {t("notes")}
                </label>
                <textarea
                  className="neon-input resize-none"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder={t("notesPlaceholder")}
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-pink-400 bg-pink-500/8 border border-pink-500/20 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800/70 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="neon-btn-outline px-4 py-2 text-sm"
              >
                {t("cancelBtn")}
              </button>
              <motion.button
                onClick={handleSave}
                disabled={saving || success}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                style={{
                  background: success
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #00b8d9, #6d28d9)",
                  boxShadow: success
                    ? "0 0 20px rgba(34,197,94,0.3)"
                    : "0 0 20px rgba(0,245,255,0.15)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t("updateSuccess")}
                    </motion.span>
                  ) : saving ? (
                    <motion.span key="saving" className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("saving")}
                    </motion.span>
                  ) : (
                    <motion.span key="idle" className="flex items-center gap-1.5">
                      <Save className="h-4 w-4" />
                      {t("saveChanges")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
