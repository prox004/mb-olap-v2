"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type ColourPerformanceItem = {
  extracted_colour: string;
  division?: string;
  department?: string;
  total_skus: number;
  sales_units: number;
  net_revenue: number;
  gross_profit: number;
  margin_pct: number;
  current_stock_units: number;
  current_stock_value: number;
  sell_through_pct: number;
};

export type ColourSummaryResponse = {
  total_colours: number;
  top_colour_by_revenue: string;
  items: ColourPerformanceItem[];
};

export type TopColoursData = {
  top_performers: ColourPerformanceItem[];
  underperformers: ColourPerformanceItem[];
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export function useColourData() {
  const { selectedStores, selectedMonths, selectedDepartment, selectedDivision } = useOlapFilter();

  const [summary, setSummary] = useState<ColourSummaryResponse>({
    total_colours: 0,
    top_colour_by_revenue: "NONE",
    items: [],
  });
  const [departmentBreakdown, setDepartmentBreakdown] = useState<ColourPerformanceItem[]>([]);
  const [topColours, setTopColours] = useState<TopColoursData>({
    top_performers: [],
    underperformers: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        store_ids: selectedStores,
        months: selectedMonths,
        department: selectedDepartment !== "All" ? selectedDepartment : undefined,
        division: selectedDivision !== "All" ? selectedDivision : undefined,
      };

      const [summaryRes, breakdownRes, topRes] = await Promise.all([
        apiClient<ApiResponse<ColourSummaryResponse>>("/colour/performance", { params: filterParams }),
        apiClient<ApiResponse<ColourPerformanceItem[]>>("/colour/department-breakdown", { params: filterParams }),
        apiClient<ApiResponse<TopColoursData>>("/colour/top-colours", { params: { ...filterParams, limit: 5 } }),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (breakdownRes.success && breakdownRes.data) setDepartmentBreakdown(breakdownRes.data);
      if (topRes.success && topRes.data) setTopColours(topRes.data);
    } catch (err: unknown) {
      console.error("Failed to load Colour Analytics data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load colour metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStores, selectedMonths, selectedDepartment, selectedDivision]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    departmentBreakdown,
    topColours,
    loading,
    error,
    refresh: fetchData,
  };
}
