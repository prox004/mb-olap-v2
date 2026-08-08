"use client";

import React, { useMemo } from "react";
import { PreviewResponse } from "@/types/reporting";

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (Math.abs(value) >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (Math.abs(value) >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return String(value);
}

export function PivotPreviewTable({
  preview,
  loading,
}: {
  preview: PreviewResponse | null;
  loading: boolean;
}) {
  const grandTotals = useMemo(() => {
    if (!preview?.data?.length) return null;
    const totals: Record<string, number> = {};
    preview.columns.forEach((col) => {
      const sum = preview.data.reduce((acc, row) => {
        const v = row[col];
        return typeof v === "number" ? acc + v : acc;
      }, 0);
      if (sum !== 0) totals[col] = sum;
    });
    return totals;
  }, [preview]);

  if (loading && !preview) {
    return (
      <div className="p-6 space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 dark:from-brand-950 dark:to-violet-950 flex items-center justify-center mb-5">
          <svg className="w-9 h-9 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Build your report</h3>
        <p className="text-xs text-gray-500 mt-1.5 max-w-[240px] leading-relaxed">
          Drag fields from the left panel into Rows, Columns, or Values on the right.
        </p>
      </div>
    );
  }

  if (preview.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center p-8">
        <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-4 text-amber-500 text-xl">
          ∅
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No matching records</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-[260px]">
          Check your filters — empty filter values will exclude all rows.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse min-w-max">
          <thead>
            <tr className="bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
              {preview.columns.map((col, i) => (
                <th
                  key={col}
                  className={`px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap text-[11px] uppercase tracking-wide ${
                    i === 0 ? "sticky left-0 z-20 bg-white dark:bg-gray-900" : ""
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-100 dark:border-gray-800/80 transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-950/10 ${
                  idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-900/50"
                }`}
              >
                {preview.columns.map((col, i) => (
                  <td
                    key={col}
                    className={`px-4 py-2.5 whitespace-nowrap ${
                      i === 0
                        ? "font-medium text-gray-800 dark:text-gray-200 sticky left-0 z-10 bg-inherit"
                        : "tabular-nums text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
            {grandTotals && Object.keys(grandTotals).length > 0 && (
              <tr className="bg-gray-100 dark:bg-gray-800 font-semibold border-t-2 border-gray-300 dark:border-gray-600">
                {preview.columns.map((col, i) => (
                  <td
                    key={col}
                    className={`px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-200 ${
                      i === 0 ? "sticky left-0 bg-gray-100 dark:bg-gray-800" : "tabular-nums"
                    }`}
                  >
                    {i === 0 ? "Grand Total" : grandTotals[col] !== undefined ? formatCell(grandTotals[col]) : ""}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-[10px] text-gray-500 flex justify-between shrink-0">
        <span>{preview.total_count.toLocaleString()} total rows</span>
        <span>Page {preview.page} · {preview.page_size} per page</span>
      </div>
    </div>
  );
}
