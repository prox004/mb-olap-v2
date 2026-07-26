"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { VendorScorecardItem } from "@/hooks/useVendorData";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface VendorReturnChartProps {
  returnVendors: VendorScorecardItem[];
  loading?: boolean;
}

export const VendorReturnChart: React.FC<VendorReturnChartProps> = ({
  returnVendors,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const top10ReturnVendors = [...returnVendors]
    .sort((a, b) => Math.abs(b.return_value) - Math.abs(a.return_value))
    .slice(0, 10);

  const categories = top10ReturnVendors.map((v) =>
    v.vendor_name.length > 25 ? v.vendor_name.substring(0, 25) + "..." : v.vendor_name
  );
  const seriesData = top10ReturnVendors.map((v) => Math.round(Math.abs(v.return_value)));

  const options: ApexOptions = {
    colors: ["#F43F5E"],
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "60%",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `₹${val.toLocaleString()}`,
      style: {
        fontSize: "11px",
        colors: ["#FFFFFF"],
      },
    },
    xaxis: {
      categories: categories.length > 0 ? categories : ["No Data"],
      labels: {
        formatter: (val: string) => `₹${Number(val).toLocaleString()}`,
        style: {
          colors: "#9CA3AF",
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "11px",
          fontWeight: 500,
        },
      },
    },
    grid: {
      borderColor: "#37415120",
      strokeDashArray: 3,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `₹${val.toLocaleString()} Goods Returned`,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Goods Return Value Analysis (Top 10 High Return Suppliers)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Monetary value (₹) of returned merchandise from vendors with Return Rate &gt; 5%
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
           Return Rate Risk
        </span>
      </div>

      {top10ReturnVendors.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-gray-400">
          No vendors found with high goods return rate (&gt; 5%).
        </div>
      ) : (
        <div className="h-72">
          <ReactApexChart
            options={options}
            series={[{ name: "Return Value (₹)", data: seriesData }]}
            type="bar"
            height="100%"
          />
        </div>
      )}
    </div>
  );
};
