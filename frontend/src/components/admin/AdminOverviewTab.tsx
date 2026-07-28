"use client";

import React from "react";
import { useOlapFilter } from "@/context/OlapFilterContext";

export default function AdminOverviewTab({ onNavigateStores }: { onNavigateStores: () => void }) {
  const { availableStores } = useOlapFilter();

  const retailStoresCount = availableStores.filter(s => s.site_type === "RETAIl_STORE" || s.admsite_code !== 1070).length;
  const warehouseCount = availableStores.filter(s => s.site_type === "CENTRAL_WAREHOUSE" || s.admsite_code === 1070).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          System Overview & Scale Capacity
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          High-performance DuckDB OLAP architecture engineered to scale seamlessly up to 250+ retail store outlets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 rounded-xl">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Total Managed Outlets
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {availableStores.length} <span className="text-xs font-normal text-gray-500">/ 250+ Max Scale</span>
          </p>
        </div>

        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Active Retail Outlets
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {retailStoresCount}
          </p>
        </div>

        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-xl">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Central Warehouse Hubs
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {warehouseCount}
          </p>
        </div>


        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            etl Auto-Sync Status
          </p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Background Threads Active
          </p>
        </div>
      </div>


      <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Manage & Scale Store Outlets
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add new store AdmSite codes, modify location names, or remove inactive outlets with instant Parquet & DuckDB re-indexing.
          </p>
        </div>
        <button
          onClick={onNavigateStores}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs shrink-0">
          Open Stores Manager
        </button>
      </div>
    </div>
  );
}
