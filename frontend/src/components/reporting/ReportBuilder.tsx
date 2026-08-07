"use client";

import React from "react";
import { FieldExplorer } from "./FieldExplorer";
import { ReportCanvas } from "./ReportCanvas";
import { ReportPreview } from "./ReportPreview";
import { useReportBuilder } from "@/hooks/useReportBuilder";

const STEPS = [
  { id: 1, label: "Pick Fields", icon: "📊" },
  { id: 2, label: "Configure", icon: "⚙️" },
  { id: 3, label: "Preview", icon: "👁️" },
];

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
    updateReport,
    addRow,
    removeRow,
    addMeasure,
    removeMeasure,
    setDataset,
    runPreview,
    saveReport,
    exportCsv,
    loadSavedReport,
  } = useReportBuilder();

  const handlePageChange = (page: number) => {
    runPreview({ page });
  };

  const fieldCount = report.rows.length + report.measures.length;
  const currentStep = fieldCount === 0 ? 1 : preview ? 3 : 2;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[600px]">
      {/* Hero header */}
      <div className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-violet-600 p-5 text-white shadow-lg shadow-brand-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Report Builder</h1>
            <p className="text-xs text-white/80 mt-0.5">
              Drag fields, drop into zones, and preview live analytics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentStep >= step.id
                    ? "bg-white/20 backdrop-blur-sm ring-1 ring-white/30"
                    : "bg-white/5 text-white/50"
                }`}
              >
                <span>{step.icon}</span>
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={report.dataset_id}
            onChange={(e) => setDataset(e.target.value)}
            disabled={datasetsLoading}
            className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium"
          >
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.label}
              </option>
            ))}
          </select>
          {savedReports.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) loadSavedReport(e.target.value);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">Open saved report...</option>
              {savedReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
            {fieldCount} fields selected
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => runPreview()}
            disabled={loading || fieldCount === 0}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 shadow-md shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running...
              </span>
            ) : (
              "▶ Run Report"
            )}
          </button>
          <button
            type="button"
            onClick={() => saveReport()}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0">
        <div className="xl:col-span-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[280px] xl:min-h-0 shadow-xs hover:shadow-md transition-shadow">
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Data Fields
            </span>
            {activeDataset && (
              <p className="text-[10px] text-gray-400 truncate">{activeDataset.description}</p>
            )}
          </div>
          <FieldExplorer
            dataset={activeDataset}
            onAddRow={addRow}
            onAddMeasure={addMeasure}
            selectedRows={report.rows}
            selectedMeasures={report.measures}
          />
        </div>

        <div className="xl:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto min-h-[280px] shadow-xs hover:shadow-md transition-shadow">
          <ReportCanvas
            dataset={activeDataset}
            report={report}
            onUpdate={updateReport}
            onAddRow={addRow}
            onAddMeasure={addMeasure}
            onRemoveRow={removeRow}
            onRemoveMeasure={removeMeasure}
          />
        </div>

        <div className="xl:col-span-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[320px] shadow-xs hover:shadow-md transition-shadow ring-1 ring-brand-500/5">
          <ReportPreview
            preview={preview}
            loading={loading}
            visualization={report.visualization}
            onPageChange={handlePageChange}
            onExport={exportCsv}
          />
        </div>
      </div>
    </div>
  );
};
