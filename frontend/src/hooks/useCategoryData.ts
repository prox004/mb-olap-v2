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
  const {
    selectedStores,
    selectedMonths,
    selectedDivision,
    isLoadingLocations,
    isLoadingMonths,
  } = useOlapFilter();

  const [hierarchy, setHierarchy] = useState<CategoryHierarchyItem[]>([]);
  const [matrix, setMatrix] = useState<CategoryMatrixItem[]>([]);
  const [topMovers, setTopMovers] = useState<TopMoversData>({ fastest_movers: [], underperformers: [] });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Prevent premature query before initial filter metadata loads
    if (isLoadingLocations || isLoadingMonths) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        store_ids: selectedStores,
        months: selectedMonths,
        division: selectedDivision !== "All" ? selectedDivision : undefined,
      };

      const results = await Promise.allSettled([
        apiClient<ApiResponse<CategoryHierarchyItem[]>>("/category/hierarchy", { params: { ...params, group_level: "department" } }),
        apiClient<ApiResponse<CategoryMatrixItem[]>>("/category/matrix", { params }),
        apiClient<ApiResponse<TopMoversData>>("/category/top-movers", { params: { ...params, limit: 5 } }),
      ]);

      const hierarchyRes = results[0].status === "fulfilled" ? results[0].value : null;
      const matrixRes = results[1].status === "fulfilled" ? results[1].value : null;
      const moversRes = results[2].status === "fulfilled" ? results[2].value : null;

      if (hierarchyRes?.success && Array.isArray(hierarchyRes.data)) {
        setHierarchy(hierarchyRes.data);
      }
      if (matrixRes?.success && Array.isArray(matrixRes.data)) {
        setMatrix(matrixRes.data);
      }
      if (moversRes?.success && moversRes.data) {
        setTopMovers({
          fastest_movers: Array.isArray(moversRes.data.fastest_movers) ? moversRes.data.fastest_movers : [],
          underperformers: Array.isArray(moversRes.data.underperformers) ? moversRes.data.underperformers : [],
        });
      }

      // Check if all endpoints rejected
      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        const firstErr = (results[0] as PromiseRejectedResult).reason;
        setError(firstErr instanceof Error ? firstErr.message : "Failed to load category metrics");
      }
    } catch (err: unknown) {
      console.error("Failed to load Category Performance data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load category metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStores, selectedMonths, selectedDivision, isLoadingLocations, isLoadingMonths]);

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
