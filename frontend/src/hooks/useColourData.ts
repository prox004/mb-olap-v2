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
  current_stock_units: number | null;
  current_stock_value: number | null;
  sell_through_pct: number | null;
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
  supported?: boolean;
  meta?: {
    applied_stores?: number[];
    applied_months?: string[];
    total_records?: number;
  };
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

      if (summaryRes?.success && summaryRes?.data) {
        setSummary({
          total_colours: summaryRes.data.total_colours || 0,
          top_colour_by_revenue: summaryRes.data.top_colour_by_revenue || "NONE",
          items: Array.isArray(summaryRes.data.items) ? summaryRes.data.items : [],
        });
      } else {
        setSummary({ total_colours: 0, top_colour_by_revenue: "NONE", items: [] });
      }

      if (breakdownRes?.success && breakdownRes?.data) {
        setDepartmentBreakdown(Array.isArray(breakdownRes.data) ? breakdownRes.data : []);
      } else {
        setDepartmentBreakdown([]);
      }

      if (topRes?.success && topRes?.data) {
        setTopColours({
          top_performers: Array.isArray(topRes.data.top_performers) ? topRes.data.top_performers : [],
          underperformers: Array.isArray(topRes.data.underperformers) ? topRes.data.underperformers : [],
        });
      } else {
        setTopColours({ top_performers: [], underperformers: [] });
      }
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
