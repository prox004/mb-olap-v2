"use client";

import React, { useState } from "react";
import { useMerchandiseData } from "@/hooks/useMerchandiseData";
import { VelocitySummaryCards } from "@/components/merchandise/VelocitySummaryCards";
import { SkuVelocityTable } from "@/components/merchandise/SkuVelocityTable";
import { DeadStockDesk } from "@/components/merchandise/DeadStockDesk";

export default function MerchandiseBuyingPage() {
  const {
    breakdown,
    skuResponse,
    deadStockSummary,
    loading,
    deadStockLoading,
    error,
    page,
    setPage,
    pageSize,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    velocityFilter,
    setVelocityFilter,
    searchQuery,
    setSearchQuery,
    deadStockPage,
    setDeadStockPage,
  } = useMerchandiseData();

  const [activeTab, setActiveTab] = useState<"explorer" | "deadstock">("explorer");

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Merchandise Buying & SKU Velocity Desk
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            SKU velocity classification, Weeks of Cover (WOC), and 90-Day Dead Stock liquidation desk
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "explorer"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            📦 SKU Velocity Performance Explorer
          </button>
          <button
            onClick={() => setActiveTab("deadstock")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "deadstock"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            💀 Dead Stock Liquidation Desk
          </button>
        </div>
      </div>

      {/* Connection Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
          ⚠️ Backend Connection Error: {error}. Make sure backend server is running (`python backend/run.py`).
        </div>
      )}

      {/* Inventory Velocity Summary Cards */}
      <VelocitySummaryCards breakdown={breakdown} loading={loading} />

      {/* Main Tab Content */}
      {activeTab === "explorer" ? (
        <SkuVelocityTable
          items={skuResponse.items}
          totalRecords={skuResponse.total_records}
          page={page}
          pageSize={pageSize}
          loading={loading}
          velocityFilter={velocityFilter}
          onVelocityFilterChange={setVelocityFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onPageChange={setPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      ) : (
        <DeadStockDesk
          summary={deadStockSummary}
          loading={deadStockLoading}
          page={deadStockPage}
          onPageChange={setDeadStockPage}
        />
      )}
    </div>
  );
}
