"use client";

import React, { useEffect, useState } from "react";
import { ComparisonDateConfig, DateRangePreset } from "@/types/comparison";
import { apiClient } from "@/utils/apiClient";
import { DatasetMeta } from "@/types/reporting";

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

interface ComparisonDatePanelProps {
  config: ComparisonDateConfig;
  onChange: (patch: Partial<ComparisonDateConfig>) => void;
}

export function ComparisonDatePanel({ config, onChange }: ComparisonDatePanelProps) {
  const [dataset, setDataset] = useState<DatasetMeta | null>(null);

  useEffect(() => {
    apiClient<{ success: boolean; data?: DatasetMeta[] }>("/reporting/datasets")
      .then((res) => {
        if (res.success && res.data?.length) {
          setDataset(res.data.find((d) => d.id === "sales_inventory") ?? res.data[0]);
        }
      })
      .catch(() => setDataset(null));
  }, []);

  const dateFields =
    dataset?.dimensions.filter(
      (d) =>
        d.data_type === "date" ||
        d.data_type === "datetime" ||
        d.category === "time" ||
        d.id.includes("date") ||
        d.id === "month"
    ) ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
        Date Analysis (Optional)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Date Field</label>
          <select
            value={config.dateField ?? ""}
            onChange={(e) => onChange({ dateField: e.target.value || null })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="">Select a date field (optional)</option>
            {dateFields.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {config.dateField && (
          <>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 block mb-1">Compare By</label>
              <select
                value={config.compareBy}
                onChange={(e) =>
                  onChange({ compareBy: e.target.value as ComparisonDateConfig["compareBy"] })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="date">Date</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 block mb-1">Date Range</label>
              <select
                value={config.dateRange}
                onChange={(e) => onChange({ dateRange: e.target.value as DateRangePreset })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {DATE_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={config.comparePeriods}
                  onChange={(e) => onChange({ comparePeriods: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Compare Periods
              </label>
            </div>
            {config.dateRange === "custom" && (
              <>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">From</label>
                  <input
                    type="date"
                    value={config.customFrom ?? ""}
                    onChange={(e) => onChange({ customFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">To</label>
                  <input
                    type="date"
                    value={config.customTo ?? ""}
                    onChange={(e) => onChange({ customTo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
      {!config.dateField && (
        <p className="text-[10px] text-gray-400 mt-2">
          Leave empty to compare by store and month only — existing behavior is unchanged.
        </p>
      )}
    </div>
  );
}
