"use client";

import { useCallback, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { ExecutiveKPIs, SKURankingItem } from "@/hooks/useExecutiveData";
import { CategoryHierarchyItem } from "@/hooks/useCategoryData";
import { LocationOption } from "@/context/OlapFilterContext";
import {
  ComparisonFilters,
  ComparisonReport,
  ComparisonSelection,
  ComparisonSideData,
} from "@/types/comparison";
import { isSameSelection } from "@/utils/comparisonUtils";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function fetchSideData(
  storeId: number,
  month: string,
  storeName: string,
  filters: ComparisonFilters,
  date?: string | null
): Promise<ComparisonSideData> {
  const params = {
    store_ids: [storeId],
    months: [month],
    division: filters.division !== "All" ? filters.division : undefined,
    department: filters.department !== "All" ? filters.department : undefined,
  };

  const [kpiRes, hierarchyRes, skuRes] = await Promise.all([
    apiClient<ApiResponse<ExecutiveKPIs>>("/executive/kpis", { params }),
    apiClient<ApiResponse<CategoryHierarchyItem[]>>("/category/hierarchy", {
      params: { ...params, group_level: "department" },
    }),
    apiClient<ApiResponse<{ top_skus: SKURankingItem[]; bottom_skus: SKURankingItem[] }>>(
      "/executive/top-bottom-skus",
      { params: { ...params, limit: 10 } }
    ),
  ]);

  if (!kpiRes.success || !kpiRes.data) {
    throw new Error(kpiRes.message || "Failed to load KPIs");
  }

  return {
    storeId,
    storeName,
    month,
    date: date ?? null,
    kpis: kpiRes.data,
    departments: hierarchyRes.data || [],
    topSkus: skuRes.data?.top_skus || [],
    bottomSkus: skuRes.data?.bottom_skus || [],
  };
}

export function useComparisonData(stores: LocationOption[]) {
  const [left, setLeft] = useState<ComparisonSelection>({ storeId: null, month: null, date: null });
  const [right, setRight] = useState<ComparisonSelection>({ storeId: null, month: null, date: null });
  const [filters, setFilters] = useState<ComparisonFilters>({
    division: "All",
    department: "All",
  });
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const getStoreName = useCallback(
    (storeId: number) => stores.find((s) => s.admsite_code === storeId)?.name || `Store ${storeId}`,
    [stores]
  );

  const compare = useCallback(async () => {
    setValidationError(null);
    setError(null);

    if (!left.storeId || !left.month || !right.storeId || !right.month) {
      setValidationError("Select a store and month for both sides before comparing.");
      return;
    }

    if (isSameSelection(left.storeId, left.month, right.storeId, right.month, left.date, right.date)) {
      setValidationError("Both selections are identical. Choose a different store, month, or date for comparison.");
      return;
    }

    setLoading(true);
    try {
      const [leftData, rightData] = await Promise.all([
        fetchSideData(left.storeId, left.month, getStoreName(left.storeId), filters, left.date),
        fetchSideData(right.storeId, right.month, getStoreName(right.storeId), filters, right.date),
      ]);

      setReport({
        left: leftData,
        right: rightData,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [left, right, filters, getStoreName]);

  return {
    left,
    right,
    setLeft,
    setRight,
    filters,
    setFilters,
    report,
    loading,
    error,
    validationError,
    compare,
    clearReport: () => setReport(null),
  };
}
