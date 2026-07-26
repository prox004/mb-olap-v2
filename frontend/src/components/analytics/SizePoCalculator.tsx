"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";

type RecommendationItem = {
  size_code: string;
  historical_contribution_pct: number;
  recommended_units: number;
};

type RecommendationResponse = {
  department: string;
  target_total_po_units: number;
  recommendations: RecommendationItem[];
};

export default function SizePoCalculator() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("T SHIRTS");
  const [targetQuantity, setTargetQuantity] = useState<number>(1000);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Load department options on mount
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await apiClient<{ success: boolean; data: { department: string }[] }>("/analytics/size-curve");
        if (res.success && res.data) {
          const uniqueDepts = Array.from(new Set(res.data.map((item) => item.department.toUpperCase())));
          setDepartments(uniqueDepts);
          if (uniqueDepts.includes("T SHIRTS")) {
            setSelectedDept("T SHIRTS");
          } else if (uniqueDepts.length > 0) {
            setSelectedDept(uniqueDepts[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load departments for calculator:", err);
      }
    }
    loadDepts();
  }, []);

  const handleCalculate = async () => {
    if (!selectedDept) {
      setCalcError("Please select a department");
      return;
    }
    if (targetQuantity <= 0) {
      setCalcError("Please enter a target quantity greater than 0");
      return;
    }

    try {
      setLoading(true);
      setCalcError(null);
      const res = await apiClient<{ success: boolean; data: RecommendationResponse }>("/analytics/recommend-size-po", {
        method: "POST",
        body: JSON.stringify({
          department: selectedDept,
          target_total_po_units: targetQuantity,
        }),
      });

      if (res.success && res.data) {
        setRecommendations(res.data.recommendations);
      } else {
        setCalcError("Failed to calculate PO recommendations");
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error connecting to server";
      setCalcError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (recommendations.length === 0) return;

    const headers = ["Size Tag", "Historical Sales Contribution %", "Recommended Order Units"];
    const csvRows = [headers.join(",")];

    recommendations.forEach((item) => {
      csvRows.push([
        `"${item.size_code}"`,
        item.historical_contribution_pct.toFixed(2),
        item.recommended_units,
      ].join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PO_Recommended_Size_Ratio_${selectedDept.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          PO Recommended Size Ratio Calculator
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Compute recommended size purchase quantities based on empirical store demand patterns
        </p>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 outline-hidden w-full"
          >
            <option value="">Select Department...</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Target PO Quantity (Units)</label>
          <input
            type="number"
            min="1"
            value={targetQuantity}
            onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
            className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 outline-hidden w-full"
            placeholder="e.g. 1000"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-theme-xs transition-colors"
        >
          {loading ? "Calculating..." : "Calculate Size Ratio"}
        </button>

        {recommendations.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Export to CSV
          </button>
        )}
      </div>

      {calcError && (
        <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-lg dark:bg-rose-950/20 dark:text-rose-400">
           {calcError}
        </div>
      )}

      {/* Results table */}
      {recommendations.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Size Tag</th>
                <th className="px-4 py-3 text-right">Historical Sales Contribution %</th>
                <th className="px-4 py-3 text-right">Recommended Order Quantity (Units)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recommendations.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.size_code}</td>
                  <td className="px-4 py-3 text-right">{item.historical_contribution_pct.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {item.recommended_units.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50/50 dark:bg-white/[0.01] font-bold">
                <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
                <td className="px-4 py-3 text-right">100.00%</td>
                <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                  {recommendations.reduce((acc, curr) => acc + curr.recommended_units, 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
