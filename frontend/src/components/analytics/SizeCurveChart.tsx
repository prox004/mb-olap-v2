"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { apiClient } from "@/utils/apiClient";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type SizeCurveItem = {
  division: string;
  department: string;
  size_code: string;
  total_bought_units: number;
  total_sold_units: number;
  current_stock_units: number;
  net_revenue: number;
  size_contribution_pct: number;
};

export default function SizeCurveChart() {
  const [data, setData] = useState<SizeCurveItem[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("MENS WEAR");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("T SHIRTS");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial load to find all unique divisions and departments
  useEffect(() => {
    async function loadInitialLookups() {
      try {
        setLoading(true);
        const res = await apiClient<{ success: boolean; data: SizeCurveItem[] }>("/analytics/size-curve");
        if (res.success && res.data) {
          const uniqueDivs = Array.from(new Set(res.data.map((item) => item.division.toUpperCase())));
          const uniqueDepts = Array.from(new Set(res.data.map((item) => item.department.toUpperCase())));
          setDivisions(uniqueDivs);
          setDepartments(uniqueDepts);

          // Find a sensible default
          const defaultDiv = uniqueDivs.includes("MENS WEAR") ? "MENS WEAR" : uniqueDivs[0] || "";
          const defaultDept = uniqueDepts.includes("T SHIRTS") ? "T SHIRTS" : uniqueDepts[0] || "";
          setSelectedDivision(defaultDiv);
          setSelectedDepartment(defaultDept);
        }
      } catch (err) {
        console.error("Failed to load size curve lookup data:", err);
        setError("Failed to load filters");
      } finally {
        setLoading(false);
      }
    }
    loadInitialLookups();
  }, []);

  // 2. Load curve data when division or department selection changes
  useEffect(() => {
    if (!selectedDepartment) return;

    async function loadSizeCurveData() {
      try {
        setLoading(true);
        const res = await apiClient<{ success: boolean; data: SizeCurveItem[] }>("/analytics/size-curve", {
          params: {
            division: selectedDivision || undefined,
            department: selectedDepartment || undefined,
          },
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load size curve chart data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSizeCurveData();
  }, [selectedDivision, selectedDepartment]);

  // Prepare chart series and options
  const sortedData = [...data].sort((a, b) => b.size_contribution_pct - a.size_contribution_pct);
  const categories = sortedData.map((item) => item.size_code);
  const contributions = sortedData.map((item) => item.size_contribution_pct);

  const series = [
    {
      name: "Sales Contribution %",
      data: contributions,
    },
  ];

  const options: ApexOptions = {
    colors: ["#3E80F5"],
    chart: {
      type: "bar",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "50%",
        borderRadius: 4,
        dataLabels: {
          position: "right",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: "12px",
        colors: ["#1e293b"],
      },
      offsetX: 30,
    },
    xaxis: {
      categories: categories,
      title: {
        text: "Sales Contribution Ratio (%)",
        style: {
          fontWeight: 600,
        },
      },
      labels: {
        formatter: function (val: string) {
          return val + "%";
        },
      },
      max: Math.max(...contributions, 10) * 1.15, // buffer space for labels
    },
    yaxis: {
      title: {
        text: "Size Tag",
        style: {
          fontWeight: 600,
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toFixed(2) + "% of department sales";
        },
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Size Curve Sales Distribution
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Empirical size sales contribution ratio (%) per category
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Division</span>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 dark:text-gray-200 outline-hidden"
            >
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Department</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 dark:text-gray-200 outline-hidden"
            >
              {departments
                .map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs dark:bg-rose-950/20 dark:text-rose-400">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-xs text-gray-400">
          No size sales data available for this selection
        </div>
      ) : (
        <div className="min-h-[350px]">
          <ReactApexChart options={options} series={series} type="bar" height={350} />
        </div>
      )}
    </div>
  );
}
