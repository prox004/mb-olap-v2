"use client";

import React from "react";
import dynamic from "next/dynamic";
import { CategoryMatrixItem } from "@/hooks/useCategoryData";
import { ApexOptions } from "apexcharts";
import { formatDisplayValue } from "@/utils";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function CategoryMatrixChart({ matrix, loading }: { matrix: CategoryMatrixItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-96 animate-pulse"></div>
    );
  }

  const safeMatrix = Array.isArray(matrix) ? matrix : [];

  const winners = safeMatrix
    .filter((m) => m.performance_quadrant === "WINNER")
    .map((m) => ({ x: m.sell_through_pct ?? 0, y: m.margin_pct ?? 0, name: formatDisplayValue(m.department) }));

  const highMarginSlow = safeMatrix
    .filter((m) => m.performance_quadrant === "HIGH_MARGIN_SLOW")
    .map((m) => ({ x: m.sell_through_pct ?? 0, y: m.margin_pct ?? 0, name: formatDisplayValue(m.department) }));

  const volumeDrivers = safeMatrix
    .filter((m) => m.performance_quadrant === "VOLUME_DRIVER")
    .map((m) => ({ x: m.sell_through_pct ?? 0, y: m.margin_pct ?? 0, name: formatDisplayValue(m.department) }));

  const underperformers = safeMatrix
    .filter((m) => m.performance_quadrant === "OVERSTOCKED_UNDERPERFORMER")
    .map((m) => ({ x: m.sell_through_pct ?? 0, y: m.margin_pct ?? 0, name: formatDisplayValue(m.department) }));

  const series = [
    { name: "Winners (Star Performers)", data: winners },
    { name: "High Margin / Slow Movers", data: highMarginSlow },
    { name: "Volume Drivers", data: volumeDrivers },
    { name: "Overstocked / Underperformers", data: underperformers },
  ];

  const options: ApexOptions = {
    chart: {
      height: 380,
      type: "scatter",
      zoom: { enabled: true, type: "xy" },
      toolbar: { show: true },
    },
    colors: ["#10b981", "#465fff", "#f59e0b", "#ef4444"],
    markers: {
      size: 6,
      hover: {
        size: 8,
      },
    },
    xaxis: {
      title: { text: "Sell-Through Rate % (Final Sale Qty Basis)" },
      tickAmount: 10,
      labels: { formatter: (val) => (isNaN(Number(val)) ? "" : `${Number(val).toFixed(1)}%`) },
    },
    yaxis: {
      title: { text: "Gross Margin %" },
      labels: { formatter: (val) => (isNaN(Number(val)) ? "" : `${Number(val).toFixed(1)}%`) },
    },
    tooltip: {
      custom: function ({ seriesIndex, dataPointIndex, w }) {
        const item = w.config.series[seriesIndex]?.data?.[dataPointIndex];
        if (!item) return "";
        return `
          <div className="p-2.5 text-xs font-sans bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700">
            <strong className="text-brand-400 text-sm">${item.name}</strong>
            <div className="mt-1">
              <span>Sell-Through: <b>${item.x != null ? `${item.x}%` : "N/A"}</b></span><br/>
              <span>Gross Margin: <b>${item.y != null ? `${item.y}%` : "N/A"}</b></span>
            </div>
          </div>
        `;
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Category Performance Matrix (4-Quadrant Scatter Plot)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Categorizes departments by Sell-Through Rate % (Final Sale Qty basis, Apr 1 – Sep 15) vs Gross Margin %
          </p>
        </div>
      </div>

      <div className="w-full h-96">
        <ReactApexChart options={options} series={series} type="scatter" height={360} />
      </div>
    </div>
  );
}
