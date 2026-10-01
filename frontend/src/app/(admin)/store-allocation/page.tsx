"use client";

import React from "react";
import { useAllocationData } from "@/hooks/useAllocationData";
import { StoreHealthCards } from "@/components/allocation/StoreHealthCards";
import { TransferMovementChart } from "@/components/allocation/TransferMovementChart";
import { RebalanceTable } from "@/components/allocation/RebalanceTable";
import { StoreStockCoverTable } from "@/components/allocation/StoreStockCoverTable";

export default function StoreAllocationPage() {
  const { coverItems, recommendations, historyItems, loading, error, supported, unsupportedMessage } = useAllocationData();

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

      {/* Graceful Unsupported / SOH Notice */}
      {!loading && !supported && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Allocation & Rebalancing Notice:</span>
            <span>{unsupportedMessage || "Allocation recommendations require stock-on-hand (SOH) inventory data, which is unavailable in the current POS sales ledger dataset."}</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
            SOH Data Unavailable
          </span>
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
