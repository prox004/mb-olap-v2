"use client";

import React, { useState } from "react";
import { StoreStockCoverItem } from "@/hooks/useAllocationData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

export function StoreStockCoverTable({ items, loading }: { items: StoreStockCoverItem[]; loading: boolean }) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-64 animate-pulse"></div>
    );
  }

  const filteredItems = items.filter((i) => {
    if (filterStatus === "ALL") return true;
    return i.stock_health_status === filterStatus;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Store Stock Cover & Inventory Health Matrix
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Outlet stock positions, sales run rates, and stock-out risk classifications by department
          </p>
        </div>

        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterStatus === "ALL"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            All Outlets
          </button>
          <button
            onClick={() => setFilterStatus("HIGH_RISK_STOCKOUT")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterStatus === "HIGH_RISK_STOCKOUT"
                ? "bg-white text-rose-600 shadow-xs dark:bg-gray-700 dark:text-rose-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            High Risk Stockout
          </button>
          <button
            onClick={() => setFilterStatus("OVERSTOCKED")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterStatus === "OVERSTOCKED"
                ? "bg-white text-amber-600 shadow-xs dark:bg-gray-700 dark:text-amber-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Overstocked
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="py-3 px-4">Store Outlet</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Sales Units</th>
              <th className="py-3 px-4">Revenue (₹)</th>
              <th className="py-3 px-4">Stock Units</th>
              <th className="py-3 px-4">Stock Value (₹)</th>
              <th className="py-3 px-4">Weeks of Cover (WOC)</th>
              <th className="py-3 px-4">Health Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredItems.slice(0, 50).map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                      item.site_type === "CENTRAL_WAREHOUSE"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {item.site_type === "CENTRAL_WAREHOUSE" ? "DC" : "STORE"}
                  </span>
                  {item.store_name}
                </td>
                <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">
                  {item.department}
                </td>
                <td className="py-3 px-4 font-medium">{item.sales_units.toLocaleString()}</td>
                <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.revenue)}
                </td>
                <td className="py-3 px-4">{item.stock_units.toLocaleString()}</td>
                <td className="py-3 px-4">{formatCurrency(item.stock_value)}</td>
                <td className="py-3 px-4 font-semibold">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      item.store_woc <= 2.5
                        ? "text-rose-600 dark:text-rose-400"
                        : item.store_woc <= 8
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {item.store_woc} Wks
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.stock_health_status === "HIGH_RISK_STOCKOUT"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                        : item.stock_health_status === "OVERSTOCKED"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                    }`}
                  >
                    {item.stock_health_status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
