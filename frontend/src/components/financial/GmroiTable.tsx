"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";
import { GmroiItem } from "./GmroiCards";

export default function GmroiTable() {
  const { selectedStores, selectedDepartment } = useOlapFilter();
  const [data, setData] = useState<GmroiItem[]>([]);
  const [groupBy, setGroupBy] = useState<"store" | "department" | "vendor" | "sku">("store");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadGmroi() {
      try {
        setLoading(true);
        const params: Record<string, unknown> = { group_by: groupBy };
        if (selectedDepartment && selectedDepartment !== "All") {
          params.department = selectedDepartment;
        }
        if (selectedStores && selectedStores.length > 0) {
          params.store_ids = selectedStores;
        }

        const res = await apiClient<{ success: boolean; data: GmroiItem[] }>("/financial/gmroi", {
          params,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load GMROI table:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGmroi();
  }, [groupBy, selectedStores, selectedDepartment]);

  const getDimensionName = (item: GmroiItem) => {
    if (groupBy === "store") return item.store_name || `Store #${item.admsite_code}`;
    if (groupBy === "department") return item.department || "UNKNOWN";
    if (groupBy === "vendor") return item.vendor_name || "UNKNOWN";
    return `${item.item_name || "UNKNOWN"} (${item.barcode || "N/A"})`;
  };

  const getGmroiBadgeClass = (ratio: number) => {
    if (ratio > 2.5) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
    if (ratio >= 1.5) return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900";
    return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900";
  };

  const getGmroiEfficiencyLabel = (ratio: number) => {
    if (ratio > 2.5) return "High Efficiency";
    if (ratio >= 1.5) return "Optimal";
    return "Capital Inefficient";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            GMROI Comparison & Rank Table
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Gross Margin Return on Investment ratio across dimensions
          </p>
        </div>

        {/* Dimension Toggles */}
        <div className="flex items-center p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          {(["store", "department", "vendor", "sku"] as const).map((dim) => (
            <button
              key={dim}
              onClick={() => setGroupBy(dim)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all uppercase ${
                groupBy === dim
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              By {dim}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Dimension Name</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3 text-right">Avg Inventory Value</th>
                <th className="px-4 py-3 text-center">GMROI Ratio</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {getDimensionName(item)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ₹{item.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ₹{item.total_gross_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ₹{item.avg_inventory_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">
                    {item.gmroi_ratio.toFixed(2)}x
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getGmroiBadgeClass(item.gmroi_ratio)}`}>
                      {getGmroiEfficiencyLabel(item.gmroi_ratio)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
