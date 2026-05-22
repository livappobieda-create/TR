"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wallet, Shield, Circle, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLang } from "@/context/LangContext";

interface Account {
  id: string;
  name: string;
  currentBalance: number;
  isFunded: boolean;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AccountSelector({ accounts, selectedId, onSelect }: AccountSelectorProps) {
  const [open, setOpen] = useState(false);
  const { t, isArabic } = useLang();
  const selected = accounts.find((a) => a.id === selectedId);

  if (accounts.length === 0) return null;

  // Dropdown opens left in RTL, right in LTR
  const dropdownAlign = isArabic ? "left-0" : "right-0";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 glass-card px-3 py-2 text-sm hover:border-cyan-400/30 transition-colors min-w-0"
      >
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${
            selected?.isFunded ? "bg-purple-400" : "bg-cyan-400"
          }`}
          style={{ boxShadow: selected?.isFunded ? "0 0 6px #b026ff" : "0 0 6px #00f5ff" }}
        />
        <span className="font-medium text-slate-200 max-w-[140px] sm:max-w-[200px] truncate text-sm">
          {selected?.name ?? t("selectAccount")}
        </span>
        {selected && (
          <span className="font-mono text-xs text-slate-500 hidden sm:inline shrink-0">
            {formatCurrency(selected.currentBalance)}
          </span>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={isArabic ? "rtl-flip" : ""}
        >
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${dropdownAlign} top-full mt-2 z-50 min-w-[240px] sm:min-w-[280px]`}
            style={{
              background: "rgba(5,10,25,0.97)",
              border: "1px solid rgba(0,245,255,0.2)",
              borderRadius: "0.875rem",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,245,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="p-1.5 max-h-60 overflow-y-auto">
              {accounts.map((account, i) => {
                const isSelected = account.id === selectedId;
                return (
                  <motion.button
                    key={account.id}
                    type="button"
                    initial={{ opacity: 0, x: isArabic ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      onSelect(account.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-start ${
                      isSelected
                        ? "bg-cyan-500/10 border border-cyan-500/20"
                        : "hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="shrink-0">
                      {account.isFunded ? (
                        <Shield className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Wallet className="h-4 w-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {account.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {formatCurrency(account.currentBalance)}
                        {account.isFunded && (
                          <span className="ms-1.5 text-purple-400/70">· {t("fundedLabel")}</span>
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <Circle className="h-2.5 w-2.5 text-cyan-400 fill-cyan-400 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="border-t border-slate-800/80 p-1.5">
              <a
                href="/onboarding"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("addAccount")}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
