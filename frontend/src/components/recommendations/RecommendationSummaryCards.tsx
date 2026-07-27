"use client";

import React from "react";
import { RecommendationSummaryData } from "@/hooks/useRecommendationsData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

export function RecommendationSummaryCards({
  summary,
  loading,
}: {
  summary: RecommendationSummaryData | null;
  loading: boolean;
}) {
  if (loading || !summary) {
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
      {/* 1. Total Recommendations */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Active AI Insights
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            Live Feed
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {summary.total_recommendations} <span className="text-sm font-normal text-gray-500">Alerts</span>
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Actionable ML recommendations generated
        </p>
      </div>

      {/* 2. ML Model Confidence */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            ML Model Accuracy
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            High Precision
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {summary.avg_confidence_score}%
          </h2>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-3">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(summary.avg_confidence_score, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Reorder & Transfer Actions */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Reorders & Transfers
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            Replenishment
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {summary.reorder_count + summary.transfer_count} <span className="text-sm font-normal text-gray-500">Actions</span>
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {summary.reorder_count} POs & {summary.transfer_count} Store Transfers
        </p>
      </div>

      {/* 4. Financial Capital Impact */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Capital Value Impact
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            Recoverable
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(summary.total_financial_impact)}
          </h2>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Estimated financial impact of executing alerts
        </p>
      </div>
    </div>
  );
}
