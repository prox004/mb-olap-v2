"use client";

import React, { useState } from "react";
import { RecommendationItem } from "@/hooks/useRecommendationsData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

export function RecommendationFeed({
  items,
  loading,
  onExecute,
}: {
  items: RecommendationItem[];
  loading: boolean;
  onExecute: (item: RecommendationItem) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-80 animate-pulse"></div>
    );
  }

  const handleDismiss = (id: string) => {
    setDismissed((prev) => ({ ...prev, [id]: true }));
  };

  const filteredItems = items.filter((item) => {
    if (dismissed[item.id]) return false;
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Machine Learning Actionable Recommendation Feed
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time ML demand predictions, inventory transfers, and dynamic price markdown recommendations
          </p>
        </div>

        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              categoryFilter === "ALL"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            All Recommendations ({items.length})
          </button>
          <button
            onClick={() => setCategoryFilter("REORDER")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              categoryFilter === "REORDER"
                ? "bg-white text-brand-600 shadow-xs dark:bg-gray-700 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Purchase Reorders
          </button>
          <button
            onClick={() => setCategoryFilter("TRANSFER")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              categoryFilter === "TRANSFER"
                ? "bg-white text-purple-600 shadow-xs dark:bg-gray-700 dark:text-purple-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Store Transfers
          </button>
          <button
            onClick={() => setCategoryFilter("MARKDOWN")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              categoryFilter === "MARKDOWN"
                ? "bg-white text-amber-600 shadow-xs dark:bg-gray-700 dark:text-amber-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Dynamic Markdowns
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 flex flex-col justify-between transition-all hover:border-gray-300 dark:hover:border-gray-600"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.category === "REORDER"
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                        : item.category === "TRANSFER"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {item.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.priority === "CRITICAL"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : item.priority === "HIGH"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500">ML Confidence:</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {item.confidence_score}%
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.title} ({item.barcode})
                </h4>
                <div className="text-xs text-gray-500">
                  {item.division} • {item.department}
                </div>
              </div>

              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                {item.message}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
              <div>
                {item.estimated_financial_impact > 0 && (
                  <div className="text-[11px] text-gray-500">
                    Financial Value:{" "}
                    <strong className="text-gray-900 dark:text-white font-bold">
                      {formatCurrency(item.estimated_financial_impact)}
                    </strong>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDismiss(item.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => onExecute(item)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 shadow-xs transition-all cursor-pointer"
                >
                  Execute Action
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
