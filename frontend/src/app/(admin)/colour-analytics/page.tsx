"use client";

import React from "react";
import { useColourData } from "@/hooks/useColourData";
import { ColourSummaryCards } from "@/components/colour/ColourSummaryCards";
import { ColourDistributionChart } from "@/components/colour/ColourDistributionChart";
import { ColourMatrixTable } from "@/components/colour/ColourMatrixTable";

export default function ColourAnalyticsPage() {
  const { summary, departmentBreakdown, loading, error } = useColourData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Colour Analytics & Attribute Preference
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Regex description attribute extraction, colour share of revenue, sell-through %, and departmental colour preference matrix.
          </p>
        </div>
      </div>

      {/* Connection Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
           Backend Connection Error: {error}. Please ensure FastAPI backend is running (`python backend/run.py`).
        </div>
      )}

      {/* Section 1: KPI Cards */}
      <ColourSummaryCards summary={summary} loading={loading} />

      {/* Section 2: Distribution Chart */}
      <ColourDistributionChart items={summary.items} loading={loading} />

      {/* Section 3: Department Matrix Table */}
      <ColourMatrixTable items={departmentBreakdown} loading={loading} />
    </div>
  );
}
