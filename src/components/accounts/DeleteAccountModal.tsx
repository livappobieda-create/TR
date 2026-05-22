"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { useLang } from "@/context/LangContext";

interface Account {
  id: string;
  name: string;
  currentBalance: number;
}

interface DeleteAccountModalProps {
  account: Account;
  open: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteAccountModal({
  account,
  open,
  onClose,
  onDeleted,
}: DeleteAccountModalProps) {
  const { t, isArabic } = useLang();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const matches = confirmText.trim() === account.name.trim();

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setError("");
      setStep(1);
    }
  }, [open, account]);

  async function handleDelete() {
    if (!matches) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Delete failed");
        return;
      }
      onDeleted(account.id);
      onClose();
    } catch {
      setError("Connection error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="del-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            key="del-card"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-md rounded-2xl relative overflow-hidden"
            style={{
              background: "rgba(6,10,26,0.97)",
              border: "1px solid rgba(255,45,149,0.35)",
              boxShadow: "0 0 60px rgba(255,45,149,0.15), 0 40px 80px rgba(0,0,0,0.7)",
            }}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {/* Danger top bar */}
            <motion.div
              className="h-0.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ background: "linear-gradient(90deg, transparent, #ff2d95, #ff6b35, transparent)" }}
            />

            {/* Danger glow overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              animate={{ opacity: [0, 0.04, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ background: "radial-gradient(ellipse at center, rgba(255,45,149,0.3), transparent 70%)" }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-pink-500/10">
              <div
                className="p-2 rounded-xl shrink-0"
                style={{ background: "rgba(255,45,149,0.1)", border: "1px solid rgba(255,45,149,0.25)" }}
              >
                <AlertTriangle className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{t("deleteConfirmTitle")}</h2>
                <p className="text-xs text-pink-400/70 font-mono">IRREVERSIBLE ACTION</p>
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
              {/* Account info */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,45,149,0.06)",
                  border: "1px solid rgba(255,45,149,0.15)",
                }}
              >
                <p className="text-sm text-slate-400 mb-1">{t("accountName")}</p>
                <p className="text-xl font-black text-white">{account.name}</p>
                <p className="text-sm font-mono text-pink-400 mt-1">
                  ${account.currentBalance.toLocaleString()}
                </p>
              </div>

              {/* Warning */}
              <p className="text-sm text-slate-400">{t("deleteWarning")}</p>

              {/* Confirm input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-pink-400/70 uppercase tracking-wider">
                  {t("deleteConfirmPrompt")}
                </label>
                <input
                  className="neon-input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={account.name}
                  style={{
                    borderColor: confirmText
                      ? matches
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(255,45,149,0.3)"
                      : undefined,
                  }}
                />
                <AnimatePresence>
                  {confirmText && !matches && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-pink-500"
                    >
                      {t("doesNotMatch")}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-pink-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-pink-500/10 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="neon-btn-outline px-4 py-2 text-sm"
              >
                {t("cancelBtn")}
              </button>
              <motion.button
                onClick={handleDelete}
                disabled={!matches || deleting}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: matches
                    ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                    : "rgba(239,68,68,0.2)",
                  boxShadow: matches ? "0 0 24px rgba(239,68,68,0.4)" : "none",
                  transition: "all 0.3s ease",
                }}
                animate={matches ? { boxShadow: ["0 0 16px rgba(239,68,68,0.3)", "0 0 28px rgba(239,68,68,0.5)", "0 0 16px rgba(239,68,68,0.3)"] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {deleting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("deleting")}</>
                ) : (
                  <><Trash2 className="h-4 w-4" />{t("deleteBtn")}</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
