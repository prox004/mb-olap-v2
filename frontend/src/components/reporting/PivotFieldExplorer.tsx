"use client";

import React, { useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import { DatasetMeta, fieldTypeIcon, PivotZone, ReportDefinition } from "@/types/reporting";

const ITEM_TYPE = "PIVOT_FIELD";

interface DragItem {
  fieldId: string;
  kind: "dimension" | "measure";
}

const CATEGORY_LABELS: Record<string, string> = {
  location: "Location",
  product: "Product",
  time: "Time",
  other: "Other",
};

function FieldItem({
  fieldId,
  label,
  dataType,
  kind,
  used,
  onAdd,
}: {
  fieldId: string;
  label: string;
  dataType: string;
  kind: "dimension" | "measure";
  used?: boolean;
  onAdd: (zone: PivotZone) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { fieldId, kind } as DragItem,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
        isDragging
          ? "opacity-30 scale-[0.98]"
          : used
            ? "opacity-50 bg-gray-50 dark:bg-gray-800/50"
            : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
      }`}
    >
      <span className="text-gray-300 dark:text-gray-600 text-[10px] select-none">⠿</span>
      <span
        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
          kind === "measure"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        }`}
      >
        {fieldTypeIcon(dataType)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{label}</p>
      </div>
      {!used && (
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          {kind === "dimension" ? (
            <>
              <button type="button" onClick={() => onAdd("rows")} className="w-5 h-5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400" title="Add to Rows">R</button>
              <button type="button" onClick={() => onAdd("columns")} className="w-5 h-5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-400" title="Add to Columns">C</button>
              <button type="button" onClick={() => onAdd("filters")} className="w-5 h-5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-400" title="Add to Filters">F</button>
            </>
          ) : (
            <button type="button" onClick={() => onAdd("values")} className="w-5 h-5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400" title="Add to Values">Σ</button>
          )}
        </div>
      )}
    </div>
  );
}

interface PivotFieldExplorerProps {
  dataset: DatasetMeta | undefined;
  report: ReportDefinition;
  onAddToZone: (zone: PivotZone, fieldId: string, kind: "dimension" | "measure") => void;
}

export function PivotFieldExplorer({ dataset, report, onAddToZone }: PivotFieldExplorerProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "dimensions" | "measures">("all");

  const usedDims = useMemo(
    () => new Set([...report.rows, ...report.columns, ...report.filters.map((f) => f.field_id)]),
    [report]
  );
  const usedMeasures = useMemo(() => new Set(report.value_fields.map((v) => v.field_id)), [report]);

  const groupedDimensions = useMemo(() => {
    if (!dataset) return [];
    const q = search.toLowerCase();
    const filtered = dataset.dimensions.filter(
      (d) => !q || d.label.toLowerCase().includes(q) || d.id.includes(q)
    );
    const groups = new Map<string, typeof filtered>();
    filtered.forEach((d) => {
      const cat = d.category || "other";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(d);
    });
    return Array.from(groups.entries());
  }, [dataset, search]);

  const measures = useMemo(() => {
    if (!dataset) return [];
    const q = search.toLowerCase();
    return dataset.measures.filter(
      (m) => !q || m.label.toLowerCase().includes(q) || m.id.includes(q)
    );
  }, [dataset, search]);

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-sm text-gray-500">Select a dataset to begin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">Fields</h3>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⌕</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex gap-1 mt-2">
          {(["all", "dimensions", "measures"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-1 text-[10px] font-medium rounded-md capitalize transition-colors ${
                tab === t
                  ? "bg-brand-500 text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {(tab === "all" || tab === "dimensions") &&
          groupedDimensions.map(([cat, dims]) => (
            <div key={cat} className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 mb-1">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              {dims.map((dim) => (
                <FieldItem
                  key={dim.id}
                  fieldId={dim.id}
                  label={dim.label}
                  dataType={dim.data_type}
                  kind="dimension"
                  used={usedDims.has(dim.id)}
                  onAdd={(zone) => onAddToZone(zone, dim.id, "dimension")}
                />
              ))}
            </div>
          ))}

        {(tab === "all" || tab === "measures") && measures.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 mb-1">
              Metrics
            </p>
            {measures.map((msr) => (
              <FieldItem
                key={msr.id}
                fieldId={msr.id}
                label={msr.label}
                dataType={msr.format || "number"}
                kind="measure"
                used={usedMeasures.has(msr.id)}
                onAdd={(zone) => onAddToZone(zone, msr.id, "measure")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
