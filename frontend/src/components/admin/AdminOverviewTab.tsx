"use client";

import React from "react";
import { useOlapFilter } from "@/context/OlapFilterContext";

export default function AdminOverviewTab({ onNavigateStores }: { onNavigateStores: () => void }) {
  const { availableStores } = useOlapFilter();

  const retailStoresCount = availableStores.filter(s => s.site_type === "RETAIL_STORE" || s.admsite_code !== 1070).length;
  const warehouseCount = availableStores.filter(s => s.site_type === "CENTRAL_WAREHOUSE" || s.admsite_code === 1070).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Stores Overview
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Overview of retail outlets and central warehouse distribution hubs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 rounded-xl">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Total Outlets
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {availableStores.length}
          </p>
        </div>

        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Retail Stores
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {retailStoresCount}
          </p>
        </div>

        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-xl">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Central Warehouses
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {warehouseCount}
          </p>
        </div>
      </div>

      <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Manage Store Directory
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add new stores, update store location details, or remove inactive outlets.
          </p>
        </div>
        <button
          onClick={onNavigateStores}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs shrink-0"
        >
          Open Stores Manager
        </button>
      </div>
    </div>
  );
}
