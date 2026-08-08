"use client";

import React, { useState } from "react";
import { AGGREGATION_OPTIONS, ValueFieldConfig } from "@/types/reporting";

export function ValueFieldSettings({
  valueField,
  label,
  onUpdate,
  onRemove,
}: {
  valueField: ValueFieldConfig;
  label: string;
  onUpdate: (patch: Partial<ValueFieldConfig>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const displayName = valueField.display_name || label;
  const aggLabel = AGGREGATION_OPTIONS.find((a) => a.value === valueField.aggregation)?.label ?? valueField.aggregation;

  return (
    <div className="rounded-md bg-white dark:bg-gray-900 border border-emerald-200/60 dark:border-emerald-900/60 overflow-hidden group">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span className="text-gray-300 text-[10px]">⠿</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium truncate text-gray-800 dark:text-gray-200">{displayName}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{aggLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-5 h-5 rounded text-[10px] transition-colors ${
            open ? "bg-brand-100 text-brand-600" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          ⚙
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 text-[10px] transition-all"
        >
          ✕
        </button>
      </div>
      {open && (
        <div className="px-2 pb-2 pt-1 space-y-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <div>
            <label className="text-[10px] text-gray-500 font-medium">Display name</label>
            <input
              value={valueField.display_name || ""}
              onChange={(e) => onUpdate({ display_name: e.target.value })}
              className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder={label}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 font-medium">Aggregation</label>
              <select
                value={valueField.aggregation}
                onChange={(e) => onUpdate({ aggregation: e.target.value as ValueFieldConfig["aggregation"] })}
                className="w-full mt-0.5 px-1.5 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {AGGREGATION_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-medium">Format</label>
              <select
                value={valueField.format || "auto"}
                onChange={(e) => onUpdate({ format: e.target.value as ValueFieldConfig["format"] })}
                className="w-full mt-0.5 px-1.5 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="auto">Auto</option>
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percent">Percent</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
