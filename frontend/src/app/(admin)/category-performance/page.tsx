"use client";

import React, { useState } from "react";
import { useCategoryData } from "@/hooks/useCategoryData";
import { CategoryTreeTable } from "@/components/category/CategoryTreeTable";
import { CategoryMatrixChart } from "@/components/category/CategoryMatrixChart";
import { CategoryTopMovers } from "@/components/category/CategoryTopMovers";

export default function CategoryPerformancePage() {
  const { hierarchy, matrix, topMovers, loading, error } = useCategoryData();
  const [activeTab, setActiveTab] = useState<"tree" | "matrix">("tree");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Category & Product Hierarchy Performance
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Multi-level hierarchy analysis (Division → Section → Department) & Category Performance Matrix
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab("tree")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "tree"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
             Hierarchy Tree View
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "matrix"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
             Performance Matrix (Scatter)
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
           Backend Connection Error: {error}. Make sure backend server is running (`python backend/run.py`).
        </div>
      )}

      {/* Top Movers Widgets */}
      <CategoryTopMovers data={topMovers} loading={loading} />

      {/* Primary Tab Views */}
      {activeTab === "tree" ? (
        <CategoryTreeTable items={hierarchy} loading={loading} />
      ) : (
        <CategoryMatrixChart matrix={matrix} loading={loading} />
      )}
    </div>
  );
}
