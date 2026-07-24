"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type CategoryHierarchyItem = {
  division: string;
  section: string;
  department: string;
  department_alias: string;
  net_revenue: number;
  sales_units: number;
  gross_profit: number;
  margin_pct: number;
  closing_stock_value: number;
  closing_stock_units: number;
  sell_through_pct: number;
  woc: number;
};

export type CategoryMatrixItem = {
  department: string;
  division?: string;
  net_revenue: number;
  sales_units: number;
  gross_profit: number;
  margin_pct: number;
  closing_stock_value: number;
  closing_stock_units: number;
  sell_through_pct: number;
  woc: number;
  performance_quadrant: string; // WINNER, VOLUME_DRIVER, HIGH_MARGIN_SLOW, OVERSTOCKED_UNDERPERFORMER
};

export type TopMoversData = {
  fastest_movers: CategoryMatrixItem[];
  underperformers: CategoryMatrixItem[];
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export function useCategoryData() {
  const { selectedStores, selectedMonths, selectedDivision } = useOlapFilter();

  const [hierarchy, setHierarchy] = useState<CategoryHierarchyItem[]>([]);
  const [matrix, setMatrix] = useState<CategoryMatrixItem[]>([]);
  const [topMovers, setTopMovers] = useState<TopMoversData>({ fastest_movers: [], underperformers: [] });

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
      };

      const [hierarchyRes, matrixRes, moversRes] = await Promise.all([
        apiClient<ApiResponse<CategoryHierarchyItem[]>>("/category/hierarchy", { params: { ...params, group_level: "department" } }),
        apiClient<ApiResponse<CategoryMatrixItem[]>>("/category/matrix", { params }),
        apiClient<ApiResponse<TopMoversData>>("/category/top-movers", { params: { ...params, limit: 5 } }),
      ]);

      if (hierarchyRes.success && hierarchyRes.data) setHierarchy(hierarchyRes.data);
      if (matrixRes.success && matrixRes.data) setMatrix(matrixRes.data);
      if (moversRes.success && moversRes.data) setTopMovers(moversRes.data);
    } catch (err: unknown) {
      console.error("Failed to load Category Performance data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load category metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStores, selectedMonths, selectedDivision]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    hierarchy,
    matrix,
    topMovers,
    loading,
    error,
    refresh: fetchData,
  };
}
