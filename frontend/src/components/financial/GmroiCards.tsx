"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

export type GmroiItem = {
  admsite_code: number | null;
  store_name: string | null;
  division: string | null;
  department: string | null;
  vendor_name: string | null;
  barcode?: string | null;
  item_name?: string | null;
  total_revenue: number;
  total_gross_profit: number;
  avg_inventory_value: number;
  gmroi_ratio: number;
};

export default function GmroiCards() {
  const { selectedStores, selectedDepartment } = useOlapFilter();
  const [data, setData] = useState<GmroiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadGmroiData() {
      try {
        setLoading(true);
        const params: Record<string, unknown> = { group_by: "department" };
        if (selectedDepartment && selectedDepartment !== "All") {
          params.department = selectedDepartment;
        }
        if (selectedStores && selectedStores.length > 0) {
          params.store_ids = selectedStores;
        }

        const res = await apiClient<{ success: boolean; data: GmroiItem[] }>("/financial/gmroi", {
          params,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load GMROI cards data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGmroiData();
  }, [selectedStores, selectedDepartment]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-gray-800" />
        ))}
      </div>
    );
  }

  // Calculate Chain Average GMROI = SUM(GP) / SUM(Avg Inventory)
  const totalGP = data.reduce((acc, curr) => acc + curr.total_gross_profit, 0);
  const totalInv = data.reduce((acc, curr) => acc + curr.avg_inventory_value, 0);
  const chainAvg = totalInv > 0 ? totalGP / totalInv : 0.0;

  // Top / Lowest Performing Departments
  const sortedDepts = [...data].filter(d => d.department && d.department !== "UNKNOWN" && d.department !== "ALL");
  const topDept = sortedDepts[0];
  const lowestDept = sortedDepts[sortedDepts.length - 1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Chain Average GMROI */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Chain Average GMROI
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{chainAvg.toFixed(2)}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Return per ₹1.00 stock value
        </p>
      </div>

      {/* Top Department */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
           Top GMROI Department
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-md font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
            {topDept ? topDept.department : "N/A"}
          </span>
          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {topDept ? `${topDept.gmroi_ratio.toFixed(2)}x` : "0.00x"}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-emerald-500 font-medium">
          Highest capital efficiency
        </p>
      </div>

      {/* Lowest Department */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
           Lowest GMROI Department
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-md font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
            {lowestDept ? lowestDept.department : "N/A"}
          </span>
          <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
            {lowestDept ? `${lowestDept.gmroi_ratio.toFixed(2)}x` : "0.00x"}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-rose-500 font-medium">
           Capital inefficient - review stock cover
        </p>
      </div>
    </div>
  );
}
