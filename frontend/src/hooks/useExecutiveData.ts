"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type ExecutiveKPIs = {
  total_revenue: number;
  total_sales_units: number;
  total_gross_profit: number;
  gross_margin_pct: number;
  total_inventory_value: number;
  total_inventory_units: number;
  sell_through_pct: number;
  average_woc: number;
};

export type StoreRankingItem = {
  admsite_code: number;
  store_name: string;
  store_revenue: number;
  store_sales_units: number;
  store_gross_profit: number;
  store_margin_pct: number;
  store_stock_value: number;
  store_stock_units: number;
  store_woc: number;
};

export type SKURankingItem = {
  barcode: string;
  item_description?: string;
  division?: string;
  department?: string;
  sku_revenue: number;
  sku_sales_units: number;
  sku_gross_profit: number;
  current_stock_units: number;
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
  const { selectedStores, selectedMonths, selectedDivision, selectedDepartment } = useOlapFilter();

  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null);
  const [storeRankings, setStoreRankings] = useState<StoreRankingItem[]>([]);
  const [topSkus, setTopSkus] = useState<SKURankingItem[]>([]);
  const [bottomSkus, setBottomSkus] = useState<SKURankingItem[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        store_ids: selectedStores,
        months: selectedMonths,
        division: selectedDivision !== "All" ? selectedDivision : undefined,
        department: selectedDepartment !== "All" ? selectedDepartment : undefined,
      };

      const [kpiRes, storeRes, skuRes, trendRes] = await Promise.all([
        apiClient<ApiResponse<ExecutiveKPIs>>("/executive/kpis", { params }),
        apiClient<ApiResponse<StoreRankingItem[]>>("/executive/store-rankings", { params }),
        apiClient<ApiResponse<{ top_skus: SKURankingItem[]; bottom_skus: SKURankingItem[] }>>("/executive/top-bottom-skus", { params: { ...params, limit: 10 } }),
        apiClient<ApiResponse<MonthlyTrendItem[]>>("/executive/monthly-trends", { params }),
      ]);

      if (kpiRes.success && kpiRes.data) setKpis(kpiRes.data);
      if (storeRes.success && storeRes.data) setStoreRankings(storeRes.data);
      if (skuRes.success && skuRes.data) {
        setTopSkus(skuRes.data.top_skus || []);
        setBottomSkus(skuRes.data.bottom_skus || []);
      }
      if (trendRes.success && trendRes.data) setMonthlyTrends(trendRes.data);
    } catch (err: unknown) {
      console.error("Failed to fetch Executive Dashboard data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load executive metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStores, selectedMonths, selectedDivision, selectedDepartment]);

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
