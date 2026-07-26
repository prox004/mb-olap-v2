"use client";

import React, { useState } from "react";
import SizeCurveChart from "@/components/analytics/SizeCurveChart";
import SizePoCalculator from "@/components/analytics/SizePoCalculator";
import PriceLadderWidget from "@/components/analytics/PriceLadderWidget";

export default function SizePriceAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"size" | "price">("size");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Size & Price Elasticity Desk
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Empirical size curves, PO recommended size allocations, and price band profitability analysis
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("size")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "size"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
             Size Curve & PO Calculator
          </button>
          <button
            onClick={() => setActiveTab("price")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "price"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
             Price Band Elasticity
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "size" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SizeCurveChart />
          <SizePoCalculator />
        </div>
      ) : (
        <PriceLadderWidget />
      )}
    </div>
  );
}
