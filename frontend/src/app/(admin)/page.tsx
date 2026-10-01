"use client";

import React from "react";
import Link from "next/link";
import { useExecutiveData } from "@/hooks/useExecutiveData";
import { useCategoryData } from "@/hooks/useCategoryData";
import { ExecutiveKpiCards } from "@/components/executive/ExecutiveKpiCards";
import { MonthlyTrendChart } from "@/components/executive/MonthlyTrendChart";
import { StoreRankingTable } from "@/components/executive/StoreRankingTable";
import { TopBottomSkusWidget } from "@/components/executive/TopBottomSkusWidget";
import { CategoryTopMovers } from "@/components/category/CategoryTopMovers";

export default function CEOExecutivePage() {
  const { kpis, storeRankings, topSkus, bottomSkus, monthlyTrends, loading, error } = useExecutiveData();
  const { topMovers, loading: categoryLoading } = useCategoryData();

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            CEO Executive Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enterprise Analytics high-level financial summary, store rankings, and SKU performance
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
          Backend Connection Error: {error}. Make sure backend server is running (`python backend/run.py`).
        </div>
      )}

      {/* 1. Summary KPI Cards */}
      <ExecutiveKpiCards kpis={kpis} loading={loading} />

      {/* 2. Monthly Trend Chart */}
      <MonthlyTrendChart trends={monthlyTrends} loading={loading} />

      {/* 3. Store Performance Rankings Table */}
      <StoreRankingTable stores={storeRankings} loading={loading} />

      {/* 4. Top & Bottom 10 SKUs List */}
      <TopBottomSkusWidget topSkus={topSkus} bottomSkus={bottomSkus} loading={loading} />

      {/* 5. Category Performance Highlights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Category Performance Highlights
          </h2>
          <Link
            href="/category-performance"
            className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            View Full Category Hierarchy →
          </Link>
        </div>
        <CategoryTopMovers data={topMovers} loading={categoryLoading} />
      </div>
    </div>
  );
}
