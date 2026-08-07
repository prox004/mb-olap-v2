"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import {
  DatasetMeta,
  DEFAULT_REPORT,
  FieldValueOption,
  PreviewResponse,
  ReportDefinition,
  SavedReport,
  SavedReportSummary,
} from "@/types/reporting";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

function isReportOverride(value: unknown): value is Partial<ReportDefinition> {
  if (!value || typeof value !== "object") return false;
  // Ignore React synthetic events accidentally passed as overrides
  if ("nativeEvent" in value || "preventDefault" in value) return false;
  return true;
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

  const activeDataset = datasets.find((d) => d.id === report.dataset_id);

  const loadDatasets = useCallback(async () => {
    setDatasetsLoading(true);
    try {
      const res = await apiClient<ApiResponse<DatasetMeta[]>>("/reporting/datasets");
      if (res.success && res.data) {
        setDatasets(res.data);
        if (res.data.length > 0 && !res.data.find((d) => d.id === report.dataset_id)) {
          setReport((prev) => ({ ...prev, dataset_id: res.data![0].id, rows: [], measures: [] }));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load datasets");
    } finally {
      setDatasetsLoading(false);
    }
  }, [report.dataset_id]);

  const loadSavedReports = useCallback(async () => {
    try {
      const res = await apiClient<ApiResponse<SavedReportSummary[]>>("/reporting/reports");
      if (res.success && res.data) setSavedReports(res.data);
    } catch {
      /* non-critical */
    }
  }, []);

  const loadSavedReport = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<ApiResponse<SavedReport>>(`/reporting/reports/${id}`);
      if (res.success && res.data) {
        setReport(res.data.definition);
        setSavedReportId(res.data.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
    loadSavedReports();
  }, [loadDatasets, loadSavedReports]);

  useEffect(() => {
    if (initialReportId) loadSavedReport(initialReportId);
  }, [initialReportId, loadSavedReport]);

  const runPreview = useCallback(async (overrides?: Partial<ReportDefinition>) => {
    const safeOverrides = isReportOverride(overrides) ? overrides : undefined;
    const reportToRun = { ...report, ...safeOverrides };
    if (reportToRun.rows.length === 0 && reportToRun.measures.length === 0) {
      setError("Add at least one dimension or measure");
      return;
    }
    if (safeOverrides) {
      setReport((prev) => ({ ...prev, ...safeOverrides }));
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<ApiResponse<PreviewResponse>>("/reporting/preview", {
        method: "POST",
        body: JSON.stringify({ report: reportToRun }),
      });
      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        setError(res.message || "Preview failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [report]);

  const saveReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = savedReportId
        ? `/reporting/reports/${savedReportId}`
        : "/reporting/reports";
      const res = await apiClient<ApiResponse<SavedReport>>(endpoint, {
        method: savedReportId ? "PUT" : "POST",
        body: JSON.stringify(report),
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
  }, [report, savedReportId, loadSavedReports]);

  const exportCsv = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    const response = await fetch(`${baseUrl}/reporting/export/csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${report.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [report]);

  const searchFieldValues = useCallback(
    async (fieldId: string, search: string): Promise<FieldValueOption[]> => {
      const res = await apiClient<ApiResponse<FieldValueOption[]>>(
        `/reporting/datasets/${report.dataset_id}/fields/${fieldId}/values`,
        { params: { search, limit: 30 } }
      );
      return res.success && res.data ? res.data : [];
    },
    [report.dataset_id]
  );

  const updateReport = useCallback((patch: Partial<ReportDefinition>) => {
    setReport((prev) => ({ ...prev, ...patch }));
    setPreview(null);
  }, []);

  const addRow = useCallback((fieldId: string) => {
    setReport((prev) => {
      if (prev.rows.includes(fieldId)) return prev;
      return { ...prev, rows: [...prev.rows, fieldId] };
    });
    setPreview(null);
  }, []);

  const removeRow = useCallback((fieldId: string) => {
    setReport((prev) => ({
      ...prev,
      rows: prev.rows.filter((r) => r !== fieldId),
      filters: prev.filters.filter((f) => f.field_id !== fieldId),
    }));
    setPreview(null);
  }, []);

  const addMeasure = useCallback((fieldId: string) => {
    setReport((prev) => {
      if (prev.measures.includes(fieldId)) return prev;
      return { ...prev, measures: [...prev.measures, fieldId] };
    });
    setPreview(null);
  }, []);

  const removeMeasure = useCallback((fieldId: string) => {
    setReport((prev) => ({
      ...prev,
      measures: prev.measures.filter((m) => m !== fieldId),
    }));
    setPreview(null);
  }, []);

  const setDataset = useCallback((datasetId: string) => {
    setReport({ ...DEFAULT_REPORT, dataset_id: datasetId, name: report.name });
    setPreview(null);
    setSavedReportId(null);
  }, [report.name]);

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
    updateReport,
    addRow,
    removeRow,
    addMeasure,
    removeMeasure,
    setDataset,
    runPreview,
    saveReport,
    exportCsv,
    searchFieldValues,
    loadSavedReport,
    loadSavedReports,
  };
}
