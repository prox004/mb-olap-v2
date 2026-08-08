"use client";

import React from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  DatasetMeta,
  FilterClause,
  PivotZone,
  ReportDefinition,
  ValueFieldConfig,
} from "@/types/reporting";
import { ValueFieldSettings } from "./ValueFieldSettings";

const ITEM_TYPE = "PIVOT_FIELD";

interface DragItem {
  fieldId: string;
  kind: "dimension" | "measure";
  zone?: PivotZone;
  index?: number;
}

const ZONE_META: Record<PivotZone, { label: string; icon: string; color: string; empty: string }> = {
  filters: {
    label: "Filters",
    icon: "⊘",
    color: "border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/20",
    empty: "Drag fields to filter data",
  },
  columns: {
    label: "Columns",
    icon: "▥",
    color: "border-l-violet-400 bg-violet-50/40 dark:bg-violet-950/20",
    empty: "Drag fields for column headers",
  },
  rows: {
    label: "Rows",
    icon: "▤",
    color: "border-l-blue-400 bg-blue-50/40 dark:bg-blue-950/20",
    empty: "Drag fields for row labels",
  },
  values: {
    label: "Values",
    icon: "Σ",
    color: "border-l-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20",
    empty: "Drag metrics to aggregate",
  },
};

function ZoneDropArea({
  zone,
  children,
  onDropItem,
  count,
}: {
  zone: PivotZone;
  children: React.ReactNode;
  onDropItem: (item: DragItem) => void;
  count: number;
}) {
  const meta = ZONE_META[zone];
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => onDropItem({ ...item, zone }),
    canDrop: (item) => {
      if (zone === "values") return item.kind === "measure";
      return item.kind === "dimension";
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`rounded-lg border border-gray-100 dark:border-gray-800 border-l-[3px] p-2.5 min-h-[72px] transition-all ${meta.color} ${
        isOver && canDrop ? "ring-2 ring-brand-400/60 ring-offset-1" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">{meta.icon}</span>
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{meta.label}</span>
        </div>
        {count > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-gray-900/80 text-gray-500 font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {count === 0 ? (
          <p className="text-[10px] text-gray-400 italic py-1">{meta.empty}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ZoneChip({
  label,
  onRemove,
  item,
  index,
  zone,
  onMove,
}: {
  label: string;
  onRemove: () => void;
  item: DragItem;
  index: number;
  zone: "rows" | "columns";
  onMove: (from: number, to: number) => void;
}) {
  const [, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { ...item, zone, index },
  }));

  const [, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    hover: (dragged: DragItem) => {
      if (dragged.zone === zone && dragged.index !== undefined && dragged.index !== index) {
        onMove(dragged.index, index);
        dragged.index = index;
      }
    },
  }));

  return (
    <div
      ref={(node) => { drag(drop(node)); }}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700 shadow-xs text-xs cursor-grab group"
    >
      <span className="text-gray-300 text-[10px]">⠿</span>
      <span className="flex-1 font-medium truncate text-gray-800 dark:text-gray-200">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all text-[10px]"
      >
        ✕
      </button>
    </div>
  );
}

function FilterRow({
  label,
  filter,
  index,
  onUpdate,
  onRemove,
}: {
  label: string;
  filter: FilterClause;
  index: number;
  onUpdate: (patch: Partial<FilterClause>) => void;
  onRemove: () => void;
}) {
  const hasValue = filter.value || filter.operator === "is_empty" || filter.operator === "is_not_empty";
  return (
    <div className={`rounded-md bg-white dark:bg-gray-900 border p-2 space-y-1.5 ${hasValue ? "border-gray-200 dark:border-gray-700" : "border-amber-300 dark:border-amber-800"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate">{label}</span>
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-rose-500 text-[10px]">✕</button>
      </div>
      <div className="flex gap-1">
        <select
          value={filter.operator}
          onChange={(e) => onUpdate({ operator: e.target.value as FilterClause["operator"] })}
          className="w-20 px-1.5 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <option value="eq">equals</option>
          <option value="contains">contains</option>
          <option value="neq">not eq</option>
          <option value="gt">&gt;</option>
          <option value="lt">&lt;</option>
          <option value="is_empty">is empty</option>
          <option value="is_not_empty">not empty</option>
        </select>
        {filter.operator !== "is_empty" && filter.operator !== "is_not_empty" && (
          <input
            value={String(filter.value ?? "")}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Enter value..."
            className="flex-1 min-w-0 px-2 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-700"
          />
        )}
      </div>
    </div>
  );
}

interface PivotZonesPanelProps {
  dataset: DatasetMeta | undefined;
  report: ReportDefinition;
  onAddToZone: (zone: PivotZone, fieldId: string, kind: "dimension" | "measure") => void;
  onRemoveFromZone: (zone: PivotZone, id: string, index?: number) => void;
  onReorderZone: (zone: "rows" | "columns", from: number, to: number) => void;
  onUpdateValueField: (id: string, patch: Partial<ValueFieldConfig>) => void;
  onUpdateFilter: (index: number, patch: Partial<FilterClause>) => void;
}

export function PivotZonesPanel({
  dataset,
  report,
  onAddToZone,
  onRemoveFromZone,
  onReorderZone,
  onUpdateValueField,
  onUpdateFilter,
}: PivotZonesPanelProps) {
  const getDimLabel = (id: string) => dataset?.dimensions.find((d) => d.id === id)?.label ?? id;
  const getMsrLabel = (id: string) => dataset?.measures.find((m) => m.id === id)?.label ?? id;

  const handleDrop = (item: DragItem) => {
    if (!item.zone) return;
    onAddToZone(item.zone, item.fieldId, item.kind);
  };

  if (!dataset) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Pivot Layout</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">Drag fields into zones below</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        <ZoneDropArea zone="filters" onDropItem={handleDrop} count={report.filters.length}>
          {report.filters.map((flt, idx) => (
            <FilterRow
              key={`${flt.field_id}-${idx}`}
              label={getDimLabel(flt.field_id)}
              filter={flt}
              index={idx}
              onUpdate={(patch) => onUpdateFilter(idx, patch)}
              onRemove={() => onRemoveFromZone("filters", flt.field_id, idx)}
            />
          ))}
        </ZoneDropArea>

        <div className="grid grid-cols-2 gap-2">
          <ZoneDropArea zone="columns" onDropItem={handleDrop} count={report.columns.length}>
            {report.columns.map((id, idx) => (
              <ZoneChip
                key={id}
                label={getDimLabel(id)}
                onRemove={() => onRemoveFromZone("columns", id)}
                item={{ fieldId: id, kind: "dimension" }}
                index={idx}
                zone="columns"
                onMove={(from, to) => onReorderZone("columns", from, to)}
              />
            ))}
          </ZoneDropArea>

          <ZoneDropArea zone="rows" onDropItem={handleDrop} count={report.rows.length}>
            {report.rows.map((id, idx) => (
              <ZoneChip
                key={id}
                label={getDimLabel(id)}
                onRemove={() => onRemoveFromZone("rows", id)}
                item={{ fieldId: id, kind: "dimension" }}
                index={idx}
                zone="rows"
                onMove={(from, to) => onReorderZone("rows", from, to)}
              />
            ))}
          </ZoneDropArea>
        </div>

        <ZoneDropArea zone="values" onDropItem={handleDrop} count={report.value_fields.length}>
          {report.value_fields.map((vf) => (
            <ValueFieldSettings
              key={vf.id}
              valueField={vf}
              label={getMsrLabel(vf.field_id)}
              onUpdate={(patch) => onUpdateValueField(vf.id, patch)}
              onRemove={() => onRemoveFromZone("values", vf.id)}
            />
          ))}
        </ZoneDropArea>
      </div>
    </div>
  );
}
