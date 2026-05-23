"use client";

import { Trade } from "@prisma/client";
import { useLang } from "@/context/LangContext";

export function TradeHistoryTable({ trades }: { trades: Trade[] }) {
  const { t } = useLang();

  if (!trades.length) {
    return (
      <div className="text-center py-10 text-slate-500">
        {t("noData") || "No trades logged yet."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-white/5 text-slate-400">
            <th className="py-3 px-4 font-medium">{t("date") || "Date"}</th>
            <th className="py-3 px-4 font-medium">{t("symbol") || "Symbol"}</th>
            <th className="py-3 px-4 font-medium">{t("direction") || "Direction"}</th>
            <th className="py-3 px-4 font-medium">{t("lotSize") || "Lots"}</th>
            <th className="py-3 px-4 font-medium">{t("entryPrice") || "Entry"}</th>
            <th className="py-3 px-4 font-medium">{t("tradeResult") || "Result"}</th>
            <th className="py-3 px-4 font-medium text-right">{t("pnl") || "PnL"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {trades.map((trade) => (
            <tr key={trade.id} className="hover:bg-white/5 transition-colors">
              <td className="py-3 px-4 text-slate-300">
                {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="py-3 px-4 font-mono font-medium text-cyan-200">
                {trade.symbol}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    trade.direction === "BUY"
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "bg-pink-500/10 text-pink-400"
                  }`}
                >
                  {trade.direction}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-300">{trade.lotSize}</td>
              <td className="py-3 px-4 font-mono text-slate-400">{trade.entryPrice}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    trade.result === "WIN"
                      ? "bg-green-500/10 text-green-400"
                      : trade.result === "LOSS"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {t(trade.result.toLowerCase() as any) || trade.result}
                </span>
              </td>
              <td
                className={`py-3 px-4 text-right font-mono font-medium ${
                  trade.pnl > 0
                    ? "text-green-400"
                    : trade.pnl < 0
                    ? "text-red-400"
                    : "text-slate-400"
                }`}
              >
                {trade.pnl > 0 ? "+" : ""}
                {trade.pnl.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
