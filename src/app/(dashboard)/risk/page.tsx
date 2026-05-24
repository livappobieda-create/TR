"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { useAccounts } from "@/hooks/useAccounts";
import { useSelectedAccount } from "@/hooks/useSelectedAccount";
import { useStats } from "@/hooks/useStats";
import { useLang } from "@/context/LangContext";
import { ShieldAlert, TrendingUp, AlertTriangle } from "lucide-react";
import { RiskPanel } from "@/components/risk/RiskPanel";

export default function RiskManagementPage() {
  const { accounts, loading } = useAccounts();
  const { selectedId, setSelectedId } = useSelectedAccount(accounts);
  const { data, loading: statsLoading } = useStats(selectedId || null);
  const { t } = useLang();

  if (!loading && accounts.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-slate-400 mb-4">{t("noAccountsYet")}</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gradient">{t("riskManagement") || "Risk Management"}</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            {t("riskManagementDesc") || "Professional lot sizing & compounding engine"}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      {statsLoading || !data ? (
        <div className="space-y-4">
          <div className="glass-card h-48 skeleton" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card h-64 skeleton" />
            <div className="glass-card h-64 skeleton" />
          </div>
        </div>
      ) : (
        <RiskPanel 
          currentBalance={data.account.currentBalance} 
          consistencyScore={data.statistics.consistencyScore} 
          winRate={data.statistics.winRate} 
          weeklyCompoundGrowth={data.statistics.weeklyCompoundGrowth}
          isFunded={data.account.isFunded}
          averageRR={data.statistics.averageRR}
          currentDrawdown={data.statistics.currentDrawdown}
        />
      )}
    </div>
  );
}
