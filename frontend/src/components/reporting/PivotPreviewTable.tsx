"use client";

import React, { useMemo } from "react";
import { DatasetMeta, PreviewResponse, ReportDefinition } from "@/types/reporting";

function formatCell(value: unknown, label?: string): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (isNaN(value)) return "—";
    const lbl = (label || "").toLowerCase();
    if (lbl.includes("%") || lbl.includes("percent") || lbl.includes("margin %") || lbl.includes("rate")) {
      return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
    }
    if (
      lbl.includes("qty") ||
      lbl.includes("quantity") ||
      lbl.includes("count") ||
      lbl.includes("units") ||
      lbl.includes("bills") ||
      lbl.includes("transactions")
    ) {
      return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }
    if (Math.abs(value) >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (Math.abs(value) >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }
  return String(value);
}

function cleanMeasureName(label: string): string {
  return label.replace(/\s*\((SUM|AVG|COUNT|MIN|MAX|COUNT_DISTINCT)\)/i, "").trim();
}

interface PivotPreviewTableProps {
  preview: PreviewResponse | null;
  loading: boolean;
  report?: ReportDefinition;
  dataset?: DatasetMeta;
}

export function PivotPreviewTable({
  preview,
  loading,
  report,
  dataset,
}: PivotPreviewTableProps) {
  // Check if we should render 2D Pivot mode
  const isPivotMode = Boolean(
    report &&
    report.columns &&
    report.columns.length > 0 &&
    report.visualization !== "table"
  );

  // Match dimension labels from dataset
  const rowDimLabels = useMemo(() => {
    if (!report?.rows?.length) return [];
    return report.rows.map((id) => {
      const dim = dataset?.dimensions.find((d) => d.id === id);
      return dim?.label || id;
    });
  }, [report?.rows, dataset]);

  const colDimLabels = useMemo(() => {
    if (!report?.columns?.length) return [];
    return report.columns.map((id) => {
      const dim = dataset?.dimensions.find((d) => d.id === id);
      return dim?.label || id;
    });
  }, [report?.columns, dataset]);

  // Find corresponding column headers in preview.columns
  const actualRowCols = useMemo(() => {
    if (!preview?.columns) return [];
    return rowDimLabels.map((lbl) => {
      const exact = preview.columns.find((c) => c === lbl);
      if (exact) return exact;
      return preview.columns.find((c) => c.toLowerCase() === lbl.toLowerCase()) || lbl;
    });
  }, [preview?.columns, rowDimLabels]);

  const actualColCols = useMemo(() => {
    if (!preview?.columns) return [];
    return colDimLabels.map((lbl) => {
      const exact = preview.columns.find((c) => c === lbl);
      if (exact) return exact;
      return preview.columns.find((c) => c.toLowerCase() === lbl.toLowerCase()) || lbl;
    });
  }, [preview?.columns, colDimLabels]);

  // Metric value columns
  const valueCols = useMemo(() => {
    if (!preview?.columns) return [];
    const dimSet = new Set([...actualRowCols, ...actualColCols]);
    const filtered = preview.columns.filter((c) => !dimSet.has(c));
    return filtered.length > 0 ? filtered : preview.columns.slice(actualRowCols.length + actualColCols.length);
  }, [preview?.columns, actualRowCols, actualColCols]);

  // Compute 2D Pivot Matrix
  const pivotData = useMemo(() => {
    if (!isPivotMode || !preview?.data?.length || actualColCols.length === 0) return null;

    const colHeadersSet = new Set<string>();
    const rowKeysSet = new Set<string>();
    const rowValuesMap: Record<string, any[]> = {};
    const matrix: Record<string, Record<string, Record<string, any>>> = {};

    for (const record of preview.data) {
      const colKey = actualColCols.map((c) => String(record[c] ?? "—")).join(" / ");
      colHeadersSet.add(colKey);

      const rKey = actualRowCols.length > 0
        ? actualRowCols.map((c) => String(record[c] ?? "—")).join(" \u0000 ")
        : "__total__";

      if (!rowKeysSet.has(rKey)) {
        rowKeysSet.add(rKey);
        rowValuesMap[rKey] = actualRowCols.length > 0
          ? actualRowCols.map((c) => record[c] ?? "—")
          : ["Total"];
      }

      if (!matrix[rKey]) matrix[rKey] = {};
      if (!matrix[rKey][colKey]) matrix[rKey][colKey] = {};

      for (const vCol of valueCols) {
        matrix[rKey][colKey][vCol] = record[vCol];
      }
    }

    const uniqueColHeaders = Array.from(colHeadersSet);
    const uniqueRowKeys = Array.from(rowKeysSet);

    // Calculate Row Totals
    const rowTotals: Record<string, Record<string, number>> = {};
    for (const rKey of uniqueRowKeys) {
      rowTotals[rKey] = {};
      for (const vCol of valueCols) {
        let sum = 0;
        let hasVal = false;
        for (const cKey of uniqueColHeaders) {
          const val = matrix[rKey]?.[cKey]?.[vCol];
          if (typeof val === "number") {
            sum += val;
            hasVal = true;
          }
        }
        if (hasVal) rowTotals[rKey][vCol] = sum;
      }
    }

    // Calculate Column Totals
    const colTotals: Record<string, Record<string, number>> = {};
    for (const cKey of uniqueColHeaders) {
      colTotals[cKey] = {};
      for (const vCol of valueCols) {
        let sum = 0;
        let hasVal = false;
        for (const rKey of uniqueRowKeys) {
          const val = matrix[rKey]?.[cKey]?.[vCol];
          if (typeof val === "number") {
            sum += val;
            hasVal = true;
          }
        }
        if (hasVal) colTotals[cKey][vCol] = sum;
      }
    }

    // Calculate Grand Total across all
    const grandTotals: Record<string, number> = {};
    for (const vCol of valueCols) {
      let sum = 0;
      let hasVal = false;
      for (const rKey of uniqueRowKeys) {
        for (const cKey of uniqueColHeaders) {
          const val = matrix[rKey]?.[cKey]?.[vCol];
          if (typeof val === "number") {
            sum += val;
            hasVal = true;
          }
        }
      }
      if (hasVal) grandTotals[vCol] = sum;
    }

    return {
      uniqueColHeaders,
      uniqueRowKeys,
      rowValuesMap,
      matrix,
      rowTotals,
      colTotals,
      grandTotals,
    };
  }, [isPivotMode, preview?.data, actualRowCols, actualColCols, valueCols]);

  // 1D flat grand totals for standard view
  const flatGrandTotals = useMemo(() => {
    if (isPivotMode || !preview?.data?.length) return null;
    const totals: Record<string, number> = {};
    preview.columns.forEach((col) => {
      const sum = preview.data.reduce((acc, row) => {
        const v = row[col];
        return typeof v === "number" ? acc + v : acc;
      }, 0);
      if (sum !== 0) totals[col] = sum;
    });
    return totals;
  }, [isPivotMode, preview]);

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

  // 2D PIVOT MATRIX VIEW
  if (isPivotMode && pivotData) {
    const {
      uniqueColHeaders,
      uniqueRowKeys,
      rowValuesMap,
      matrix,
      rowTotals,
      colTotals,
      grandTotals,
    } = pivotData;

    const rowHeaderColCount = actualRowCols.length || 1;
    const showSubheaders = valueCols.length > 1;

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse min-w-max">
            <thead>
              {/* Primary Header Row */}
              <tr className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-xs">
                {/* Row Dimension Headers (Sticky Left) */}
                {actualRowCols.length > 0 ? (
                  actualRowCols.map((colName, i) => (
                    <th
                      key={colName}
                      rowSpan={showSubheaders ? 2 : 1}
                      className={`px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap text-[11px] uppercase tracking-wide border-r border-gray-200 dark:border-gray-700 ${
                        i === 0 ? "sticky left-0 z-30 bg-white dark:bg-gray-900 shadow-r" : ""
                      }`}
                    >
                      {colName}
                    </th>
                  ))
                ) : (
                  <th
                    rowSpan={showSubheaders ? 2 : 1}
                    className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap text-[11px] uppercase tracking-wide border-r border-gray-200 dark:border-gray-700 sticky left-0 z-30 bg-white dark:bg-gray-900"
                  >
                    Summary
                  </th>
                )}

                {/* Column Dimension Headers (across the top) */}
                {uniqueColHeaders.map((colHeader) => (
                  <th
                    key={colHeader}
                    colSpan={valueCols.length}
                    className="px-4 py-2.5 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap text-xs text-center border-r border-gray-200 dark:border-gray-700 bg-violet-50/50 dark:bg-violet-950/20"
                  >
                    <span className="inline-block px-2 py-0.5 rounded bg-white/80 dark:bg-gray-800/80 border border-violet-200/60 dark:border-violet-800/50 text-violet-900 dark:text-violet-200 font-bold">
                      {colHeader}
                    </span>
                  </th>
                ))}

                {/* Total Column Header */}
                <th
                  colSpan={valueCols.length}
                  className="px-4 py-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap text-xs text-center bg-gray-100/90 dark:bg-gray-800 border-l-2 border-gray-300 dark:border-gray-600"
                >
                  Grand Total
                </th>
              </tr>

              {/* Sub-Header Row for Measures (if multiple measures) */}
              {showSubheaders && (
                <tr className="bg-gray-50/90 dark:bg-gray-850 border-b-2 border-gray-200 dark:border-gray-700 sticky top-[38px] z-10 shadow-xs">
                  {uniqueColHeaders.map((colHeader) =>
                    valueCols.map((vCol, vIdx) => (
                      <th
                        key={`${colHeader}-${vCol}`}
                        className={`px-3 py-2 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-[10px] uppercase text-right ${
                          vIdx === valueCols.length - 1
                            ? "border-r border-gray-200 dark:border-gray-700"
                            : "border-r border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        {cleanMeasureName(vCol)}
                      </th>
                    ))
                  )}

                  {/* Grand Total Measure Subheaders */}
                  {valueCols.map((vCol, vIdx) => (
                    <th
                      key={`total-${vCol}`}
                      className={`px-3 py-2 font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap text-[10px] uppercase text-right bg-gray-100/90 dark:bg-gray-800 ${
                        vIdx === 0 ? "border-l-2 border-gray-300 dark:border-gray-600" : ""
                      } ${vIdx < valueCols.length - 1 ? "border-r border-gray-200 dark:border-gray-700" : ""}`}
                    >
                      {cleanMeasureName(vCol)}
                    </th>
                  ))}
                </tr>
              )}
            </thead>

            <tbody>
              {uniqueRowKeys.map((rKey, rIdx) => {
                const rowVals = rowValuesMap[rKey] || [];
                return (
                  <tr
                    key={rKey}
                    className={`border-b border-gray-100 dark:border-gray-800/80 transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-950/10 ${
                      rIdx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/40 dark:bg-gray-900/50"
                    }`}
                  >
                    {/* Row Dimension Values (Sticky Left) */}
                    {rowVals.map((val, i) => (
                      <td
                        key={i}
                        className={`px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap border-r border-gray-100 dark:border-gray-800 ${
                          i === 0 ? "sticky left-0 z-10 bg-inherit shadow-r" : ""
                        }`}
                      >
                        {formatCell(val)}
                      </td>
                    ))}

                    {/* Pivoted Data Cells */}
                    {uniqueColHeaders.map((cKey) =>
                      valueCols.map((vCol, vIdx) => {
                        const cellVal = matrix[rKey]?.[cKey]?.[vCol];
                        return (
                          <td
                            key={`${cKey}-${vCol}`}
                            className={`px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-gray-700 dark:text-gray-300 ${
                              vIdx === valueCols.length - 1
                                ? "border-r border-gray-200/80 dark:border-gray-700/80"
                                : "border-r border-gray-100 dark:border-gray-800/60"
                            }`}
                          >
                            {formatCell(cellVal, vCol)}
                          </td>
                        );
                      })
                    )}

                    {/* Row Total Across Columns */}
                    {valueCols.map((vCol, vIdx) => (
                      <td
                        key={`row-total-${vCol}`}
                        className={`px-3 py-2.5 text-right whitespace-nowrap tabular-nums font-semibold text-gray-900 dark:text-gray-100 bg-gray-50/80 dark:bg-gray-800/50 ${
                          vIdx === 0 ? "border-l-2 border-gray-300 dark:border-gray-600" : ""
                        } ${vIdx < valueCols.length - 1 ? "border-r border-gray-200 dark:border-gray-700" : ""}`}
                      >
                        {formatCell(rowTotals[rKey]?.[vCol], vCol)}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Grand Total Footer Row */}
              <tr className="bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600 sticky bottom-0 z-10 shadow-t">
                <td
                  colSpan={rowHeaderColCount}
                  className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 uppercase tracking-wide text-[11px]"
                >
                  Grand Total
                </td>

                {/* Column Totals */}
                {uniqueColHeaders.map((cKey) =>
                  valueCols.map((vCol, vIdx) => (
                    <td
                      key={`total-${cKey}-${vCol}`}
                      className={`px-3 py-3 text-right whitespace-nowrap tabular-nums text-gray-900 dark:text-gray-100 ${
                        vIdx === valueCols.length - 1
                          ? "border-r border-gray-300 dark:border-gray-600"
                          : "border-r border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {formatCell(colTotals[cKey]?.[vCol], vCol)}
                    </td>
                  ))
                )}

                {/* Bottom-Right Grand Total Corner */}
                {valueCols.map((vCol, vIdx) => (
                  <td
                    key={`corner-total-${vCol}`}
                    className={`px-3 py-3 text-right whitespace-nowrap tabular-nums font-extrabold text-brand-600 dark:text-brand-400 bg-gray-200/70 dark:bg-gray-700/70 ${
                      vIdx === 0 ? "border-l-2 border-gray-300 dark:border-gray-600" : ""
                    } ${vIdx < valueCols.length - 1 ? "border-r border-gray-300 dark:border-gray-600" : ""}`}
                  >
                    {formatCell(grandTotals[vCol], vCol)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Statistics */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-[10px] text-gray-500 flex justify-between shrink-0">
          <span>
            {uniqueRowKeys.length} {uniqueRowKeys.length === 1 ? "row" : "rows"} × {uniqueColHeaders.length}{" "}
            {uniqueColHeaders.length === 1 ? "column group" : "column groups"} (
            {preview.total_count.toLocaleString()} data records aggregated)
          </span>
          <span className="font-medium text-brand-600 dark:text-brand-400">
            2D Pivot Matrix View
          </span>
        </div>
      </div>
    );
  }

  // STANDARD 1D TABULAR VIEW (when no columns or in table visualization mode)
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
                    {formatCell(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
            {flatGrandTotals && Object.keys(flatGrandTotals).length > 0 && (
              <tr className="bg-gray-100 dark:bg-gray-800 font-semibold border-t-2 border-gray-300 dark:border-gray-600 sticky bottom-0">
                {preview.columns.map((col, i) => (
                  <td
                    key={col}
                    className={`px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-200 ${
                      i === 0 ? "sticky left-0 bg-gray-100 dark:bg-gray-800" : "tabular-nums"
                    }`}
                  >
                    {i === 0 ? "Grand Total" : flatGrandTotals[col] !== undefined ? formatCell(flatGrandTotals[col], col) : ""}
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
