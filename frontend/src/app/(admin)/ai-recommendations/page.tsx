"use client";

import React, { useState } from "react";
import { useRecommendationsData, RecommendationItem } from "@/hooks/useRecommendationsData";
import { RecommendationSummaryCards } from "@/components/recommendations/RecommendationSummaryCards";
import { RecommendationFeed } from "@/components/recommendations/RecommendationFeed";
import { ActionModal } from "@/components/recommendations/ActionModal";

export default function AIRecommendationsPage() {
  const { summary, feedItems, loading, error, refresh } = useRecommendationsData();
  const [selectedItem, setSelectedItem] = useState<RecommendationItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExecute = (item: RecommendationItem) => {
    setSelectedItem(item);
  };

  const handleSuccess = (msg: string) => {
    setToastMessage(msg);
    refresh();
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            AI Recommendations Center
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Machine learning predictive demand forecasting, network transfer optimization, and dynamic price markdowns
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-300 text-xs font-semibold shadow-xs transition-all">
          ✓ {toastMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
          Backend Connection Error: {error}. Make sure backend server is running (`python backend/run.py`).
        </div>
      )}

      {/* 1. Summary Metric Cards */}
      <RecommendationSummaryCards summary={summary} loading={loading} />

      {/* 2. Actionable ML Feed */}
      <RecommendationFeed items={feedItems} loading={loading} onExecute={handleExecute} />

      {/* 3. Action Execution Confirmation Modal */}
      <ActionModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={handleSuccess} />
    </div>
  );
}
