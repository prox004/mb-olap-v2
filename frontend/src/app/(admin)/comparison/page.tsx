"use client";

import React, { useMemo, useState } from "react";
import { useOlapFilter } from "@/context/OlapFilterContext";
import { useComparisonData } from "@/hooks/useComparisonData";
import { useDimensionComparison } from "@/hooks/useDimensionComparison";
import { ComparisonSelectors } from "@/components/comparison/ComparisonSelectors";
import { ComparisonKpiGrid } from "@/components/comparison/ComparisonKpiGrid";
import { ComparisonChartSection } from "@/components/comparison/ComparisonChartSection";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { ComparisonTableConfigPanel } from "@/components/comparison/ComparisonTableConfigPanel";
import { ComparisonDatePanel } from "@/components/comparison/ComparisonDatePanel";
import { ComparisonExportBar } from "@/components/comparison/ComparisonExportBar";
import {
  DEFAULT_COMPARISON_DATE_CONFIG,
  DEFAULT_COMPARISON_TABLE_CONFIG,
} from "@/types/comparison";
import { formatSelectionLabel } from "@/utils/comparisonUtils";

const DIVISIONS = ["All", "MENS", "LADIES", "KIDS", "NON-APPAREL"];
const DEPARTMENTS = [
  "All",
  "MENS SHIRTS",
  "MENS DENIMS",
  "LADIES TOPS",
  "KIDS WEAR",
];

export default function ComparisonPage() {
  const { availableStores, availableMonths } = useOlapFilter();
  const [tableConfig, setTableConfig] = useState(DEFAULT_COMPARISON_TABLE_CONFIG);
  const [dateConfig, setDateConfig] = useState(DEFAULT_COMPARISON_DATE_CONFIG);
  const {
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
  } = useComparisonData(availableStores);

  const mergedTableConfig = useMemo(
    () => ({
      ...tableConfig,
      dateField: dateConfig.dateField,
      compareBy: dateConfig.compareBy,
      dateRange: dateConfig.dateRange,
      customFrom: dateConfig.customFrom,
      customTo: dateConfig.customTo,
      comparePeriods: dateConfig.comparePeriods,
    }),
    [tableConfig, dateConfig]
  );

  const storeIds = useMemo(
    () => (report ? [report.left.storeId, report.right.storeId] : undefined),
    [report]
  );
  const {
    dataset,
    rows: dimensionRows,
    loading: dimensionLoading,
  } = useDimensionComparison(mergedTableConfig, storeIds);

  const leftLabel = report
    ? formatSelectionLabel(report.left.storeName, report.left.month, report.left.date)
    : "Left";
  const rightLabel = report
    ? formatSelectionLabel(report.right.storeName, report.right.month, report.right.date)
    : "Right";

  return (
    <div className="space-y-5 print:space-y-4" id="comparison-report">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Store-Month Comparison
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Compare any two store-month combinations using existing OLAP KPIs and charts
          </p>
        </div>
        {report && <ComparisonExportBar report={report} />}
      </div>

      <ComparisonSelectors
        left={left}
        right={right}
        stores={availableStores}
        months={availableMonths}
        onLeftChange={setLeft}
        onRightChange={setRight}
        onCompare={compare}
        loading={loading}
      />

      <ComparisonDatePanel
        config={dateConfig}
        onChange={(patch) => setDateConfig((prev) => ({ ...prev, ...patch }))}
      />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Optional Filters (applied to both sides)
        </p>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.division}
            onChange={(e) => setFilters({ ...filters, division: e.target.value })}
            className="px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                Division: {d}
              </option>
            ))}
          </select>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                Department: {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(validationError || error) && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium">
          {validationError || error}
        </div>
      )}

      {!report && !loading && !error && !validationError && (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-500">
            Select two different store-month combinations and click Compare to generate the report.
          </p>
        </div>
      )}

      {loading && (
        <ComparisonKpiGrid
          leftKpis={{
            total_revenue: 0,
            total_sales_units: 0,
            total_gross_profit: 0,
            gross_margin_pct: 0,
            total_inventory_value: 0,
            total_inventory_units: 0,
            sell_through_pct: 0,
            average_woc: 0,
          }}
          rightKpis={{
            total_revenue: 0,
            total_sales_units: 0,
            total_gross_profit: 0,
            gross_margin_pct: 0,
            total_inventory_value: 0,
            total_inventory_units: 0,
            sell_through_pct: 0,
            average_woc: 0,
          }}
          leftLabel="Left"
          rightLabel="Right"
          loading
        />
      )}

      {report && !loading && (
        <div className="space-y-6">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
            Generated {new Date(report.generatedAt).toLocaleString()} ·{" "}
            <span className="text-blue-600 font-semibold">{leftLabel}</span> vs{" "}
            <span className="text-rose-600 font-semibold">{rightLabel}</span>
          </div>

          <ComparisonKpiGrid
            leftKpis={report.left.kpis}
            rightKpis={report.right.kpis}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />

          <ComparisonChartSection left={report.left} right={report.right} />

          {dateConfig.dateField && (
            <>
              <ComparisonTableConfigPanel
                config={tableConfig}
                dataset={dataset}
                onChange={(patch) => setTableConfig((prev) => ({ ...prev, ...patch }))}
              />

              <ComparisonTable
                leftKpis={report.left.kpis}
                rightKpis={report.right.kpis}
                leftLabel={leftLabel}
                rightLabel={rightLabel}
                tableConfig={mergedTableConfig}
                dimensionRows={dimensionRows}
                dimensionLoading={dimensionLoading}
              />
            </>
          )}

          {!dateConfig.dateField && (
            <ComparisonTable
              leftKpis={report.left.kpis}
              rightKpis={report.right.kpis}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
            />
          )}
        </div>
      )}
    </div>
  );
}
