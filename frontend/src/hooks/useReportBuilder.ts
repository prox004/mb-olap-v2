"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import {
  AggregationType,
  createValueField,
  DatasetMeta,
  DEFAULT_REPORT,
  FieldValueOption,
  normalizeReport,
  PreviewResponse,
  ReportDefinition,
  SavedReport,
  SavedReportSummary,
  ValueFieldConfig,
} from "@/types/reporting";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const HISTORY_LIMIT = 50;

function isReportOverride(value: unknown): value is Partial<ReportDefinition> {
  if (!value || typeof value !== "object") return false;
  if ("nativeEvent" in value || "preventDefault" in value) return false;
  return true;
}

function cloneReport(report: ReportDefinition): ReportDefinition {
  return JSON.parse(JSON.stringify(report));
}

export function useReportBuilder(initialReportId?: string | null) {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [report, setReport] = useState<ReportDefinition>({ ...DEFAULT_REPORT });
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(initialReportId ?? null);
  const [history, setHistory] = useState<ReportDefinition[]>([]);
  const [future, setFuture] = useState<ReportDefinition[]>([]);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportRef = useRef(report);
  reportRef.current = report;

  const activeDataset = datasets.find((d) => d.id === report.dataset_id);

  const pushHistory = useCallback((prev: ReportDefinition) => {
    setHistory((h) => [...h.slice(-HISTORY_LIMIT + 1), cloneReport(prev)]);
    setFuture([]);
  }, []);

  const setReportWithHistory = useCallback(
    (updater: ReportDefinition | ((prev: ReportDefinition) => ReportDefinition)) => {
      setReport((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          pushHistory(prev);
        }
        return normalizeReport(next);
      });
      setPreview(null);
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [cloneReport(reportRef.current), ...f]);
      setReport(normalizeReport(prev));
      setPreview(null);
      return h.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      pushHistory(reportRef.current);
      setReport(normalizeReport(next));
      setPreview(null);
      return f.slice(1);
    });
  }, [pushHistory]);

  const loadDatasets = useCallback(async () => {
    setDatasetsLoading(true);
    try {
      const res = await apiClient<ApiResponse<DatasetMeta[]>>("/reporting/datasets");
      if (res.success && res.data) {
        setDatasets(res.data);
        if (res.data.length > 0 && !res.data.find((d) => d.id === report.dataset_id)) {
          setReportWithHistory((prev) => ({
            ...prev,
            dataset_id: res.data![0].id,
            rows: [],
            columns: [],
            measures: [],
            value_fields: [],
          }));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load datasets");
    } finally {
      setDatasetsLoading(false);
    }
  }, [report.dataset_id, setReportWithHistory]);

  const loadSavedReports = useCallback(async () => {
    try {
      const res = await apiClient<ApiResponse<SavedReportSummary[]>>("/reporting/reports");
      if (res.success && res.data) setSavedReports(res.data);
    } catch {
      /* non-critical */
    }
  }, []);

  const loadSavedReport = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient<ApiResponse<SavedReport>>(`/reporting/reports/${id}`);
        if (res.success && res.data) {
          setReportWithHistory(normalizeReport(res.data.definition));
          setSavedReportId(res.data.id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    },
    [setReportWithHistory]
  );

  useEffect(() => {
    loadDatasets();
    loadSavedReports();
  }, [loadDatasets, loadSavedReports]);

  useEffect(() => {
    if (initialReportId) loadSavedReport(initialReportId);
  }, [initialReportId, loadSavedReport]);

  const runPreview = useCallback(
    async (overrides?: Partial<ReportDefinition>, silent = false) => {
      const safeOverrides = isReportOverride(overrides) ? overrides : undefined;
      const reportToRun = normalizeReport({ ...reportRef.current, ...safeOverrides });
      if (
        reportToRun.rows.length === 0 &&
        reportToRun.columns.length === 0 &&
        reportToRun.value_fields.length === 0
      ) {
        if (!silent) setError("Add at least one row, column, or value field");
        return;
      }
      if (safeOverrides) {
        setReportWithHistory((prev) => ({ ...prev, ...safeOverrides }));
      }
      if (!silent) setLoading(true);
      setError(null);
      try {
        const payload = {
          ...reportToRun,
          measures: reportToRun.value_fields.map((v) => v.field_id),
        };
        const res = await apiClient<ApiResponse<PreviewResponse>>("/reporting/preview", {
          method: "POST",
          body: JSON.stringify({ report: payload }),
        });
        if (res.success && res.data) {
          setPreview(res.data);
        } else if (!silent) {
          setError(res.message || "Preview failed");
        }
      } catch (e) {
        if (!silent) {
          setError(e instanceof Error ? e.message : "Preview failed");
          setPreview(null);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [setReportWithHistory]
  );

  useEffect(() => {
    const hasConfig =
      report.rows.length > 0 || report.columns.length > 0 || report.value_fields.length > 0;
    if (!hasConfig) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      runPreview(undefined, true);
    }, 700);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [report.rows, report.columns, report.value_fields, report.filters, report.dataset_id, runPreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveReport();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const saveReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = normalizeReport({
        ...reportRef.current,
        measures: reportRef.current.value_fields.map((v) => v.field_id),
      });
      const endpoint = savedReportId
        ? `/reporting/reports/${savedReportId}`
        : "/reporting/reports";
      const res = await apiClient<ApiResponse<SavedReport>>(endpoint, {
        method: savedReportId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        setSavedReportId(res.data.id);
        await loadSavedReports();
        return res.data;
      }
      setError(res.message || "Save failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
    return null;
  }, [savedReportId, loadSavedReports]);

  const exportCsv = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    const payload = normalizeReport({
      ...reportRef.current,
      measures: reportRef.current.value_fields.map((v) => v.field_id),
    });
    const response = await fetch(`${baseUrl}/reporting/export/csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report: payload }),
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${reportRef.current.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  const searchFieldValues = useCallback(
    async (fieldId: string, search: string): Promise<FieldValueOption[]> => {
      const res = await apiClient<ApiResponse<FieldValueOption[]>>(
        `/reporting/datasets/${reportRef.current.dataset_id}/fields/${fieldId}/values`,
        { params: { search, limit: 30 } }
      );
      return res.success && res.data ? res.data : [];
    },
    []
  );

  const updateReport = useCallback(
    (patch: Partial<ReportDefinition>) => {
      setReportWithHistory((prev) => ({ ...prev, ...patch }));
    },
    [setReportWithHistory]
  );

  const addToZone = useCallback(
    (zone: "rows" | "columns" | "filters" | "values", fieldId: string, kind: "dimension" | "measure") => {
      setReportWithHistory((prev) => {
        const next = { ...prev };
        if (zone === "rows" && kind === "dimension" && !next.rows.includes(fieldId)) {
          next.rows = [...next.rows, fieldId];
        }
        if (zone === "columns" && kind === "dimension" && !next.columns.includes(fieldId)) {
          next.columns = [...next.columns, fieldId];
        }
        if (zone === "values" && kind === "measure") {
          if (!next.value_fields.some((v) => v.field_id === fieldId && v.aggregation === "sum")) {
            next.value_fields = [...next.value_fields, createValueField(fieldId, "sum")];
          }
        }
        if (zone === "filters" && kind === "dimension") {
          next.filters = [
            ...next.filters,
            { field_id: fieldId, operator: "eq", value: "" },
          ];
        }
        return next;
      });
    },
    [setReportWithHistory]
  );

  const removeFromZone = useCallback(
    (zone: "rows" | "columns" | "values" | "filters", id: string, index?: number) => {
      setReportWithHistory((prev) => {
        const next = { ...prev };
        if (zone === "rows") next.rows = next.rows.filter((r) => r !== id);
        if (zone === "columns") next.columns = next.columns.filter((c) => c !== id);
        if (zone === "values") next.value_fields = next.value_fields.filter((v) => v.id !== id);
        if (zone === "filters" && index !== undefined) {
          next.filters = next.filters.filter((_, i) => i !== index);
        }
        return next;
      });
    },
    [setReportWithHistory]
  );

  const reorderZone = useCallback(
    (zone: "rows" | "columns", fromIndex: number, toIndex: number) => {
      setReportWithHistory((prev) => {
        const list = zone === "rows" ? [...prev.rows] : [...prev.columns];
        const [item] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, item);
        return zone === "rows" ? { ...prev, rows: list } : { ...prev, columns: list };
      });
    },
    [setReportWithHistory]
  );

  const updateValueField = useCallback(
    (id: string, patch: Partial<ValueFieldConfig>) => {
      setReportWithHistory((prev) => ({
        ...prev,
        value_fields: prev.value_fields.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      }));
    },
    [setReportWithHistory]
  );

  const setDataset = useCallback(
    (datasetId: string) => {
      setReportWithHistory({ ...DEFAULT_REPORT, dataset_id: datasetId, name: reportRef.current.name });
      setSavedReportId(null);
    },
    [setReportWithHistory]
  );

  const resetReport = useCallback(() => {
    setReportWithHistory({ ...DEFAULT_REPORT, name: reportRef.current.name, dataset_id: reportRef.current.dataset_id });
    setPreview(null);
    setSavedReportId(null);
  }, [setReportWithHistory]);

  return {
    datasets,
    activeDataset,
    report,
    preview,
    savedReports,
    loading,
    datasetsLoading,
    error,
    savedReportId,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    updateReport,
    addToZone,
    removeFromZone,
    reorderZone,
    updateValueField,
    setDataset,
    runPreview,
    saveReport,
    exportCsv,
    searchFieldValues,
    loadSavedReport,
    loadSavedReports,
    undo,
    redo,
    resetReport,
  };
}
