"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";

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
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
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

// Fetch summary breakdown
  const fetchBreakdown = useCallback(async () => {
    try {
      const res = await apiClient<ApiResponse<VelocityBreakdownItem[]>>("/merchandise/velocity-breakdown");
      if (res.success && res.data) {
        setBreakdown(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load velocity breakdown:", err);
    }
  }, []);

  // Fetch SKU list
  const fetchSkus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        order: sortOrder,
      };

      if (velocityFilter !== "ALL") params.velocity_status = velocityFilter;
      if (departmentFilter !== "ALL") params.department = departmentFilter;
      if (vendorFilter !== "ALL") params.vendor = vendorFilter;
      if (searchQuery.trim()) params.department = searchQuery.trim(); // search applied to text filters

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
  }, [page, pageSize, sortBy, sortOrder, velocityFilter, departmentFilter, vendorFilter, searchQuery]);

  // Fetch Dead Stock
  const fetchDeadStock = useCallback(async () => {
    try {
      setDeadStockLoading(true);
      const res = await apiClient<ApiResponse<DeadStockSummary>>("/merchandise/dead-stock", {
        params: { page: deadStockPage, page_size: 50 },
      });
      if (res.success && res.data) {
        setDeadStockSummary(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load dead stock candidates:", err);
    } finally {
      setDeadStockLoading(false);
    }
  }, [deadStockPage]);

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
    departmentFilter,
    setDepartmentFilter,
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
