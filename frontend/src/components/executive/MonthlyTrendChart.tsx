"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MonthlyTrendItem } from "@/hooks/useExecutiveData";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function MonthlyTrendChart({ trends, loading }: { trends: MonthlyTrendItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-80 animate-pulse"></div>
    );
  }

  const categories = trends.map((t) => {
    if (t.month_name === "2026-04") return "April 2026";
    if (t.month_name === "2026-05") return "May 2026";
    if (t.month_name === "2026-06") return "June 2026";
    return t.month_name;
  });

  const revenueSeries = trends.map((t) => Number((t.revenue / 1e7).toFixed(2))); // In Crores
  const marginSeries = trends.map((t) => t.gross_margin_pct);

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
      formatter: (val) => `${val}%`,
    },
    labels: categories,
    xaxis: {
      categories: categories,
    },
    yaxis: [
      {
        title: { text: "Revenue (₹ Crores)" },
        labels: {
          formatter: (val) => `₹${val} Cr`,
        },
      },
      {
        opposite: true,
        title: { text: "Gross Margin %" },
        labels: {
          formatter: (val) => `${val}%`,
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
            Monthly Performance Trends (Q2 2026)
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
