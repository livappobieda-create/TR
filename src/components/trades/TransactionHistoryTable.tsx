"use client";

import { Transaction } from "@prisma/client";
import { useLang } from "@/context/LangContext";
import { format } from "date-fns";

export function TransactionHistoryTable({ transactions }: { transactions: Transaction[] }) {
  const { t } = useLang();

  if (!transactions.length) {
    return (
      <div className="text-center py-10 text-slate-500">
        {t.noData || "No transactions yet."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-white/5 text-slate-400">
            <th className="py-3 px-4 font-medium">{t.date || "Date"}</th>
            <th className="py-3 px-4 font-medium">Type</th>
            <th className="py-3 px-4 font-medium text-right">{t.amount || "Amount"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
              <td className="py-3 px-4 text-slate-300">
                {format(new Date(tx.date), "MMM d, yyyy")}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    tx.type === "DEPOSIT"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-pink-500/10 text-pink-400"
                  }`}
                >
                  {tx.type}
                </span>
              </td>
              <td
                className={`py-3 px-4 text-right font-mono font-medium ${
                  tx.type === "DEPOSIT" ? "text-green-400" : "text-pink-400"
                }`}
              >
                {tx.type === "DEPOSIT" ? "+" : "-"}
                {tx.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
