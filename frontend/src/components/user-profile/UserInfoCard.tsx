"use client";

import React from "react";

export default function UserInfoCard() {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 shadow-xs">
      <div className="flex flex-col gap-6">
        <h4 className="text-base font-bold text-gray-900 dark:text-white">
          Retail System Configuration & Outlet Metadata
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Central Warehouse ID
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Store #1070 (Metro Retail Central Hub)
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Retail Outlets Managed
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              3 Stores (VIP #6, Gariahat #530, Andul Road #820)
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              System Admin Email
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              admin@mbaazar.in
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Analytical Engine
            </p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              DuckDB OLAP Engine (Read-Only Warehouse)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
