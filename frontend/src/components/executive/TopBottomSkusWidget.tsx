"use client";

import React, { useState } from "react";
import { SKURankingItem } from "@/hooks/useExecutiveData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

export function TopBottomSkusWidget({
  topSkus,
  bottomSkus,
  loading,
}: {
  topSkus: SKURankingItem[];
  bottomSkus: SKURankingItem[];
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"top" | "bottom">("top");

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-64 animate-pulse"></div>
    );
  }

  const listData = activeTab === "top" ? topSkus : bottomSkus;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            SKU Performance Highlights
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Top revenue-generating barcodes vs slow-moving liquidation candidates
          </p>
        </div>

        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab("top")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "top"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            🔥 Top 10 Revenue Generators
          </button>
          <button
            onClick={() => setActiveTab("bottom")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "bottom"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            💀 Bottom 10 Slow Movers / Dead Stock
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="py-3 px-4">Rank & Barcode</th>
              <th className="py-3 px-4">Description / Division</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Sales Units</th>
              <th className="py-3 px-4">Net Revenue (₹)</th>
              <th className="py-3 px-4">Stock On-Hand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {listData.map((item, index) => (
              <tr key={item.barcode} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  {item.barcode}
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.item_description || item.barcode}
                  </div>
                  <div className="text-[11px] text-gray-400">{item.division}</div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">
                  {item.department}
                </td>
                <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  {item.sku_sales_units.toLocaleString()}
                </td>
                <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.sku_revenue)}
                </td>
                <td className="py-3 px-4 font-medium">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      item.sku_sales_units === 0 && item.current_stock_units > 0
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item.current_stock_units.toLocaleString()} Units
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
