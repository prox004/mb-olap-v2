"use client";

import React from "react";
import { ExecutiveKPIs } from "@/hooks/useExecutiveData";
import { getKpiKeys, KPI_METADATA } from "@/config/kpiMetadata";
import {
  computeComparison,
  directionColorClass,
  directionIcon,
  formatComparisonValue,
} from "@/utils/comparisonUtils";

interface ComparisonKpiGridProps {
  leftKpis: ExecutiveKPIs;
  rightKpis: ExecutiveKPIs;
  leftLabel: string;
  rightLabel: string;
  loading?: boolean;
}

export function ComparisonKpiGrid({
  leftKpis,
  rightKpis,
  leftLabel,
  rightLabel,
  loading,
}: ComparisonKpiGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {getKpiKeys().map((key) => {
        const meta = KPI_METADATA[key];
        const result = computeComparison(leftKpis[key], rightKpis[key]);

        return (
          <div
            key={key}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs hover:shadow-md transition-shadow"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
              {meta.label}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mb-0.5 truncate">
                  {leftLabel}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatComparisonValue(result.left, meta.format)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold mb-0.5 truncate">
                  {rightLabel}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatComparisonValue(result.right, meta.format)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Difference</span>
                <span className={`font-semibold ${directionColorClass(result.direction)}`}>
                  {directionIcon(result.direction)}{" "}
                  {formatComparisonValue(Math.abs(result.difference), meta.format)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Change</span>
                <span className={`font-semibold ${directionColorClass(result.direction)}`}>
                  {result.percentChange === null
                    ? "N/A"
                    : `${result.percentChange >= 0 ? "+" : ""}${result.percentChange.toFixed(2)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Winner</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                  {result.winner === "tie" ? "Tie" : result.winner}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
