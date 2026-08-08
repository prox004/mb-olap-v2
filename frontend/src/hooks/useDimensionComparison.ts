"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { ComparisonTableConfig } from "@/types/comparison";
import { DatasetMeta, PreviewResponse } from "@/types/reporting";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DimensionComparisonRow {
  period: string;
  dimensionValue: string;
  current: number;
  previous: number | null;
  difference: number | null;
  percentChange: number | null;
}

export function useDimensionComparison(
  config: ComparisonTableConfig,
  storeIds?: number[]
) {
  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [rows, setRows] = useState<DimensionComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const storeIdsKey = useMemo(() => storeIds?.join(",") ?? "", [storeIds]);

  const {
    dateField,
    dimension,
    metric,
    compareBy,
    comparePeriods,
    dateRange,
    customFrom,
    customTo,
  } = config;

  useEffect(() => {
    apiClient<ApiResponse<DatasetMeta[]>>("/reporting/datasets")
      .then((res) => {
        if (res.success && res.data?.length) {
          setDataset(res.data.find((d) => d.id === "sales_inventory") ?? res.data[0]);
        }
      })
      .catch(() => setDataset(null));
  }, []);

  const fetchComparison = useCallback(async () => {
    if (!dateField || !dimension || !metric || !dataset) {
      setRows((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const filters = storeIdsKey
        ? [{ field_id: "admsite_code", operator: "in" as const, values: storeIdsKey.split(",").map(Number) }]
        : [];

      const report = {
        dataset_id: dataset.id,
        name: "Comparison",
        visualization: "table" as const,
        rows: [dimension],
        columns: [dateField],
        value_fields: [
          {
            id: "vf_metric",
            field_id: metric,
            aggregation: "sum" as const,
            format: "auto" as const,
            decimals: 2,
            show_as: "value" as const,
          },
        ],
        measures: [metric],
        filters,
        sort: [],
        options: {
          show_grand_totals: true,
          show_row_subtotals: false,
          show_column_subtotals: false,
          layout: "compact" as const,
        },
        limit: 500,
        page: 1,
        page_size: 100,
      };

      const res = await apiClient<ApiResponse<PreviewResponse>>("/reporting/preview", {
        method: "POST",
        body: JSON.stringify({ report }),
      });

      if (currentRequest !== requestId.current) return;

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load comparison data");
      }

      const preview = res.data;
      const dimLabel =
        dataset.dimensions.find((d) => d.id === dimension)?.label ?? dimension;
      const dateLabel =
        dataset.dimensions.find((d) => d.id === dateField)?.label ?? dateField;
      const metricLabel =
        preview.columns.find((c) => c !== dimLabel && c !== dateLabel) ??
        preview.columns[preview.columns.length - 1];

      const parsed: DimensionComparisonRow[] = preview.data.map((row) => {
        const period = String(row[dateLabel] ?? "");
        const dimensionValue = String(row[dimLabel] ?? "");
        const current = Number(row[metricLabel] ?? 0);
        return { period, dimensionValue, current, previous: null, difference: null, percentChange: null };
      });

      if (comparePeriods) {
        const byDim = new Map<string, DimensionComparisonRow[]>();
        parsed.forEach((r) => {
          const list = byDim.get(r.dimensionValue) ?? [];
          list.push(r);
          byDim.set(r.dimensionValue, list);
        });
        const withPeriods: DimensionComparisonRow[] = [];
        byDim.forEach((items) => {
          const sorted = [...items].sort((a, b) => a.period.localeCompare(b.period));
          sorted.forEach((item, idx) => {
            const prev = idx > 0 ? sorted[idx - 1].current : null;
            withPeriods.push({
              ...item,
              previous: prev,
              difference: prev !== null ? item.current - prev : null,
              percentChange:
                prev !== null && prev !== 0 ? ((item.current - prev) / prev) * 100 : null,
            });
          });
        });
        setRows(withPeriods);
      } else {
        setRows(parsed);
      }
    } catch (e) {
      if (currentRequest !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Comparison failed");
      setRows((prev) => (prev.length === 0 ? prev : []));
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [
    dateField,
    dimension,
    metric,
    compareBy,
    comparePeriods,
    dateRange,
    customFrom,
    customTo,
    dataset,
    storeIdsKey,
  ]);

  useEffect(() => {
    if (dateField && dimension && metric) {
      fetchComparison();
    } else {
      setRows((prev) => (prev.length === 0 ? prev : []));
    }
  }, [dateField, dimension, metric, compareBy, comparePeriods, dateRange, customFrom, customTo, fetchComparison]);

  return { dataset, rows, loading, error, refetch: fetchComparison };
}
