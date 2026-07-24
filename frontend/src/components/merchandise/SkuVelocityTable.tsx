"use client";

import React, { useState } from "react";
import { SkuVelocityItem } from "@/hooks/useMerchandiseData";

interface SkuVelocityTableProps {
  items: SkuVelocityItem[];
  totalRecords: number;
  page: number;
  pageSize: number;
  loading: boolean;
  velocityFilter: string;
  onVelocityFilterChange: (val: string) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onPageChange: (newPage: number) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (field: string) => void;
}

export const SkuVelocityTable: React.FC<SkuVelocityTableProps> = ({
  items,
  totalRecords,
  page,
  pageSize,
  loading,
  velocityFilter,
  onVelocityFilterChange,
  searchQuery,
  onSearchQueryChange,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const [selectedSku, setSelectedSku] = useState<SkuVelocityItem | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FAST_MOVER":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Fast Mover</span>;
      case "MEDIUM_MOVER":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Medium Mover</span>;
      case "SLOW_MOVER":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Slow Mover</span>;
      case "DEAD_STOCK":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Dead Stock</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4">
      {/* Search & Filter Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Barcode, Description, or Vendor..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </div>

        {/* Velocity Filter Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "FAST_MOVER", "MEDIUM_MOVER", "SLOW_MOVER", "DEAD_STOCK"].map((st) => (
            <button
              key={st}
              onClick={() => onVelocityFilterChange(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                velocityFilter === st
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {st === "ALL" ? "All Velocity" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="p-3">Barcode</th>
              <th className="p-3">Description</th>
              <th className="p-3">Department</th>
              <th className="p-3">Vendor</th>
              <th className="p-3 cursor-pointer select-none" onClick={() => onSortChange("net_revenue")}>
                Revenue (₹) {sortBy === "net_revenue" && (sortOrder === "desc" ? "↓" : "↑")}
              </th>
              <th className="p-3 text-right">Sales Units</th>
              <th className="p-3 text-right">Stock Value</th>
              <th className="p-3 text-right">Sell-Through %</th>
              <th className="p-3 text-right">WOC (Wks)</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-gray-400">
                  Loading SKU velocity records...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-gray-400">
                  No matching SKU records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.barcode}
                  onClick={() => setSelectedSku(item)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{item.barcode}</td>
                  <td className="p-3 max-w-xs truncate font-medium text-gray-900 dark:text-white" title={item.description}>
                    {item.description || "N/A"}
                  </td>
                  <td className="p-3 text-gray-500">{item.department || "N/A"}</td>
                  <td className="p-3 max-w-[120px] truncate text-gray-500" title={item.vendor}>
                    {item.vendor || "N/A"}
                  </td>
                  <td className="p-3 font-bold text-gray-900 dark:text-white">
                    ₹{item.net_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-medium">{item.sales_units.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium">
                    ₹{item.closing_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-bold text-brand-600 dark:text-brand-400">
                    {item.sell_through_pct.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    {item.woc >= 999 ? "999+" : item.woc.toFixed(1)}
                  </td>
                  <td className="p-3 text-center">{getStatusBadge(item.velocity_status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
        <div>
          Showing page <span className="font-bold text-gray-900 dark:text-white">{page}</span> of{" "}
          <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span> ({totalRecords.toLocaleString()} total SKUs)
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 font-medium disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 font-medium disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      </div>

      {/* SKU Detail Modal Drawer */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500">SKU Detail View</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedSku.barcode}</h3>
              </div>
              <button
                onClick={() => setSelectedSku(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400">Description:</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{selectedSku.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div>
                  <span className="text-gray-400">Division</span>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedSku.division || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-400">Section</span>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedSku.section || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-400">Department</span>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedSku.department || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-400">Vendor</span>
                  <p className="font-semibold text-gray-900 dark:text-white truncate" title={selectedSku.vendor}>
                    {selectedSku.vendor || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">MRP / Cost</span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{selectedSku.mrp} / ₹{selectedSku.cost_rate}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedSku.velocity_status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-400">Revenue</span>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">₹{selectedSku.net_revenue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-400">Sales Units</span>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedSku.sales_units.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-400">Closing Stock</span>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">₹{selectedSku.closing_stock_value.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-400">Sell-Through</span>
                  <p className="font-bold text-brand-600 dark:text-brand-400 text-sm">{selectedSku.sell_through_pct.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSku(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
