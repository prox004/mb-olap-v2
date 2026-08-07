"use client";

import React, { useState } from "react";
import { CsvColumn, exportToCsv } from "@/utils/csvExport";

interface ExportCsvButtonProps<T extends Record<string, unknown>> {
  columns: CsvColumn<T>[];
  rows: T[];
  filenameParts: (string | undefined)[];
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ExportCsvButton<T extends Record<string, unknown>>({
  columns,
  rows,
  filenameParts,
  label = "Export CSV",
  disabled = false,
  className = "",
}: ExportCsvButtonProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!rows.length) return;
    setExporting(true);
    try {
      exportToCsv(columns, rows, filenameParts);
    } finally {
      setTimeout(() => setExporting(false), 400);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || exporting || rows.length === 0}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
      </svg>
      {exporting ? "Exporting..." : label}
    </button>
  );
}
