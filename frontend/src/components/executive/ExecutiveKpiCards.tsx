"use client";

import React from "react";
import { ExecutiveKPIs } from "@/hooks/useExecutiveData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

export function ExecutiveKpiCards({ kpis, loading }: { kpis: ExecutiveKPIs | null; loading: boolean }) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Chain Revenue */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Chain Sales Revenue
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            {kpis.gross_margin_pct}% Margin
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(kpis.total_revenue)}
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Gross Profit: <strong className="text-gray-800 dark:text-gray-200">{formatCurrency(kpis.total_gross_profit)}</strong>
        </p>
      </div>

      {/* 2. Total Inventory Valuation */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Inventory Value
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            Stock On-Hand
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(kpis.total_inventory_value)}
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Stock Units: <strong className="text-gray-800 dark:text-gray-200">{kpis.total_inventory_units.toLocaleString()}</strong>
        </p>
      </div>

      {/* 3. Overall Sell-Through % */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Sell-Through Rate
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              kpis.sell_through_pct > 25
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                : kpis.sell_through_pct > 15
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
            }`}
          >
            {kpis.sell_through_pct > 25 ? "Optimal" : kpis.sell_through_pct > 15 ? "Moderate" : "Low Velocity"}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {kpis.sell_through_pct}%
          </h2>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-3">
          <div
            className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(kpis.sell_through_pct * 2, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 4. Average Weeks of Cover (WOC) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Average Weeks of Cover
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              kpis.average_woc <= 12
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                : kpis.average_woc <= 35
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                : "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
            }`}
          >
            {kpis.average_woc <= 12 ? "Healthy Cover" : kpis.average_woc <= 35 ? "High Stock" : "Overstocked Node"}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {kpis.average_woc} <span className="text-sm font-normal text-gray-500">Wks</span>
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Target Baseline: <strong className="text-gray-800 dark:text-gray-200">4 – 8 Weeks</strong>
        </p>
      </div>
    </div>
  );
}
