"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TransferHistoryItem } from "@/hooks/useAllocationData";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function TransferMovementChart({
  historyItems,
  loading,
}: {
  historyItems: TransferHistoryItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-80 animate-pulse"></div>
    );
  }

  const categories = historyItems.map((h) => h.store_name);
  const transferInSeries = historyItems.map((h) => Math.abs(h.transfer_in_units));
  const transferOutSeries = historyItems.map((h) => Math.abs(h.transfer_out_units));

  const series = [
    { name: "Transfer In Units (Received)", data: transferInSeries },
    { name: "Transfer Out Units (Dispatched)", data: transferOutSeries },
  ];

  const options: ApexOptions = {
    chart: {
      height: 320,
      type: "bar",
      toolbar: { show: false },
    },
    colors: ["#10b981", "#465fff"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    xaxis: { categories },
    yaxis: {
      title: { text: "Units Moved" },
      labels: { formatter: (val) => val.toLocaleString() },
    },
    tooltip: {
      y: { formatter: (val) => `${val.toLocaleString()} Units` },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Inter-Store Transfer Movement History
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Transfer-In (Received) vs Transfer-Out (Dispatched) volume per outlet node
          </p>
        </div>
      </div>

      <div className="w-full h-80">
        <ReactApexChart options={options} series={series} type="bar" height={310} />
      </div>
    </div>
  );
}
