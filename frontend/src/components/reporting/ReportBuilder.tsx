"use client";

import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PivotFieldExplorer } from "./PivotFieldExplorer";
import { PivotZonesPanel } from "./PivotZonesPanel";
import { PivotPreviewTable } from "./PivotPreviewTable";
import { useReportBuilder } from "@/hooks/useReportBuilder";
import { ExportCsvButton } from "@/components/common/ExportCsvButton";

function ToolbarButton({
  children,
  onClick,
  disabled,
  variant = "ghost",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "ghost" | "primary" | "outline";
  title?: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    ghost: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
    outline: "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800",
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

export const ReportBuilder: React.FC = () => {
  const {
    datasets,
    activeDataset,
    report,
    preview,
    savedReports,
    loading,
    datasetsLoading,
    error,
    canUndo,
    canRedo,
    updateReport,
    addToZone,
    removeFromZone,
    reorderZone,
    updateValueField,
    setDataset,
    runPreview,
    saveReport,
    exportCsv,
    loadSavedReport,
    undo,
    redo,
    resetReport,
  } = useReportBuilder();

  const fieldCount =
    report.rows.length +
    report.columns.length +
    report.value_fields.length +
    report.filters.length;

  const emptyFilters = report.filters.filter((f) => !f.value && f.operator !== "is_empty" && f.operator !== "is_not_empty");
  const isPivotWithCols = Boolean(
    report.columns.length > 0 &&
    report.visualization !== "table" &&
    preview?.data?.length
  );

  const { csvColumns, csvRows } = React.useMemo(() => {
    if (!preview?.data?.length || !preview?.columns?.length) {
      return { csvColumns: [], csvRows: [] };
    }

    if (!isPivotWithCols) {
      return {
        csvColumns: preview.columns.map((col) => ({ key: col, header: col })),
        csvRows: preview.data,
      };
    }

    const rowDimLabels = report.rows.map((id) => activeDataset?.dimensions.find((d) => d.id === id)?.label || id);
    const colDimLabels = report.columns.map((id) => activeDataset?.dimensions.find((d) => d.id === id)?.label || id);

    const actualRowCols = rowDimLabels.map((lbl) => {
      const exact = preview.columns.find((c) => c === lbl);
      return exact || preview.columns.find((c) => c.toLowerCase() === lbl.toLowerCase()) || lbl;
    });

    const actualColCols = colDimLabels.map((lbl) => {
      const exact = preview.columns.find((c) => c === lbl);
      return exact || preview.columns.find((c) => c.toLowerCase() === lbl.toLowerCase()) || lbl;
    });

    const dimSet = new Set([...actualRowCols, ...actualColCols]);
    const valueCols = preview.columns.filter((c) => !dimSet.has(c));

    const colHeadersSet = new Set<string>();
    const rowKeysSet = new Set<string>();
    const rowValuesMap: Record<string, Record<string, unknown>> = {};
    const matrix: Record<string, Record<string, Record<string, unknown>>> = {};

    for (const record of preview.data) {
      const colKey = actualColCols.map((c) => String(record[c] ?? "—")).join(" / ");
      colHeadersSet.add(colKey);

      const rKey = actualRowCols.length > 0
        ? actualRowCols.map((c) => String(record[c] ?? "—")).join(" \u0000 ")
        : "__total__";

      if (!rowKeysSet.has(rKey)) {
        rowKeysSet.add(rKey);
        const rObj: Record<string, unknown> = {};
        actualRowCols.forEach((c) => {
          rObj[c] = record[c];
        });
        rowValuesMap[rKey] = rObj;
      }

      if (!matrix[rKey]) matrix[rKey] = {};
      if (!matrix[rKey][colKey]) matrix[rKey][colKey] = {};

      for (const vCol of valueCols) {
        matrix[rKey][colKey][vCol] = record[vCol];
      }
    }

    const uniqueColHeaders = Array.from(colHeadersSet);
    const cols: { key: string; header: string }[] = actualRowCols.map((c) => ({ key: c, header: c }));

    for (const cKey of uniqueColHeaders) {
      for (const vCol of valueCols) {
        const key = `${cKey} - ${vCol}`;
        cols.push({ key, header: valueCols.length > 1 ? `${cKey} (${vCol})` : cKey });
      }
    }

    const rows: Record<string, unknown>[] = [];
    for (const rKey of Array.from(rowKeysSet)) {
      const rowItem: Record<string, unknown> = { ...(rowValuesMap[rKey] || {}) };
      for (const cKey of uniqueColHeaders) {
        for (const vCol of valueCols) {
          const key = `${cKey} - ${vCol}`;
          rowItem[key] = matrix[rKey]?.[cKey]?.[vCol] ?? "";
        }
      }
      rows.push(rowItem);
    }

    return { csvColumns: cols, csvRows: rows };
  }, [preview, isPivotWithCols, report.rows, report.columns, activeDataset]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-[calc(100vh-7rem)] min-h-[640px] -mx-2 sm:-mx-0">
        {/* Compact header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              P
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={report.name}
                onChange={(e) => updateReport({ name: e.target.value })}
                className="text-base font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none w-full min-w-[160px] placeholder:text-gray-400"
                placeholder="Untitled Report"
              />
              <p className="text-[11px] text-gray-500 truncate">
                {activeDataset?.label ?? "Select dataset"} · {fieldCount} fields active
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={report.dataset_id}
              onChange={(e) => setDataset(e.target.value)}
              disabled={datasetsLoading}
              className="h-8 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>{ds.label}</option>
              ))}
            </select>
            {savedReports.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => { if (e.target.value) loadSavedReport(e.target.value); }}
                className="h-8 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="">Open report...</option>
                {savedReports.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <ToolbarButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">↶</ToolbarButton>
            <ToolbarButton onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">↷</ToolbarButton>
            <ToolbarButton onClick={() => runPreview()} disabled={loading || fieldCount === 0} variant="primary">
              {loading ? "Running…" : "Run"}
            </ToolbarButton>
            <ToolbarButton onClick={() => saveReport()} disabled={loading} variant="outline">Save</ToolbarButton>
            {preview && csvColumns.length > 0 && (
              <ExportCsvButton columns={csvColumns} rows={csvRows} filenameParts={["Report", report.name]} />
            )}
            <ToolbarButton onClick={resetReport} variant="ghost">Reset</ToolbarButton>
          </div>
        </div>

        {(error || emptyFilters.length > 0) && (
          <div className="mb-3 space-y-2 px-1">
            {error && (
              <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}
            {emptyFilters.length > 0 && (
              <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300 text-xs">
                {emptyFilters.length} filter{emptyFilters.length > 1 ? "s have" : " has"} no value — results may be empty. Set a value or remove the filter.
              </div>
            )}
          </div>
        )}

        {/* 3-panel layout */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[260px_1fr_280px] gap-3 min-h-0 px-1">
          {/* Left: Field explorer */}
          <aside className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[280px] xl:min-h-0 shadow-sm">
            <PivotFieldExplorer
              dataset={activeDataset}
              report={report}
              onAddToZone={addToZone}
            />
          </aside>

          {/* Center: Preview */}
          <main className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[400px] shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Preview</span>
                {preview && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {preview.record_count} rows
                  </span>
                )}
                {loading && (
                  <span className="w-3 h-3 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                )}
              </div>
              <select
                value={report.visualization}
                onChange={(e) => updateReport({ visualization: e.target.value as typeof report.visualization })}
                className="h-7 px-2 text-[11px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="pivot">Pivot Table</option>
                <option value="table">Table</option>
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>
            <div className="flex-1 overflow-hidden bg-[#fafbfc] dark:bg-gray-950/30">
              <PivotPreviewTable
                preview={preview}
                loading={loading}
                report={report}
                dataset={activeDataset}
              />
            </div>
          </main>

          {/* Right: Pivot zones */}
          <aside className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[320px] xl:min-h-0 shadow-sm">
            <PivotZonesPanel
              dataset={activeDataset}
              report={report}
              onAddToZone={addToZone}
              onRemoveFromZone={removeFromZone}
              onReorderZone={reorderZone}
              onUpdateValueField={updateValueField}
              onUpdateFilter={(index, patch) => {
                const filters = [...report.filters];
                filters[index] = { ...filters[index], ...patch };
                updateReport({ filters });
              }}
            />
          </aside>
        </div>
      </div>
    </DndProvider>
  );
};
