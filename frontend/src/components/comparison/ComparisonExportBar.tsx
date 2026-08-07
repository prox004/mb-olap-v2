"use client";

import React from "react";
import { ComparisonReport } from "@/types/comparison";
import { exportToCsv } from "@/utils/csvExport";
import { getKpiKeys, KPI_METADATA } from "@/config/kpiMetadata";
import { computeComparison, formatComparisonValue } from "@/utils/comparisonUtils";

export function ComparisonExportBar({ report }: { report: ComparisonReport }) {
  const leftLabel = `${report.left.storeName}_${report.left.month}`;
  const rightLabel = `${report.right.storeName}_${report.right.month}`;

  const exportKpiCsv = () => {
    const rows = getKpiKeys().map((key) => {
      const meta = KPI_METADATA[key];
      const result = computeComparison(report.left.kpis[key], report.right.kpis[key]);
      return {
        metric: meta.label,
        left: formatComparisonValue(result.left, meta.format),
        right: formatComparisonValue(result.right, meta.format),
        difference: formatComparisonValue(result.difference, meta.format),
        percent_change:
          result.percentChange === null ? "N/A" : `${result.percentChange.toFixed(2)}%`,
        winner: result.winner,
      };
    });

    exportToCsv(
      [
        { key: "metric", header: "Metric" },
        { key: "left", header: `Left (${leftLabel})` },
        { key: "right", header: `Right (${rightLabel})` },
        { key: "difference", header: "Difference" },
        { key: "percent_change", header: "% Change" },
        { key: "winner", header: "Winner" },
      ],
      rows,
      ["Comparison_KPIs", leftLabel, rightLabel]
    );
  };

  const exportExcel = () => exportKpiCsv();

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={exportKpiCsv}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={exportExcel}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Export Excel
      </button>
      <button
        type="button"
        onClick={exportPdf}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Export PDF
      </button>
    </div>
  );
}
