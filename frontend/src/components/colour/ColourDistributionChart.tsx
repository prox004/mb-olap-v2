"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { ColourPerformanceItem } from "@/hooks/useColourData";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ColourDistributionChartProps {
  items: ColourPerformanceItem[];
  loading?: boolean;
}

const COLOUR_HEX_MAP: Record<string, string> = {
  BLACK: "#1E293B",
  WHITE: "#F8FAFC",
  NAVY: "#1E3A8A",
  BLUE: "#3B82F6",
  RED: "#EF4444",
  GREEN: "#10B981",
  YELLOW: "#F59E0B",
  PINK: "#EC4899",
  BEIGE: "#D97706",
  GREY: "#64748B",
  MAROON: "#881337",
  OLIVE: "#65A30D",
  MULTICOLOR: "#8B5CF6",
  OTHER: "#94A3B8",
};

export const ColourDistributionChart: React.FC<ColourDistributionChartProps> = ({
  items,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const validItems = items.filter((item) => item.net_revenue > 0 || item.sales_units > 0);
  const labels = validItems.map((item) => item.extracted_colour);
  const series = validItems.map((item) => Math.round(item.net_revenue));
  const colors = validItems.map((item) => COLOUR_HEX_MAP[item.extracted_colour] || "#94A3B8");

  const options: ApexOptions = {
    colors: colors.length > 0 ? colors : ["#3B82F6"],
    labels: labels.length > 0 ? labels : ["No Data"],
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          background: "transparent",
          labels: {
            show: true,
            name: { show: true },
            value: {
              show: true,
              formatter: (val: string) => `₹${parseInt(val).toLocaleString()}`,
            },
            total: {
              show: true,
              label: "Total Revenue",
              formatter: () => {
                const total = series.reduce((a, b) => a + b, 0);
                return `₹${total.toLocaleString()}`;
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `₹${val.toLocaleString()}`,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Colour Share of Revenue (₹)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Revenue distribution across parsed colour taxonomy
          </p>
        </div>
      </div>

      {validItems.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-gray-400">
          No colour sales data available for selected filters.
        </div>
      ) : (
        <div className="flex justify-center h-80">
          <ReactApexChart options={options} series={series} type="donut" height="100%" />
        </div>
      )}
    </div>
  );
};
