"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalyticsMetrics } from "@/lib/analytics";
import type { PhaseProgress } from "@/lib/stats";

export interface StatsResponse {
  statistics: AnalyticsMetrics;
  phaseProgress: PhaseProgress | null;
  account: {
    id: string;
    name: string;
    initialBalance: number;
    currentBalance: number;
    isFunded: boolean;
    phase: string;
  };
  equityCurve: {
    date: string;
    balance: number;
    pnl: number;
  }[];
}

export function useStats(accountId: string | null) {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?accountId=${accountId}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
