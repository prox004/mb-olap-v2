"use client";

import React from "react";
import { ComparisonTableConfig } from "@/types/comparison";
import { DatasetMeta } from "@/types/reporting";

interface ComparisonTableConfigPanelProps {
  config: ComparisonTableConfig;
  dataset: DatasetMeta | null;
  onChange: (patch: Partial<ComparisonTableConfig>) => void;
}

export function ComparisonTableConfigPanel({
  config,
  dataset,
  onChange,
}: ComparisonTableConfigPanelProps) {
  const dimensions = dataset?.dimensions.filter((d) => d.data_type === "string") ?? [];
  const measures = dataset?.measures ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
        Dimension Breakdown
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Dimension</label>
          <select
            value={config.dimension ?? ""}
            onChange={(e) => onChange({ dimension: e.target.value || null })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="">Select dimension...</option>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Metric</label>
          <select
            value={config.metric ?? ""}
            onChange={(e) => onChange({ metric: e.target.value || null })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="">Select metric...</option>
            {measures.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
