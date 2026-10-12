"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOlapFilter } from "@/context/OlapFilterContext";

export default function StaffProfileTab() {
  const { user } = useAuth();
  const { availableStores } = useOlapFilter();
  const [storeSearch, setStoreSearch] = useState("");

  const filteredStores = availableStores.filter((s) =>
    s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.admsite_code.toString().includes(storeSearch)
  );

  return (
    <div className="space-y-6">
      {/* 1. Staff Work Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Staff Member Workspace
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
              My Profile &amp; Store Information
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your registered retail staff details and assigned store branch.
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Account Active
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-400">Full Name</span>
            <span className="block text-sm font-bold text-gray-900 dark:text-white mt-0.5">
              {user?.name || "Staff Member"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-400">Work Email</span>
            <span className="block text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">
              {user?.email || "staff@mbaazar.in"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-400">Assigned Store Branch</span>
            <span className="block text-sm font-bold text-brand-600 dark:text-brand-400 mt-0.5 truncate">
              {user?.store || "All Outlets"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-400">Role Permissions</span>
            <span className="block text-sm font-bold text-gray-900 dark:text-white mt-0.5">
              Staff Access
            </span>
          </div>
        </div>
      </div>

      {/* 2. Workspace Access Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Features You Can Access
          </h4>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              View Category &amp; Sales Performance Reports
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              Analyze Merchandise Buying &amp; SKU Velocity
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              View Store Inventory Cover &amp; Stock Rebalancing
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              Use Smart AI Assistant for conversational questions
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Manager-Only Controls
          </h4>
          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-amber-500 font-semibold">•</span>
              Adding, editing, or deleting Store Outlets (Manager only)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-500 font-semibold">•</span>
              Creating or managing other Staff accounts &amp; passwords (Manager only)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-500 font-semibold">•</span>
              Accessing confidential system settings
            </li>
          </ul>
          <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
            Need changes to your assigned store or account? Contact your Store Manager.
          </div>
        </div>
      </div>

      {/* 3. Read-Only Store Outlets Directory (Staff Directory) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              M Baazar Store Directory
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Reference list of M Baazar store branches and warehouse locations.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search store branch or code..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Store Code</th>
                <th className="py-2.5 px-4 font-semibold">Store Branch Name</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filteredStores.map((store) => (
                <tr key={store.admsite_code} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-2.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                    #{store.admsite_code}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-gray-900 dark:text-white">
                    {store.name}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        store.site_type === "CENTRAL_WAREHOUSE" || store.admsite_code === 1070
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {store.site_type === "CENTRAL_WAREHOUSE" || store.admsite_code === 1070
                        ? "Central Warehouse"
                        : "Retail Store"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400">
                    {store.state || "WEST BENGAL"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
