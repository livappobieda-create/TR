"use client";

import { useState, useEffect, useCallback } from "react";

export interface TradingAccountData {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  accountType: string;
  isFunded: boolean;
  phase: string;
  propFirmName?: string | null;
  challengeSize?: number | null;
  profitTarget?: number | null;
  dailyDrawdownLimit?: number | null;
  maxDrawdownLimit?: number | null;
  currentDrawdown: number;
  currentProfitProgress: number;
  phaseDaysRemaining: number;
  notes?: string | null;
}


export function useAccounts() {
  const [accounts, setAccounts] = useState<TradingAccountData[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { accounts, loading, refresh };
}
