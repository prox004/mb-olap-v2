"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type VendorScorecardItem = {
  vendor_name: string;
  total_skus_supplied: number;
  receive_units: number;
  receive_value: number;
  return_units: number;
  return_value: number;
  sales_units: number;
  net_revenue: number;
  gross_profit: number;
  current_stock_units: number;
  current_stock_value: number;
  sell_through_pct: number;
  margin_pct: number;
  return_rate_pct: number;
  vendor_score: number;
};

export type VendorListResponse = {
  total_vendors: number;
  items: VendorScorecardItem[];
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  supported?: boolean;
}

export function useVendorData() {
  const { selectedStores, selectedMonths, isLoadingLocations, isLoadingMonths } = useOlapFilter();

  const [scorecard, setScorecard] = useState<VendorListResponse>({ total_vendors: 0, items: [] });
  const [returnVendors, setReturnVendors] = useState<VendorScorecardItem[]>([]);
  const [returnsSupported, setReturnsSupported] = useState<boolean>(true);
  const [returnsMessage, setReturnsMessage] = useState<string | null>(null);
  const [topContributors, setTopContributors] = useState<VendorScorecardItem[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("vendor_score");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search debounce handler
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    // Prevent premature query before initial filter metadata loads
    if (isLoadingLocations || isLoadingMonths) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        store_ids: selectedStores,
        months: selectedMonths,
      };

      const results = await Promise.allSettled([
        apiClient<ApiResponse<VendorListResponse>>("/vendor/scorecard", {
          params: {
            ...filterParams,
            search_name: debouncedSearch || undefined,
            sort_by: sortBy,
            order: order,
            limit: 100,
          },
        }),
        apiClient<ApiResponse<VendorScorecardItem[]>>("/vendor/returns", {
          params: {
            ...filterParams,
            min_return_rate: 5.0,
          },
        }),
        apiClient<ApiResponse<VendorScorecardItem[]>>("/vendor/top-contributors", {
          params: {
            ...filterParams,
            limit: 10,
          },
        }),
      ]);

      const scorecardRes = results[0].status === "fulfilled" ? results[0].value : null;
      const returnsRes = results[1].status === "fulfilled" ? results[1].value : null;
      const topRes = results[2].status === "fulfilled" ? results[2].value : null;

      if (scorecardRes?.success && scorecardRes.data) {
        setScorecard({
          total_vendors: scorecardRes.data.total_vendors ?? 0,
          items: Array.isArray(scorecardRes.data.items) ? scorecardRes.data.items : [],
        });
      }

      if (returnsRes) {
        if (returnsRes.supported === false) {
          setReturnsSupported(false);
          setReturnsMessage(
            returnsRes.message ||
            "The current inventory dataset does not contain separate vendor-return transaction records, so return-risk analysis cannot be calculated reliably."
          );
        } else {
          setReturnsSupported(true);
          setReturnsMessage(null);
        }

        if (returnsRes.success && Array.isArray(returnsRes.data)) {
          setReturnVendors(returnsRes.data);
        } else {
          setReturnVendors([]);
        }
      }

      if (topRes?.success && Array.isArray(topRes.data)) {
        setTopContributors(topRes.data);
      }

      // Check if all endpoints rejected
      const allFailed = results.every((r) => r.status === "rejected");
      if (allFailed) {
        const firstErr = (results[0] as PromiseRejectedResult).reason;
        setError(firstErr instanceof Error ? firstErr.message : "Failed to load vendor metrics");
      }
    } catch (err: unknown) {
      console.error("Failed to load Vendor Performance data:", err);
      const msg = err instanceof Error ? err.message : "Failed to load vendor metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStores, selectedMonths, debouncedSearch, sortBy, order, isLoadingLocations, isLoadingMonths]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setOrder("desc");
    }
  };

  return {
    scorecard,
    returnVendors,
    topContributors,
    returnsSupported,
    returnsMessage,
    searchTerm,
    setSearchTerm,
    sortBy,
    order,
    handleSort,
    loading,
    error,
    refresh: fetchData,
  };
}
