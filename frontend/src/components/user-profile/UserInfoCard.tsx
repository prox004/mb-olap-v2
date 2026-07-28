"use client";

import React, { useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export default function UserInfoCard() {
  const { availableStores } = useOlapFilter();
  const [admsiteCode, setAdmsiteCode] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [siteType, setSiteType] = useState<string>("RETAIL_STORE");
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admsiteCode || !locationName) {
      setStatusMessage({ type: "error", text: "Please enter both AdmSite Code and Location Name." });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const codeNum = parseInt(admsiteCode, 10);
      if (isNaN(codeNum)) {
        setStatusMessage({ type: "error", text: "AdmSite Code must be a valid integer number." });
        return;
      }

      const res = await apiClient<{ success: boolean; message: string; data?: Record<string, unknown> }>("/locations", {
        method: "POST",
        body: JSON.stringify({
          admsite_code: codeNum,
          name: locationName.trim(),
          site_type: siteType,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Store added successfully!" });
        setAdmsiteCode("");
        setLocationName("");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setStatusMessage({ type: "error", text: res.message || "Failed to add store location." });
      }
    } catch (err: unknown) {
      console.error("Add store error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while saving store.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Metadata Card */}
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
                Total Registered Stores ({availableStores.length})
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {availableStores.map((loc) => (
                  <span
                    key={loc.admsite_code}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                  >
                    #{loc.admsite_code}: {loc.name.replace("M Baazar - ", "")}
                  </span>
                ))}
              </div>
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
                Analytical Storage Engine
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Parquet + DuckDB High-Performance Storage
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Store Form Card */}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 shadow-xs">
        <div className="flex flex-col gap-4">
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Add Store Data to Parquet Storage
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enter store AdmSite Code and Location Name to save directly to backend Parquet metadata (`dim_locations.parquet`) and DuckDB.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                AdmSite Code (Integer ID)
              </label>
              <input
                type="number"
                placeholder="e.g. 950"
                value={admsiteCode}
                onChange={(e) => setAdmsiteCode(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Store / Location Name
              </label>
              <input
                type="text"
                placeholder="e.g. M Baazar - Howrah Outlet"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Site Designation
              </label>
              <div className="flex gap-2">
                <select
                  value={siteType}
                  onChange={(e) => setSiteType(e.target.value)}
                  className="flex-1 h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="RETAIL_STORE">RETAIL_STORE</option>
                  <option value="CENTRAL_WAREHOUSE">CENTRAL_WAREHOUSE</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 h-10 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50 shrink-0"
                >
                  {isSubmitting ? "Saving..." : "Save Store Data"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

