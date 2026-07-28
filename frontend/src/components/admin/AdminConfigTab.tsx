"use client";

import React from "react";

export default function AdminConfigTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          System Configuration & Limits
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          High-performance OLAP warehouse runtime parameters.
        </p>
      </div>

      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Maximum Store Outlet Scale
            </label>
            <input
              type="number"
              value="250"
              disabled
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Enabled for up to 250+ concurrent outlets.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              DuckDB Connection Mode
            </label>
            <input
              type="text"
              value="READ_WRITE Auto-Switch"
              disabled
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Automatic read-write handshake on store inserts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
