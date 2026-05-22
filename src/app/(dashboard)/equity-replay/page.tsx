"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EquityReplay } from "@/components/equity/EquityReplay";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAccounts } from "@/hooks/useAccounts";
import { useSelectedAccount } from "@/hooks/useSelectedAccount";
import { useStats } from "@/hooks/useStats";
import { useLang } from "@/context/LangContext";
import { Play, Zap, PlusCircle } from "lucide-react";

export default function EquityReplayPage() {
  const { accounts, loading } = useAccounts();
  const { selectedId, setSelectedId } = useSelectedAccount(accounts);
  const { data, loading: statsLoading } = useStats(selectedId || null);
  const { t } = useLang();

  if (!loading && accounts.length === 0) {
    return (
      <GlassCard className="text-center py-16">
        <Zap className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
        <p className="text-slate-400 mb-6">{t("noAccountsYet")}</p>
        <Link href="/onboarding" className="neon-btn inline-block">
          {t("setupAccountBtn")}
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gradient flex items-center gap-3">
            <Play className="h-8 w-8 text-cyan-400" />
            {t("equityReplayTitle")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t("equityReplaySubtitle")}
          </p>
        </div>
        <AccountSelector
          accounts={accounts.map((a) => ({
            id: a.id,
            name: a.name,
            currentBalance: a.currentBalance,
            isFunded: a.isFunded,
          }))}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {statsLoading || !data ? (
        <div className="glass-card h-[500px] skeleton" />
      ) : data.equityCurve.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div
            className="inline-flex p-5 rounded-3xl mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(0,245,255,0.1), rgba(176,38,255,0.1))",
              border: "1px solid rgba(0,245,255,0.2)",
              boxShadow: "0 0 40px rgba(0,245,255,0.1)",
            }}
          >
            <Play className="h-14 w-14 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">{t("noDataTitle")}</h2>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            {t("noDataDesc")}
          </p>
          <Link
            href="/daily-entry"
            className="neon-btn inline-flex items-center gap-2 px-6 py-3"
          >
            <PlusCircle className="h-4 w-4" />
            {t("addDailyEntry")}
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EquityReplay data={data.equityCurve} />
        </motion.div>
      )}
    </div>
  );
}
