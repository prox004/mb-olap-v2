"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { VendorScorecardItem } from "@/hooks/useVendorData";
import { formatDisplayValue } from "@/utils";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface VendorReturnChartProps {
  returnVendors: VendorScorecardItem[];
  supported?: boolean;
  message?: string | null;
  loading?: boolean;
}

export const VendorReturnChart: React.FC<VendorReturnChartProps> = ({
  returnVendors,
  supported = true,
  message,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const safeReturnVendors = Array.isArray(returnVendors) ? returnVendors : [];

  const top10ReturnVendors = [...safeReturnVendors]
    .sort((a, b) => Math.abs(b.return_value ?? 0) - Math.abs(a.return_value ?? 0))
    .slice(0, 10);

  const categories = top10ReturnVendors.map((v) => {
    const name = formatDisplayValue(v.vendor_name);
    return name.length > 25 ? name.substring(0, 25) + "..." : name;
  });
  const seriesData = top10ReturnVendors.map((v) => Math.round(Math.abs(v.return_value ?? 0)));

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
        formatter: (val: string) => {
          const num = Number(val);
          return isNaN(num) ? "" : `₹${num.toLocaleString()}`;
        },
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

  const isUnsupported = supported === false;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {isUnsupported
              ? "Goods Return Analysis"
              : "Goods Return Value Analysis (Top 10 High Return Suppliers)"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isUnsupported
              ? "Vendor return transaction data is not available in the current dataset."
              : "Monetary value (₹) of returned merchandise from vendors with Return Rate > 5%"}
          </p>
        </div>
        {isUnsupported ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            Data unavailable
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Return Rate Risk
          </span>
        )}
      </div>

      {isUnsupported ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Vendor return data unavailable
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
            {message || "The current inventory dataset does not contain separate vendor-return transaction records, so return-risk analysis cannot be calculated reliably."}
          </p>
        </div>
      ) : top10ReturnVendors.length === 0 ? (
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
