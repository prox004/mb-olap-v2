"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type SkuVelocityItem = {
  barcode: string;
  description?: string;
  division?: string;
  section?: string;
  department?: string;
  vendor?: string;
  mrp: number;
  cost_rate: number;
  net_revenue: number;
  sales_units: number;
  gross_profit: number;
  closing_stock_units: number;
  closing_stock_value: number;
  sell_through_pct: number;
  woc: number;
  moi: number;
  velocity_status: string; // FAST_MOVER, MEDIUM_MOVER, SLOW_MOVER, DEAD_STOCK
};

export type SkuVelocityResponse = {
  total_records: number;
  page: number;
  page_size: number;
  items: SkuVelocityItem[];
};

export type DeadStockSummary = {
  total_dead_skus: number;
  total_locked_capital: number;
  items: SkuVelocityItem[];
};

export type VelocityBreakdownItem = {
  velocity_status: string;
  sku_count: number;
  closing_stock_value: number;
};

export function useMerchandiseData() {
  const { selectedStores, selectedMonths, selectedDivision, selectedDepartment } = useOlapFilter();

  const [breakdown, setBreakdown] = useState<VelocityBreakdownItem[]>([]);
  const [skuResponse, setSkuResponse] = useState<SkuVelocityResponse>({
    total_records: 0,
    page: 1,
    page_size: 50,
    items: [],
  });
  const [deadStockSummary, setDeadStockSummary] = useState<DeadStockSummary>({
    total_dead_skus: 0,
    total_locked_capital: 0,
    items: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [deadStockLoading, setDeadStockLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination state for SKU Table
  const [velocityFilter, setVelocityFilter] = useState<string>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string>("net_revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dead stock pagination
  const [deadStockPage, setDeadStockPage] = useState<number>(1);

  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
  }

  // Common slice and dice filter params (memoized to avoid creating a new object on every render)
  const filterParams = useMemo(() => ({
    store_ids: selectedStores,
    months: selectedMonths,
    division: selectedDivision !== "All" ? selectedDivision : undefined,
    department: selectedDepartment !== "All" ? selectedDepartment : undefined,
  }), [selectedStores, selectedMonths, selectedDivision, selectedDepartment]);

  // Fetch summary breakdown
  const fetchBreakdown = useCallback(async () => {
    try {
      const res = await apiClient<ApiResponse<VelocityBreakdownItem[]>>("/merchandise/velocity-breakdown", {
        params: filterParams,
      });
      if (res.success && res.data) {
        setBreakdown(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load velocity breakdown:", err);
    }
  }, [filterParams]);

  // Fetch SKU list
  const fetchSkus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        ...filterParams,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        order: sortOrder,
      };

      if (velocityFilter !== "ALL") params.velocity_status = velocityFilter;
      if (vendorFilter !== "ALL") params.vendor = vendorFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient<ApiResponse<SkuVelocityResponse>>("/merchandise/skus", { params });
      if (res.success && res.data) {
        setSkuResponse(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load SKU velocity list:", err);
      const msg = err instanceof Error ? err.message : "Failed to load SKU performance list";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filterParams, page, pageSize, sortBy, sortOrder, velocityFilter, vendorFilter, searchQuery]);

  // Fetch Dead Stock
  const fetchDeadStock = useCallback(async () => {
    try {
      setDeadStockLoading(true);
      const res = await apiClient<ApiResponse<DeadStockSummary>>("/merchandise/dead-stock", {
        params: {
          ...filterParams,
          page: deadStockPage,
          page_size: 50,
        },
      });
      if (res.success && res.data) {
        setDeadStockSummary(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load dead stock candidates:", err);
    } finally {
      setDeadStockLoading(false);
    }
  }, [filterParams, deadStockPage]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  useEffect(() => {
    fetchSkus();
  }, [fetchSkus]);

  useEffect(() => {
    fetchDeadStock();
  }, [fetchDeadStock]);

  return {
    breakdown,
    skuResponse,
    deadStockSummary,
    loading,
    deadStockLoading,
    error,
    // Table filter controls
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    velocityFilter,
    setVelocityFilter,
    vendorFilter,
    setVendorFilter,
    searchQuery,
    setSearchQuery,
    deadStockPage,
    setDeadStockPage,
    refreshSkus: fetchSkus,
    refreshDeadStock: fetchDeadStock,
  };
}
