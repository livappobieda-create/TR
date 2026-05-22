"use client";

import { useState, useEffect, useCallback } from "react";
import type { TradingAccountData } from "./useAccounts";

const STORAGE_KEY = "neon-trade-selected-account-id";

/**
 * Persists the selected account ID in localStorage.
 * Falls back to the first account only if:
 *   - No persisted ID exists, OR
 *   - The persisted ID no longer exists in the accounts list
 *
 * The selected ID is shared across all pages via localStorage,
 * so switching accounts in one page is reflected everywhere after reload.
 */
export function useSelectedAccount(accounts: TradingAccountData[]) {
  const [selectedId, setSelectedIdState] = useState<string>("");

  // On mount (and when accounts load), resolve the correct selection
  useEffect(() => {
    if (accounts.length === 0) return;

    const stored = localStorage.getItem(STORAGE_KEY) ?? "";
    const stillExists = stored && accounts.some((a) => a.id === stored);

    if (stillExists) {
      // Restore the persisted selection
      setSelectedIdState(stored);
    } else {
      // First-time or deleted account — fall back to first account
      const fallback = accounts[0].id;
      setSelectedIdState(fallback);
      localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [accounts]);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return { selectedId, setSelectedId };
}
