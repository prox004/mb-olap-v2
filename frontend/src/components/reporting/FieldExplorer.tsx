"use client";

import React, { useMemo, useState } from "react";
import { DatasetMeta } from "@/types/reporting";

export const FIELD_DRAG_TYPE = "application/x-mb-report-field";

export function setFieldDragData(
  event: React.DragEvent,
  kind: "dimension" | "measure",
  fieldId: string
) {
  event.dataTransfer.setData(FIELD_DRAG_TYPE, JSON.stringify({ kind, fieldId }));
  event.dataTransfer.effectAllowed = "copy";
}

export function readFieldDragData(
  event: React.DragEvent
): { kind: "dimension" | "measure"; fieldId: string } | null {
  const raw = event.dataTransfer.getData(FIELD_DRAG_TYPE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { kind: "dimension" | "measure"; fieldId: string };
    if (parsed.kind && parsed.fieldId) return parsed;
  } catch {
    return null;
  }
  return null;
}

interface FieldExplorerProps {
  dataset: DatasetMeta | undefined;
  onAddRow: (fieldId: string) => void;
  onAddMeasure: (fieldId: string) => void;
  selectedRows: string[];
  selectedMeasures: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  location: "Location",
  time: "Time",
  product: "Product",
  vendor: "Vendor",
};

export const FieldExplorer: React.FC<FieldExplorerProps> = ({
  dataset,
  onAddRow,
  onAddMeasure,
  selectedRows,
  selectedMeasures,
}) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    if (!dataset) return ["all"];
    const cats = new Set<string>(["all"]);
    dataset.dimensions.forEach((d) => cats.add(d.category || "product"));
    return Array.from(cats);
  }, [dataset]);

  const filtered = useMemo(() => {
    if (!dataset) return { dimensions: [], measures: [] };
    const q = search.toLowerCase();
    const dimensions = dataset.dimensions.filter((d) => {
      const matchSearch = !q || d.label.toLowerCase().includes(q) || d.id.includes(q);
      const matchCat = activeCategory === "all" || d.category === activeCategory;
      return matchSearch && matchCat && !d.id.includes("hidden");
    });
    const measures = dataset.measures.filter(
      (m) => !q || m.label.toLowerCase().includes(q) || m.id.includes(q)
    );
    return { dimensions, measures };
  }, [dataset, search, activeCategory]);

  if (!dataset) {
    return (
      <div className="p-4 text-sm text-gray-500">Select a dataset to explore fields.</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
        <input
          type="text"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
        />
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                activeCategory === cat
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Dimensions ({filtered.dimensions.length})
          </h3>
          <div className="space-y-1">
            {filtered.dimensions.map((dim) => {
              const isSelected = selectedRows.includes(dim.id);
              return (
                <button
                  key={dim.id}
                  type="button"
                  draggable={!isSelected}
                  disabled={isSelected}
                  onDragStart={(e) => setFieldDragData(e, "dimension", dim.id)}
                  onClick={() => onAddRow(dim.id)}
                  className={`group w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-950/30 text-brand-600 cursor-default ring-1 ring-brand-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-grab active:cursor-grabbing hover:translate-x-0.5"
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {!isSelected && (
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      </svg>
                    )}
                    {dim.label}
                  </span>
                  {dim.high_cardinality && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 shrink-0">
                      search
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Measures ({filtered.measures.length})
          </h3>
          <div className="space-y-1">
            {filtered.measures.map((msr) => {
              const isSelected = selectedMeasures.includes(msr.id);
              return (
                <button
                  key={msr.id}
                  type="button"
                  draggable={!isSelected}
                  disabled={isSelected}
                  onDragStart={(e) => setFieldDragData(e, "measure", msr.id)}
                  onClick={() => onAddMeasure(msr.id)}
                  className={`group w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 cursor-default ring-1 ring-emerald-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-grab active:cursor-grabbing hover:translate-x-0.5"
                  }`}
                >
                  <span className="truncate block">{msr.label}</span>
                  {msr.description && (
                    <span className="text-[10px] text-gray-400 truncate block">{msr.description}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
