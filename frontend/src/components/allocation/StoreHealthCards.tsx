"use client";

import React from "react";
import { StoreStockCoverItem, TransferHistoryItem } from "@/hooks/useAllocationData";

export function StoreHealthCards({
  coverItems,
  historyItems,
  loading,
}: {
  coverItems: StoreStockCoverItem[];
  historyItems: TransferHistoryItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const stockoutCount = coverItems.filter((i) => i.stock_health_status === "HIGH_RISK_STOCKOUT").length;
  const overstockedCount = coverItems.filter((i) => i.stock_health_status === "OVERSTOCKED").length;
  const totalTransfers = historyItems.reduce((acc, curr) => acc + curr.transfer_in_units, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* 1. High Stockout Risk Departments */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Stockout Risk Outlets
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            WOC &lt; 2.5 Wks
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {stockoutCount} <span className="text-sm font-normal text-gray-500">Depts</span>
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Departments at risk of lost sales due to depleted inventory
        </p>
      </div>

      {/* 2. Overstocked Departments */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Overstocked Inventory
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            WOC &gt; 12 Wks
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {overstockedCount} <span className="text-sm font-normal text-gray-500">Depts</span>
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Departments carrying excessive stock ready for lateral transfer
        </p>
      </div>

      {/* 3. Total Inter-Store Transfers */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Transfer Volume Moved
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            Inter-Store & DC
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {totalTransfers.toLocaleString()} <span className="text-sm font-normal text-gray-500">Units</span>
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Total inventory units transferred across retail nodes
        </p>
      </div>
    </div>
  );
}
