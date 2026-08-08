"use client";

import React from "react";
import { LocationOption } from "@/context/OlapFilterContext";
import { ComparisonSelection } from "@/types/comparison";

interface ComparisonSelectorsProps {
  left: ComparisonSelection;
  right: ComparisonSelection;
  stores: LocationOption[];
  months: string[];
  onLeftChange: (sel: ComparisonSelection) => void;
  onRightChange: (sel: ComparisonSelection) => void;
  onCompare: () => void;
  loading: boolean;
}

function SelectionCard({
  title,
  accent,
  selection,
  stores,
  months,
  onChange,
}: {
  title: string;
  accent: "blue" | "rose";
  selection: ComparisonSelection;
  stores: LocationOption[];
  months: string[];
  onChange: (sel: ComparisonSelection) => void;
}) {
  const accentClasses =
    accent === "blue"
      ? "from-blue-500/10 to-brand-500/5 border-blue-200 dark:border-blue-900"
      : "from-rose-500/10 to-orange-500/5 border-rose-200 dark:border-rose-900";

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 shadow-xs ${accentClasses}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`w-2.5 h-2.5 rounded-full ${accent === "blue" ? "bg-blue-500" : "bg-rose-500"}`}
        />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
            Store
          </label>
          <select
            value={selection.storeId ?? ""}
            onChange={(e) =>
              onChange({ ...selection, storeId: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="">Select store...</option>
            {stores.map((s) => (
              <option key={s.admsite_code} value={s.admsite_code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
            Month
          </label>
          <select
            value={selection.month ?? ""}
            onChange={(e) => onChange({ ...selection, month: e.target.value || null })}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="">Select month...</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
            Date <span className="font-normal normal-case text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            value={selection.date ?? ""}
            onChange={(e) => onChange({ ...selection, date: e.target.value || null })}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        </div>
      </div>
    </div>
  );
}

export function ComparisonSelectors({
  left,
  right,
  stores,
  months,
  onLeftChange,
  onRightChange,
  onCompare,
  loading,
}: ComparisonSelectorsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto] gap-4 items-end">
      <SelectionCard
        title="Left Selection"
        accent="blue"
        selection={left}
        stores={stores}
        months={months}
        onChange={onLeftChange}
      />

      <div className="hidden lg:flex flex-col items-center justify-center pb-6">
        <div className="w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-black shadow-lg">
          VS
        </div>
      </div>

      <SelectionCard
        title="Right Selection"
        accent="rose"
        selection={right}
        stores={stores}
        months={months}
        onChange={onRightChange}
      />

      <button
        type="button"
        onClick={onCompare}
        disabled={loading}
        className="h-[52px] px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? "Comparing..." : "Compare"}
      </button>
    </div>
  );
}
