"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { ComparisonSideData } from "@/types/comparison";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ComparisonChartSectionProps {
  left: ComparisonSideData;
  right: ComparisonSideData;
}

export function ComparisonChartSection({ left, right }: ComparisonChartSectionProps) {
  const deptChart = useMemo(() => {
    const labels = Array.from(
      new Set([
        ...left.departments.map((d) => d.department),
        ...right.departments.map((d) => d.department),
      ])
    ).slice(0, 12);

    const leftMap = Object.fromEntries(left.departments.map((d) => [d.department, d.net_revenue]));
    const rightMap = Object.fromEntries(right.departments.map((d) => [d.department, d.net_revenue]));

    return {
      series: [
        { name: `${left.storeName} (${left.month})`, data: labels.map((l) => leftMap[l] || 0) },
        { name: `${right.storeName} (${right.month})`, data: labels.map((l) => rightMap[l] || 0) },
      ],
      options: {
        chart: { type: "bar" as const, toolbar: { show: false }, fontFamily: "inherit" },
        plotOptions: { bar: { horizontal: false, columnWidth: "55%", borderRadius: 4 } },
        colors: ["#3B82F6", "#F43F5E"],
        dataLabels: { enabled: false },
        xaxis: { categories: labels, labels: { rotate: -35, style: { fontSize: "10px" } } },
        legend: { position: "top" as const },
        grid: { borderColor: "#f1f5f9" },
      },
    };
  }, [left, right]);

  const skuChart = useMemo(() => {
    const labels = left.topSkus.slice(0, 8).map((s) => s.item_description?.slice(0, 20) || s.barcode);
    const leftData = left.topSkus.slice(0, 8).map((s) => s.sku_revenue);
    const rightMap = Object.fromEntries(right.topSkus.map((s) => [s.barcode, s.sku_revenue]));
    const rightData = left.topSkus.slice(0, 8).map((s) => rightMap[s.barcode] || 0);

    return {
      series: [
        { name: "Left", data: leftData },
        { name: "Right", data: rightData },
      ],
      options: {
        chart: { type: "bar" as const, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: "65%", borderRadius: 4 } },
        colors: ["#3B82F6", "#F43F5E"],
        dataLabels: { enabled: false },
        xaxis: { categories: labels },
        legend: { position: "top" as const },
      },
    };
  }, [left, right]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
          Department Revenue Comparison
        </h3>
        <p className="text-xs text-gray-500 mb-4">Blue = Left · Red = Right</p>
        <Chart options={deptChart.options} series={deptChart.series} type="bar" height={320} />
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
          Top SKU Revenue Comparison
        </h3>
        <p className="text-xs text-gray-500 mb-4">Matched by left-side top articles</p>
        <Chart options={skuChart.options} series={skuChart.series} type="bar" height={320} />
      </div>
    </div>
  );
}
