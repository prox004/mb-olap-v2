"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type ExecutiveKPIs = {
  total_revenue: number;
  total_sales_units: number;
  total_gross_profit: number;
  gross_margin_pct: number;
  total_inventory_value?: number | null;
  total_inventory_units?: number | null;
  sell_through_pct?: number | null;
  average_woc?: number | null;
  inventory_metrics_available?: boolean;
};

export type StoreRankingItem = {
  admsite_code: number;
  store_name: string;
  store_revenue: number;
  store_sales_units: number;
  store_gross_profit: number;
  store_margin_pct: number;
  store_stock_value?: number | null;
  store_stock_units?: number | null;
  store_woc?: number | null;
};

export type SKURankingItem = {
  barcode: string;
  item_description?: string;
  division?: string;
  department?: string;
  sku_revenue: number;
  sku_sales_units: number;
  sku_gross_profit: number;
  current_stock_units?: number | null;
};

export type MonthlyTrendItem = {
  month_name: string;
  revenue: number;
  gross_profit: number;
  gross_margin_pct: number;
  inventory_value: number;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export function useExecutiveData() {
  const {
    selectedStores,
    selectedMonths,
    selectedDivision,
    selectedDepartment,
    isLoadingLocations,
    isLoadingMonths,
  } = useOlapFilter();

  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null);
  const [storeRankings, setStoreRankings] = useState<StoreRankingItem[]>([]);
  const [topSkus, setTopSkus] = useState<SKURankingItem[]>([]);
  const [bottomSkus, setBottomSkus] = useState<SKURankingItem[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // If master filter lookups are still in flight and no stores/months selected, wait for initialization
    if ((isLoadingLocations || isLoadingMonths) && selectedStores.length === 0 && selectedMonths.length === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        store_ids: selectedStores.length > 0 ? selectedStores : undefined,
        months: selectedMonths.length > 0 ? selectedMonths : undefined,
        division: selectedDivision !== "All" ? selectedDivision : undefined,
        department: selectedDepartment !== "All" ? selectedDepartment : undefined,
      };

      const results = await Promise.allSettled([
        apiClient<ApiResponse<ExecutiveKPIs>>("/executive/kpis", { params }),
        apiClient<ApiResponse<StoreRankingItem[]>>("/executive/store-rankings", { params }),
        apiClient<ApiResponse<{ top_skus: SKURankingItem[]; bottom_skus: SKURankingItem[] }>>("/executive/top-bottom-skus", { params: { ...params, limit: 10 } }),
        apiClient<ApiResponse<MonthlyTrendItem[]>>("/executive/monthly-trends", { params }),
      ]);

      const [kpiRes, storeRes, skuRes, trendRes] = results;

      if (kpiRes.status === "fulfilled" && kpiRes.value?.success && kpiRes.value?.data) {
        setKpis(kpiRes.value.data);
      }
      if (storeRes.status === "fulfilled" && storeRes.value?.success && storeRes.value?.data) {
        setStoreRankings(Array.isArray(storeRes.value.data) ? storeRes.value.data : []);
      }
      if (skuRes.status === "fulfilled" && skuRes.value?.success && skuRes.value?.data) {
        setTopSkus(Array.isArray(skuRes.value.data.top_skus) ? skuRes.value.data.top_skus : []);
        setBottomSkus(Array.isArray(skuRes.value.data.bottom_skus) ? skuRes.value.data.bottom_skus : []);
      }
      if (trendRes.status === "fulfilled" && trendRes.value?.success && trendRes.value?.data) {
        setMonthlyTrends(Array.isArray(trendRes.value.data) ? trendRes.value.data : []);
      }

      // Check if all failed
      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        const firstErr = (results[0] as PromiseRejectedResult).reason;
        const msg = firstErr instanceof Error ? firstErr.message : "Failed to load executive metrics";
        setError(msg);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch Executive Dashboard data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load executive metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStores, selectedMonths, selectedDivision, selectedDepartment, isLoadingLocations, isLoadingMonths]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    kpis,
    storeRankings,
    topSkus,
    bottomSkus,
    monthlyTrends,
    loading,
    error,
    refresh: fetchData,
  };
}
