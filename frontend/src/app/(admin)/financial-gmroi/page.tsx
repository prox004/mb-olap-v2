"use client";

import React, { useState } from "react";
import GmroiCards from "@/components/financial/GmroiCards";
import GmroiTable from "@/components/financial/GmroiTable";
import BoughtVsSoldChart from "@/components/financial/BoughtVsSoldChart";
import MarkdownWidget from "@/components/financial/MarkdownWidget";

export default function FinancialGmroiPage() {
  const [activeTab, setActiveTab] = useState<"gmroi" | "buying">("gmroi");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Financial Health & GMROI Desk
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Gross Margin Return on Investment (GMROI), markdown impact, and procurement accuracy ratios
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("gmroi")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "gmroi"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
             GMROI Performance
          </button>
          <button
            onClick={() => setActiveTab("buying")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "buying"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
             Buying Accuracy & Markdown Realization
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "gmroi" ? (
        <div className="space-y-6">
          <GmroiCards />
          <GmroiTable />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BoughtVsSoldChart />
          <MarkdownWidget />
        </div>
      )}
    </div>
  );
}
