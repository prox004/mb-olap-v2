"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MonthlyTrendItem } from "@/hooks/useExecutiveData";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function MonthlyTrendChart({ trends = [], loading }: { trends?: MonthlyTrendItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-80 animate-pulse"></div>
    );
  }

  const safeTrends = Array.isArray(trends) ? trends : [];

  if (safeTrends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Monthly Performance Trends
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Net Revenue (₹ Crores) vs Gross Profit Margin % trajectory
          </p>
        </div>
        <div className="w-full h-64 flex items-center justify-center text-xs text-gray-400">
          No monthly trend data available for selected filters.
        </div>
      </div>
    );
  }

  const categories = safeTrends.map((t) => {
    if (!t?.month_name) return "";
    const parts = String(t.month_name).split("-");
    if (parts.length < 2) return String(t.month_name);
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return isNaN(dateObj.getTime())
      ? String(t.month_name)
      : dateObj.toLocaleString("en-US", { month: "short", year: "numeric" });
  });

  const revenueSeries = safeTrends.map((t) =>
    t?.revenue != null && !isNaN(Number(t.revenue))
      ? Number((t.revenue / 1e7).toFixed(2))
      : 0
  );
  const marginSeries = safeTrends.map((t) =>
    t?.gross_margin_pct != null && !isNaN(Number(t.gross_margin_pct))
      ? Number(t.gross_margin_pct)
      : 0
  );

  const series = [
    {
      name: "Net Sales Revenue (₹ Cr)",
      type: "column",
      data: revenueSeries,
    },
    {
      name: "Gross Margin %",
      type: "line",
      data: marginSeries,
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 320,
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      width: [0, 3],
      curve: "smooth",
    },
    colors: ["#465fff", "#10b981"],
    plotOptions: {
      bar: {
        columnWidth: "40%",
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1],
      formatter: (val) => (val != null ? `${val}%` : ""),
    },
    xaxis: {
      categories: categories,
    },
    yaxis: [
      {
        title: { text: "Revenue (₹ Crores)" },
        labels: {
          formatter: (val) => (val != null ? `₹${val} Cr` : ""),
        },
      },
      {
        opposite: true,
        title: { text: "Gross Margin %" },
        labels: {
          formatter: (val) => (val != null ? `${val}%` : ""),
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Monthly Performance Trends
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Net Revenue (₹ Crores) vs Gross Profit Margin % trajectory
          </p>
        </div>
      </div>
      <div className="w-full h-80">
        <ReactApexChart options={options} series={series} type="line" height={310} />
      </div>
    </div>
  );
}
