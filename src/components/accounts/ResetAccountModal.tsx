"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X, Loader2 } from "lucide-react";
import { useLang } from "@/context/LangContext";

interface Account {
  id: string;
  name: string;
  currentBalance: number;
}

interface ResetAccountModalProps {
  account: Account;
  open: boolean;
  onClose: () => void;
  onReset: (id: string) => void;
}

export function ResetAccountModal({
  account,
  open,
  onClose,
  onReset,
}: ResetAccountModalProps) {
  const { t, isArabic } = useLang();
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  const matches = confirmText.trim() === "RESET";

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setError("");
    }
  }, [open, account]);

  async function handleReset() {
    if (!matches) return;
    setResetting(true);
    setError("");
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" })
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Reset failed");
        return;
      }
      onReset(account.id);
      onClose();
    } catch {
      setError("Connection error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="reset-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            key="reset-card"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-md rounded-2xl relative overflow-hidden"
            style={{
              background: "rgba(6,10,26,0.97)",
              border: "1px solid rgba(255,153,0,0.35)",
              boxShadow: "0 0 60px rgba(255,153,0,0.15), 0 40px 80px rgba(0,0,0,0.7)",
            }}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {/* Warning top bar */}
            <motion.div
              className="h-0.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ background: "linear-gradient(90deg, transparent, #ff9900, #ffea00, transparent)" }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-orange-500/10">
              <div
                className="p-2 rounded-xl shrink-0"
                style={{ background: "rgba(255,153,0,0.1)", border: "1px solid rgba(255,153,0,0.25)" }}
              >
                <RotateCcw className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{t("resetAccountTitle") || "Reset Account"}</h2>
                <p className="text-xs text-orange-400/70 font-mono">IRREVERSIBLE ACTION</p>
              </div>
              <button
                onClick={onClose}
                className="ms-auto p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,153,0,0.06)",
                  border: "1px solid rgba(255,153,0,0.15)",
                }}
              >
                <p className="text-sm text-slate-400 mb-1">{t("accountName")}</p>
                <p className="text-xl font-black text-white">{account.name}</p>
              </div>

              <p className="text-sm text-slate-400">
                {t("resetWarning") || "This will delete all trades and transactions for this account and reset the balance to the initial starting balance. Account settings will be preserved."}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-orange-400/70 uppercase tracking-wider">
                  {t("typeResetToConfirm") || "Type RESET to confirm"}
                </label>
                <input
                  className="neon-input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESET"
                  style={{
                    borderColor: confirmText
                      ? matches
                        ? "rgba(255,153,0,0.5)"
                        : "rgba(255,153,0,0.3)"
                      : undefined,
                  }}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-orange-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-orange-500/10 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="neon-btn-outline px-4 py-2 text-sm"
              >
                {t("cancelBtn")}
              </button>
              <motion.button
                onClick={handleReset}
                disabled={!matches || resetting}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: matches
                    ? "linear-gradient(135deg, #ea580c, #c2410c)"
                    : "rgba(234,88,12,0.2)",
                  boxShadow: matches ? "0 0 24px rgba(234,88,12,0.4)" : "none",
                }}
              >
                {resetting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("resetting") || "Resetting..."}</>
                ) : (
                  <><RotateCcw className="h-4 w-4" />{t("resetBtn") || "Reset Account"}</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
