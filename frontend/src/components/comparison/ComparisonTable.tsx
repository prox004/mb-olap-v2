"use client";

import React, { useMemo, useState } from "react";
import { ExecutiveKPIs } from "@/hooks/useExecutiveData";
import { getKpiKeys, KPI_METADATA } from "@/config/kpiMetadata";
import {
  computeComparison,
  directionColorClass,
  directionIcon,
  formatComparisonValue,
} from "@/utils/comparisonUtils";
import { ExportCsvButton } from "@/components/common/ExportCsvButton";
import { ComparisonTableConfig } from "@/types/comparison";
import { DimensionComparisonRow } from "@/hooks/useDimensionComparison";

interface ComparisonTableProps {
  leftKpis: ExecutiveKPIs;
  rightKpis: ExecutiveKPIs;
  leftLabel: string;
  rightLabel: string;
  tableConfig?: ComparisonTableConfig | null;
  dimensionRows?: DimensionComparisonRow[];
  dimensionLoading?: boolean;
}

type SortKey = "metric" | "left" | "right" | "difference" | "percentChange" | "status";

function KpiComparisonTable({
  leftKpis,
  rightKpis,
  leftLabel,
  rightLabel,
}: {
  leftKpis: ExecutiveKPIs;
  rightKpis: ExecutiveKPIs;
  leftLabel: string;
  rightLabel: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("metric");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    return getKpiKeys().map((key) => {
      const meta = KPI_METADATA[key];
      const result = computeComparison(leftKpis[key], rightKpis[key]);
      return {
        key,
        metric: meta.label,
        left: result.left,
        right: result.right,
        difference: result.difference,
        percentChange: result.percentChange,
        direction: result.direction,
        format: meta.format,
      };
    });
  }, [leftKpis, rightKpis]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === "status") {
        const av = a.direction;
        const bv = b.direction;
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (sortKey === "metric") {
        return sortDir === "asc"
          ? a.metric.localeCompare(b.metric)
          : b.metric.localeCompare(a.metric);
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const csvRows = sorted.map((r) => ({
    metric: r.metric,
    left: formatComparisonValue(r.left, r.format),
    right: formatComparisonValue(r.right, r.format),
    difference: formatComparisonValue(r.difference, r.format),
    percent_change:
      r.percentChange === null ? "N/A" : `${r.percentChange.toFixed(2)}%`,
    status: r.direction,
  }));

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">KPI Comparison Table</h3>
          <p className="text-xs text-gray-500">Sortable metrics with delta analysis</p>
        </div>
        <ExportCsvButton
          columns={[
            { key: "metric", header: "Metric" },
            { key: "left", header: leftLabel },
            { key: "right", header: rightLabel },
            { key: "difference", header: "Difference" },
            { key: "percent_change", header: "% Change" },
            { key: "status", header: "Status" },
          ]}
          rows={csvRows}
          filenameParts={["Comparison_Report", leftLabel, rightLabel]}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
            <tr>
              {[
                ["metric", "Metric"],
                ["left", leftLabel],
                ["right", rightLabel],
                ["difference", "Difference"],
                ["percentChange", "% Change"],
                ["status", "Status"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-brand-600"
                  onClick={() => toggleSort(key as SortKey)}
                >
                  {label} {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((row) => (
              <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.metric}</td>
                <td className="px-4 py-3">{formatComparisonValue(row.left, row.format)}</td>
                <td className="px-4 py-3">{formatComparisonValue(row.right, row.format)}</td>
                <td className={`px-4 py-3 font-semibold ${directionColorClass(row.direction)}`}>
                  {directionIcon(row.direction)} {formatComparisonValue(row.difference, row.format)}
                </td>
                <td className={`px-4 py-3 font-semibold ${directionColorClass(row.direction)}`}>
                  {row.percentChange === null
                    ? "N/A"
                    : `${row.percentChange >= 0 ? "+" : ""}${row.percentChange.toFixed(2)}%`}
                </td>
                <td className="px-4 py-3 capitalize">{row.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DateComparisonTable({
  rows,
  loading,
  comparePeriods,
}: {
  rows: DimensionComparisonRow[];
  loading?: boolean;
  comparePeriods: boolean;
}) {
  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">Loading date comparison...</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">No records match your filters.</div>
    );
  }

  return (
    <>
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Date-Based Comparison</h3>
        <p className="text-xs text-gray-500">
          Dimension breakdown by {comparePeriods ? "period with change analysis" : "time period"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Dimension</th>
              <th className="px-4 py-3 font-semibold">Current</th>
              {comparePeriods && (
                <>
                  <th className="px-4 py-3 font-semibold">Previous</th>
                  <th className="px-4 py-3 font-semibold">Difference</th>
                  <th className="px-4 py-3 font-semibold">% Change</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, idx) => (
              <tr key={`${row.period}-${row.dimensionValue}-${idx}`}>
                <td className="px-4 py-3">{row.period}</td>
                <td className="px-4 py-3 font-medium">{row.dimensionValue}</td>
                <td className="px-4 py-3 tabular-nums">{row.current.toLocaleString("en-IN")}</td>
                {comparePeriods && (
                  <>
                    <td className="px-4 py-3 tabular-nums">
                      {row.previous !== null ? row.previous.toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.difference !== null ? row.difference.toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.percentChange !== null
                        ? `${row.percentChange >= 0 ? "+" : ""}${row.percentChange.toFixed(2)}%`
                        : "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ComparisonTable({
  leftKpis,
  rightKpis,
  leftLabel,
  rightLabel,
  tableConfig,
  dimensionRows = [],
  dimensionLoading = false,
}: ComparisonTableProps) {
  const showDateView = Boolean(
    tableConfig?.dateField && tableConfig?.dimension && tableConfig?.metric
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden space-y-0">
      <KpiComparisonTable
        leftKpis={leftKpis}
        rightKpis={rightKpis}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
      />

      {tableConfig?.dateField && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          {showDateView ? (
            <DateComparisonTable
              rows={dimensionRows}
              loading={dimensionLoading}
              comparePeriods={tableConfig?.comparePeriods ?? false}
            />
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">
              Select a dimension and metric to enable date-based comparison.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
