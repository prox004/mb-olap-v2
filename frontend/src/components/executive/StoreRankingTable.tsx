"use client";

import React, { useState } from "react";
import { StoreRankingItem } from "@/hooks/useExecutiveData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

export function StoreRankingTable({ stores, loading }: { stores: StoreRankingItem[]; loading: boolean }) {
  const [sortCol, setSortCol] = useState<keyof StoreRankingItem>("store_revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-64 animate-pulse"></div>
    );
  }

  const handleSort = (col: keyof StoreRankingItem) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sortedStores = [...stores].sort((a, b) => {
    const valA = a[sortCol] ?? 0;
    const valB = b[sortCol] ?? 0;
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Store Performance Rankings
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Outlet level revenue, gross margin %, stock valuation, and Weeks of Cover (WOC)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="py-3 px-4">Store Outlet</th>
              <th
                onClick={() => handleSort("store_revenue")}
                className="py-3 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white"
              >
                Revenue (₹) {sortCol === "store_revenue" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
              <th
                onClick={() => handleSort("store_margin_pct")}
                className="py-3 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white"
              >
                Gross Margin % {sortCol === "store_margin_pct" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
              <th
                onClick={() => handleSort("store_stock_value")}
                className="py-3 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white"
              >
                Stock Value (₹) {sortCol === "store_stock_value" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
              <th
                onClick={() => handleSort("store_woc")}
                className="py-3 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white"
              >
                Weeks of Cover (WOC) {sortCol === "store_woc" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedStores.map((item, index) => {
              const isTopStore = index === 0;
              return (
                <tr
                  key={item.admsite_code}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${
                    isTopStore ? "bg-emerald-50/40 dark:bg-emerald-950/20 font-medium" : ""
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    {item.store_name}
                    {isTopStore && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        Top Store
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.store_revenue)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        item.store_margin_pct >= 40
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                          : item.store_margin_pct >= 20
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                      }`}
                    >
                      {item.store_margin_pct}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{formatCurrency(item.store_stock_value)}</td>
                  <td className="py-3.5 px-4 font-medium">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        item.store_woc <= 25
                          ? "text-emerald-600 dark:text-emerald-400"
                          : item.store_woc <= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-purple-600 dark:text-purple-400"
                      }`}
                    >
                      {item.store_woc} Wks
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
