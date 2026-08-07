"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PreviewResponse } from "@/types/reporting";

const DynamicReportRenderer = dynamic(
  () =>
    import("@/components/chat/DynamicReportRenderer").then((m) => ({
      default: m.DynamicReportRenderer,
    })),
  { ssr: false }
);

interface ReportPreviewProps {
  preview: PreviewResponse | null;
  loading: boolean;
  visualization: string;
  onPageChange: (page: number) => void;
  onExport: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  preview,
  loading,
  visualization,
  onPageChange,
  onExport,
}) => {
  const [showSql, setShowSql] = useState(false);
  const [tab, setTab] = useState<"data" | "chart">("data");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-500">
        <span className="animate-pulse">Running query...</span>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-sm text-gray-400">
        <p>Configure your report and click Run to preview results</p>
      </div>
    );
  }

  const totalPages = Math.ceil(preview.total_count / preview.page_size);
  const vizType =
    visualization === "bar"
      ? "BAR_CHART"
      : visualization === "pie"
        ? "PIE_CHART"
        : visualization === "kpi"
          ? "KPI_CARD"
          : "DATA_TABLE";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("data")}
            className={`px-3 py-1 text-xs rounded-lg font-medium ${
              tab === "data"
                ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-500"
            }`}
          >
            Data ({preview.total_count.toLocaleString()})
          </button>
          {visualization !== "table" && (
            <button
              type="button"
              onClick={() => setTab("chart")}
              className={`px-3 py-1 text-xs rounded-lg font-medium ${
                tab === "chart"
                  ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-500"
              }`}
            >
              Chart
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className={`px-3 py-1 text-xs rounded-lg font-medium ${
              showSql ? "bg-white dark:bg-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            SQL
          </button>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Export CSV
        </button>
      </div>

      {showSql && (
        <pre className="m-3 p-3 text-[11px] rounded-lg bg-gray-900 text-green-400 overflow-x-auto max-h-32">
          {preview.sql}
        </pre>
      )}

      <div className="flex-1 overflow-auto p-3">
        {tab === "chart" && visualization !== "table" ? (
          <DynamicReportRenderer
            visualizationType={vizType}
            columns={preview.columns}
            data={preview.data}
          />
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold sticky top-0">
                  <tr>
                    {preview.columns.map((col) => (
                      <th key={col} className="px-3 py-2 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {preview.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {preview.columns.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap">
                          {typeof row[col] === "number"
                            ? (row[col] as number).toLocaleString()
                            : String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && tab === "data" && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500">
            Page {preview.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={preview.page <= 1}
              onClick={() => onPageChange(preview.page - 1)}
              className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={preview.page >= totalPages}
              onClick={() => onPageChange(preview.page + 1)}
              className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
