"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type StoreStockCoverItem = {
  admsite_code: number;
  store_name: string;
  site_type?: string;
  department: string;
  sales_units: number;
  revenue: number;
  stock_units: number;
  stock_value: number;
  transfer_in_units: number;
  transfer_out_units: number;
  wh_transfer_in_units: number;
  store_woc: number;
  stock_health_status: "HIGH_RISK_STOCKOUT" | "OVERSTOCKED" | "BALANCED" | "NEGATIVE_TRANSFER_LAG";
};

export type RebalanceRecommendationItem = {
  barcode: string;
  description?: string;
  department?: string;
  source_store_code: number;
  source_store_name: string;
  source_stock: number;
  source_woc: number;
  target_store_code: number;
  target_store_name: string;
  target_stock: number;
  target_woc: number;
  recommended_transfer_qty: number;
  transfer_type: "DC_REPLENISHMENT" | "LATERAL_REBALANCE";
  urgency_level: "CRITICAL" | "HIGH" | "MEDIUM";
};

export type TransferHistoryItem = {
  admsite_code: number;
  store_name: string;
  site_type: string;
  transfer_in_units: number;
  transfer_out_units: number;
  wh_transfer_in_units: number;
  net_transfer_flow: number;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  message?: string;
  supported?: boolean;
}

export function useAllocationData() {
  const { selectedStores, selectedDepartment } = useOlapFilter();

  const [coverItems, setCoverItems] = useState<StoreStockCoverItem[]>([]);
  const [recommendations, setRecommendations] = useState<RebalanceRecommendationItem[]>([]);
  const [historyItems, setHistoryItems] = useState<TransferHistoryItem[]>([]);
  const [supported, setSupported] = useState<boolean>(true);
  const [unsupportedMessage, setUnsupportedMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        store_ids: selectedStores,
        department: selectedDepartment !== "All" ? selectedDepartment : undefined,
      };

      const [coverRes, recRes, historyRes] = await Promise.all([
        apiClient<ApiResponse<StoreStockCoverItem[]>>("/allocation/store-cover", { params }),
        apiClient<ApiResponse<RebalanceRecommendationItem[]>>("/allocation/rebalance-recommendations", { params: { ...params, limit: 100 } }),
        apiClient<ApiResponse<TransferHistoryItem[]>>("/allocation/transfer-history", { params: { store_ids: selectedStores } }),
      ]);

      if (recRes?.supported === false || coverRes?.supported === false) {
        setSupported(false);
        setUnsupportedMessage(
          recRes?.message ||
          coverRes?.message ||
          "Allocation and rebalancing require stock-on-hand inventory data, which is unavailable in the current POS sales ledger dataset."
        );
      } else {
        setSupported(true);
        setUnsupportedMessage(null);
      }

      if (coverRes?.success && Array.isArray(coverRes.data)) {
        setCoverItems(coverRes.data);
      } else {
        setCoverItems([]);
      }

      if (recRes?.success && Array.isArray(recRes.data)) {
        setRecommendations(recRes.data);
      } else {
        setRecommendations([]);
      }

      if (historyRes?.success && Array.isArray(historyRes.data)) {
        setHistoryItems(historyRes.data);
      } else {
        setHistoryItems([]);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load store allocation metrics";
      console.error("Failed to fetch Store Allocation data:", err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedStores, selectedDepartment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    coverItems,
    recommendations,
    historyItems,
    loading,
    error,
    supported,
    unsupportedMessage,
    refresh: fetchData,
  };
}
