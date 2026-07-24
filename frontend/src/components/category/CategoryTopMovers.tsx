"use client";

import React from "react";
import { TopMoversData } from "@/hooks/useCategoryData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

export function CategoryTopMovers({ data, loading }: { data: TopMoversData; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="h-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse"></div>
        <div className="h-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* 1. Fastest Moving Categories */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🚀 Top 5 Fastest Moving Categories
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ranked by Sell-Through Velocity %</p>
          </div>
        </div>

        <div className="space-y-3">
          {data.fastest_movers.map((item, idx) => (
            <div
              key={item.department}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                    {item.department}
                  </h4>
                  <span className="text-[10px] text-gray-400">{item.division}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {item.sell_through_pct}% Sell-Through
                </div>
                <div className="text-[11px] text-gray-500">{formatCurrency(item.net_revenue)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Overstocked Underperformers */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ⚠️ Top 5 Overstocked Underperformers
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ranked by High Weeks of Cover (WOC)</p>
          </div>
        </div>

        <div className="space-y-3">
          {data.underperformers.map((item, idx) => (
            <div
              key={item.department}
              className="flex items-center justify-between p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                    {item.department}
                  </h4>
                  <span className="text-[10px] text-gray-400">{item.division}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {item.woc} Wks Cover
                </div>
                <div className="text-[11px] text-gray-500">{formatCurrency(item.closing_stock_value)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
