"use client";

import React, { useState } from "react";
import {
  DatasetMeta,
  FilterClause,
  FILTER_OPERATORS,
  ReportDefinition,
  VIZ_OPTIONS,
  VizType,
} from "@/types/reporting";
import { readFieldDragData } from "./FieldExplorer";

interface ReportCanvasProps {
  dataset: DatasetMeta | undefined;
  report: ReportDefinition;
  onUpdate: (patch: Partial<ReportDefinition>) => void;
  onAddRow: (fieldId: string) => void;
  onAddMeasure: (fieldId: string) => void;
  onRemoveRow: (fieldId: string) => void;
  onRemoveMeasure: (fieldId: string) => void;
}

const FieldChip: React.FC<{
  label: string;
  onRemove: () => void;
  color: "brand" | "emerald";
}> = ({ label, onRemove, color }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
      color === "brand"
        ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
    }`}
  >
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="hover:opacity-70 text-sm leading-none"
      aria-label={`Remove ${label}`}
    >
      ×
    </button>
  </span>
);

const DropZone: React.FC<{
  label: string;
  isActive: boolean;
  borderClass: string;
  emptyText: string;
  children: React.ReactNode;
  onDropField: (kind: "dimension" | "measure", fieldId: string) => void;
  acceptKind: "dimension" | "measure";
}> = ({ label, isActive, borderClass, emptyText, children, onDropField, acceptKind }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const payload = readFieldDragData(e);
    if (payload && payload.kind === acceptKind) {
      onDropField(payload.kind, payload.fieldId);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`rounded-xl border border-dashed p-3 min-h-[72px] transition-colors ${borderClass} ${
        dragOver ? "bg-brand-50/80 dark:bg-brand-950/20 ring-2 ring-brand-400/50" : ""
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <span className="text-xs text-gray-400 italic">{emptyText}</span>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export const ReportCanvas: React.FC<ReportCanvasProps> = ({
  dataset,
  report,
  onUpdate,
  onAddRow,
  onAddMeasure,
  onRemoveRow,
  onRemoveMeasure,
}) => {
  const getDimLabel = (id: string) =>
    dataset?.dimensions.find((d) => d.id === id)?.label ?? id;
  const getMsrLabel = (id: string) =>
    dataset?.measures.find((m) => m.id === id)?.label ?? id;

  const addFilter = () => {
    const firstDim = dataset?.dimensions[0]?.id ?? "division";
    onUpdate({
      filters: [
        ...report.filters,
        { field_id: firstDim, operator: "eq", value: "" },
      ],
    });
  };

  const updateFilter = (index: number, patch: Partial<FilterClause>) => {
    const filters = report.filters.map((f, i) =>
      i === index ? { ...f, ...patch } : f
    );
    onUpdate({ filters });
  };

  const removeFilter = (index: number) => {
    onUpdate({ filters: report.filters.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
            Report Name
          </label>
          <input
            type="text"
            value={report.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
            Visualization
          </label>
          <select
            value={report.visualization}
            onChange={(e) => onUpdate({ visualization: e.target.value as VizType })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            {VIZ_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DropZone
        label="Rows (Dimensions)"
        isActive={report.rows.length > 0}
        borderClass="border-gray-300 dark:border-gray-700"
        emptyText="Drag or click a dimension from the left panel"
        acceptKind="dimension"
        onDropField={(_, fieldId) => onAddRow(fieldId)}
      >
        {report.rows.map((id) => (
          <FieldChip
            key={id}
            label={getDimLabel(id)}
            color="brand"
            onRemove={() => onRemoveRow(id)}
          />
        ))}
      </DropZone>

      <DropZone
        label="Values (Measures)"
        isActive={report.measures.length > 0}
        borderClass="border-emerald-300 dark:border-emerald-800"
        emptyText="Drag or click a measure from the left panel"
        acceptKind="measure"
        onDropField={(_, fieldId) => onAddMeasure(fieldId)}
      >
        {report.measures.map((id) => (
          <FieldChip
            key={id}
            label={getMsrLabel(id)}
            color="emerald"
            onRemove={() => onRemoveMeasure(id)}
          />
        ))}
      </DropZone>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Filters
          </p>
          <button
            type="button"
            onClick={addFilter}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            + Add Filter
          </button>
        </div>
        {report.filters.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No filters applied</p>
        ) : (
          <div className="space-y-2">
            {report.filters.map((flt, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-center">
                <select
                  value={flt.field_id}
                  onChange={(e) => updateFilter(idx, { field_id: e.target.value })}
                  className="px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  {dataset?.dimensions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <select
                  value={flt.operator}
                  onChange={(e) =>
                    updateFilter(idx, {
                      operator: e.target.value as FilterClause["operator"],
                    })
                  }
                  className="px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={String(flt.value ?? "")}
                  onChange={(e) => updateFilter(idx, { value: e.target.value })}
                  placeholder="Value"
                  className="flex-1 min-w-[120px] px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
                <button
                  type="button"
                  onClick={() => removeFilter(idx)}
                  className="text-gray-400 hover:text-rose-500 text-sm px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
