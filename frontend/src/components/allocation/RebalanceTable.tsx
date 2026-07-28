"use client";

import React, { useState } from "react";
import { RebalanceRecommendationItem } from "@/hooks/useAllocationData";

export function RebalanceTable({
  recommendations,
  loading,
}: {
  recommendations: RebalanceRecommendationItem[];
  loading: boolean;
}) {
  const [approvedItems, setApprovedItems] = useState<Record<string, boolean>>({});
  const [dismissedItems, setDismissedItems] = useState<Record<string, boolean>>({});
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-80 animate-pulse"></div>
    );
  }

  const handleApprove = (key: string) => {
    setApprovedItems((prev) => ({ ...prev, [key]: true }));
  };

  const handleDismiss = (key: string) => {
    setDismissedItems((prev) => ({ ...prev, [key]: true }));
  };

  const visibleRecommendations = recommendations.filter((item, idx) => {
    const key = `${item.barcode}-${item.source_store_code}-${item.target_store_code}-${idx}`;
    if (dismissedItems[key]) return false;
    if (urgencyFilter !== "ALL" && item.urgency_level !== urgencyFilter) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Automated Inter-Store Rebalancing Desk
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-life Min-Max WOC algorithm pairing surplus source stores with deficit target stores
          </p>
        </div>

        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setUrgencyFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              urgencyFilter === "ALL"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            All Recommendations
          </button>
          <button
            onClick={() => setUrgencyFilter("CRITICAL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              urgencyFilter === "CRITICAL"
                ? "bg-white text-rose-600 shadow-xs dark:bg-gray-700 dark:text-rose-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Critical Urgency
          </button>
          <button
            onClick={() => setUrgencyFilter("HIGH")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              urgencyFilter === "HIGH"
                ? "bg-white text-amber-600 shadow-xs dark:bg-gray-700 dark:text-amber-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            High Urgency
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="py-3 px-4">Barcode & Item</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Transfer Type</th>
              <th className="py-3 px-4">Source Store (Surplus)</th>
              <th className="py-3 px-4">Target Store (Deficit)</th>
              <th className="py-3 px-4">Transfer Qty</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4 text-center">Action / STO Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {visibleRecommendations.slice(0, 50).map((item, idx) => {
              const key = `${item.barcode}-${item.source_store_code}-${item.target_store_code}-${idx}`;
              const isApproved = !!approvedItems[key];

              return (
                <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-900 dark:text-white">
                    <div className="font-bold">{item.barcode}</div>
                    <div className="text-[11px] text-gray-400 font-sans">{item.description}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-200">
                    {item.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.transfer_type === "DC_REPLENISHMENT"
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {item.transfer_type === "DC_REPLENISHMENT" ? "DC REPLENISH" : "LATERAL REBALANCE"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.source_store_name}</div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400">
                      Stock: {item.source_stock} ({item.source_woc} Wks)
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.target_store_name}</div>
                    <div className={`text-[11px] ${item.target_stock < 0 ? "text-purple-600 dark:text-purple-400 font-bold" : "text-rose-600 dark:text-rose-400"}`}>
                      Stock: {item.target_stock} {item.target_stock < 0 ? "(Negative Lag)" : `(${item.target_woc} Wks)`}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-bold text-xs">
                      {item.recommended_transfer_qty} Units
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.urgency_level === "CRITICAL"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                          : item.urgency_level === "HIGH"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {item.urgency_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        STO Order Generated
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleApprove(key)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 shadow-xs transition-all cursor-pointer"
                        >
                          Approve Transfer
                        </button>
                        <button
                          onClick={() => handleDismiss(key)}
                          className="px-2 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
