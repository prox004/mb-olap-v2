"use client";

import React, { useState } from "react";
import { DeadStockSummary } from "@/hooks/useMerchandiseData";

interface DeadStockDeskProps {
  summary: DeadStockSummary;
  loading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
}

export const DeadStockDesk: React.FC<DeadStockDeskProps> = ({
  summary,
  loading,
  page,
  onPageChange,
}) => {
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleAction = (barcode: string, actionType: string) => {
    setActionNotice(`[ACTION TRIGGERED] ${actionType} for SKU ${barcode}. Notification sent to Inventory Ops.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const totalCapitalLakhs = summary.total_locked_capital / 100000;
  const totalPages = Math.ceil(summary.total_dead_skus / 50) || 1;

  return (
    <div className="space-y-4">
      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          ✅ {actionNotice}
        </div>
      )}

      {/* Trapped Capital Headline Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-200">
            💀 90-Day Dead Stock Liquidation Desk
          </span>
          <h2 className="text-2xl font-extrabold mt-1">
            ₹{totalCapitalLakhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Lakhs
          </h2>
          <p className="text-xs text-rose-100 mt-0.5">
            Total Capital Trapped across {summary.total_dead_skus.toLocaleString()} Zero-Velocity SKUs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction("ALL_DEAD_STOCK", "Bulk Clearance Markdown 50% Off")}
            className="px-4 py-2 text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 rounded-xl shadow-xs transition-all"
          >
            🏷️ Bulk Markdown (50% Off)
          </button>
        </div>
      </div>

      {/* Dead Stock Items Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="p-3">Barcode</th>
                <th className="p-3">Description</th>
                <th className="p-3">Department</th>
                <th className="p-3">Vendor</th>
                <th className="p-3 text-right">MRP (₹)</th>
                <th className="p-3 text-right">Stock Units</th>
                <th className="p-3 text-right">Trapped Capital (₹)</th>
                <th className="p-3 text-center">Liquidation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Loading dead stock candidates...
                  </td>
                </tr>
              ) : summary.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No dead stock candidates identified.
                  </td>
                </tr>
              ) : (
                summary.items.map((item) => (
                  <tr key={item.barcode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{item.barcode}</td>
                    <td className="p-3 max-w-xs truncate font-medium text-gray-900 dark:text-white" title={item.description}>
                      {item.description || "N/A"}
                    </td>
                    <td className="p-3 text-gray-500">{item.department || "N/A"}</td>
                    <td className="p-3 max-w-[120px] truncate text-gray-500" title={item.vendor}>
                      {item.vendor || "N/A"}
                    </td>
                    <td className="p-3 text-right font-medium">₹{item.mrp}</td>
                    <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                      {item.closing_stock_units.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-extrabold text-gray-900 dark:text-white">
                      ₹{item.closing_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleAction(item.barcode, "50% Clearance Markdown")}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        >
                          50% Markdown
                        </button>
                        <button
                          onClick={() => handleAction(item.barcode, "Inter-Store Transfer")}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
          <div>
            Showing page <span className="font-bold text-gray-900 dark:text-white">{page}</span> of{" "}
            <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span>
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
      </div>
    </div>
  );
};
