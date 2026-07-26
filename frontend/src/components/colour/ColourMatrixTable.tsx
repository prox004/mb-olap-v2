"use client";

import React, { useState } from "react";
import { ColourPerformanceItem } from "@/hooks/useColourData";

interface ColourMatrixTableProps {
  items: ColourPerformanceItem[];
  loading?: boolean;
}

export const ColourMatrixTable: React.FC<ColourMatrixTableProps> = ({
  items,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedColourFilter, setSelectedColourFilter] = useState<string>("ALL");

  const distinctColours = Array.from(new Set(items.map((i) => i.extracted_colour)));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.extracted_colour || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColour =
      selectedColourFilter === "ALL" || item.extracted_colour === selectedColourFilter;
    return matchesSearch && matchesColour;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      {/* Table Toolbar Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Department Colour Preference Breakdown Table
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cross-tabular performance of colour tags across retail departments
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Colour Dropdown Filter */}
          <select
            value={selectedColourFilter}
            onChange={(e) => setSelectedColourFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ALL">All Colours ({distinctColours.length})</option>
            {distinctColours.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <th className="py-3.5 px-4">Extracted Colour</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4 text-right">SKU Count</th>
              <th className="py-3.5 px-4 text-right">Sales Units</th>
              <th className="py-3.5 px-4 text-right">Revenue (₹)</th>
              <th className="py-3.5 px-4 text-right">Gross Margin %</th>
              <th className="py-3.5 px-4 text-right">Sell-Through %</th>
              <th className="py-3.5 px-4 text-right">Stock On-Hand (Units)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Loading department colour breakdown...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No department colour metrics match search filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600"
                        style={{
                          backgroundColor:
                            item.extracted_colour === "WHITE"
                              ? "#FFFFFF"
                              : item.extracted_colour === "BLACK"
                              ? "#1E293B"
                              : item.extracted_colour === "BLUE"
                              ? "#3B82F6"
                              : item.extracted_colour === "RED"
                              ? "#EF4444"
                              : item.extracted_colour === "GREEN"
                              ? "#10B981"
                              : "#94A3B8",
                        }}
                      />
                      {item.extracted_colour}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    {item.department}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                    {item.total_skus.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                    {Math.round(item.sales_units).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                    ₹{Math.round(item.net_revenue).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.margin_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                    {item.sell_through_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                    {Math.round(item.current_stock_units).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
