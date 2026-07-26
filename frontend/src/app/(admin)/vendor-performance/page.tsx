"use client";

import React from "react";
import { useVendorData } from "@/hooks/useVendorData";
import { VendorSummaryCards } from "@/components/vendor/VendorSummaryCards";
import { VendorScorecardTable } from "@/components/vendor/VendorScorecardTable";
import { VendorReturnChart } from "@/components/vendor/VendorReturnChart";

export default function VendorPerformancePage() {
  const {
    scorecard,
    returnVendors,
    searchTerm,
    setSearchTerm,
    sortBy,
    order,
    handleSort,
    loading,
    error,
  } = useVendorData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Vendor Commercial Scorecard & Analytics
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supplier performance metrics, sell-through %, margin contribution, goods return rate, and weighted vendor scoring index.
          </p>
        </div>
      </div>

      {/* Connection Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
           Backend Connection Error: {error}. Please ensure FastAPI backend is running (`python backend/run.py`).
        </div>
      )}

      {/* Section 1: High-level KPI Summary Cards */}
      <VendorSummaryCards
        scorecard={scorecard}
        returnVendors={returnVendors}
        loading={loading}
      />

      {/* Section 2: Goods Return Analysis Chart */}
      <VendorReturnChart
        returnVendors={returnVendors}
        loading={loading}
      />

      {/* Section 3: Vendor Commercial Scorecard Explorer Table */}
      <VendorScorecardTable
        items={scorecard.items}
        totalVendors={scorecard.total_vendors}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        order={order}
        onSort={handleSort}
        loading={loading}
      />
    </div>
  );
}
