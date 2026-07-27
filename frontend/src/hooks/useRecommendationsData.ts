"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type RecommendationItem = {
  id: string;
  category: "REORDER" | "TRANSFER" | "MARKDOWN";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence_score: number;
  barcode: string;
  title?: string;
  department?: string;
  division?: string;
  message: string;
  action_quantity: number;
  recommended_discount_pct?: number;
  estimated_financial_impact: number;
  source_store_code?: number;
  source_store_name?: string;
  target_store_code?: number;
  target_store_name?: string;
};

export type RecommendationSummaryData = {
  total_recommendations: number;
  reorder_count: number;
  transfer_count: number;
  markdown_count: number;
  avg_confidence_score: number;
  total_financial_impact: number;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export function useRecommendationsData() {
  const { selectedDepartment } = useOlapFilter();

  const [summary, setSummary] = useState<RecommendationSummaryData | null>(null);
  const [feedItems, setFeedItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        department: selectedDepartment !== "All" ? selectedDepartment : undefined,
      };

      const [summaryRes, feedRes] = await Promise.all([
        apiClient<ApiResponse<RecommendationSummaryData>>("/recommendations/summary"),
        apiClient<ApiResponse<RecommendationItem[]>>("/recommendations/feed", { params: { ...params, limit: 100 } }),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (feedRes.success && feedRes.data) setFeedItems(feedRes.data);
    } catch (err: unknown) {
      console.error("Failed to fetch AI Recommendations data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load AI recommendations";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    feedItems,
    loading,
    error,
    refresh: fetchData,
  };
}
