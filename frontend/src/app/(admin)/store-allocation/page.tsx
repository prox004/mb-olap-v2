"use client";

import React from "react";
import { useAllocationData } from "@/hooks/useAllocationData";
import { StoreHealthCards } from "@/components/allocation/StoreHealthCards";
import { TransferMovementChart } from "@/components/allocation/TransferMovementChart";
import { RebalanceTable } from "@/components/allocation/RebalanceTable";
import { StoreStockCoverTable } from "@/components/allocation/StoreStockCoverTable";

export default function StoreAllocationPage() {
  const { coverItems, recommendations, historyItems, loading, error } = useAllocationData();

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Store Allocation & Inter-Store Rebalancing
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Min-Max Weeks of Cover (WOC) optimization, stockout prevention, and STO transfer generation
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
          Backend Connection Error: {error}. Make sure backend server is running (`python backend/run.py`).
        </div>
      )}

      {/* 1. Store Health Overview Cards */}
      <StoreHealthCards coverItems={coverItems} historyItems={historyItems} loading={loading} />

      {/* 2. Automated Rebalancing Desk */}
      <RebalanceTable recommendations={recommendations} loading={loading} />

      {/* 3. Transfer Movement Chart */}
      <TransferMovementChart historyItems={historyItems} loading={loading} />

      {/* 4. Store Stock Cover Matrix */}
      <StoreStockCoverTable items={coverItems} loading={loading} />
    </div>
  );
}
