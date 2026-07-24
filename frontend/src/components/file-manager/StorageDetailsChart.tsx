"use client";
import React, { useMemo } from "react";
import { ApexOptions } from "apexcharts";

import dynamic from "next/dynamic";
// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const StorageDetailsChart: React.FC = () => {
  // Mocked dark mode state (replace with actual context/state if applicable)
  const isDarkMode = true; // Change this to your dark mode logic

  // Chart configuration using useMemo for optimization
  const options: ApexOptions = useMemo(
    () => ({
      colors: ["#9b8afb", "#fd853a", "#fdb022", "#32d583"],
      labels: ["Downloads", "Apps", "Documents", "Media"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "donut",
      },
      stroke: {
        show: false,
        width: 4,
        colors: ["transparent"], // Corrected to be an array
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            background: "transparent",
            labels: {
              show: true,
              name: {
                show: true,
                offsetY: -10,
                color: isDarkMode ? "#ffffff" : "#1D2939",
                fontSize: "14px",
                fontWeight: "500",
              },
              value: {
                show: true,
                offsetY: 0,
                color: isDarkMode ? "#D1D5DB" : "#667085",
                fontSize: "16px",
                fontWeight: "400",
                formatter: () => "Used of 135 GB",
              },
              total: {
                show: true,
                label: "Total 160 GB",
                color: isDarkMode ? "#ffffff" : "#000000",
                fontSize: "16px",
                fontWeight: "bold",
              },
            },
          },
          expandOnClick: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        enabled: false,
      },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "left",
        fontFamily: "Outfit, sans-serif",
        fontSize: "14px",
        fontWeight: 400,
        markers: {
          size: 6,
          shape: "circle",
          strokeWidth: 0,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 6,
        },
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: {
              width: 320,
            },
            legend: {
              itemMargin: {
                horizontal: 7,
                vertical: 5,
              },
              fontSize: "12px",
            },
          },
        },
      ],
    }),
    [isDarkMode]
  );

  // Chart data series
  const series = [45, 65, 25, 25];

  return (
    <div className="px-4 pt-6 pb-6 bg-white border border-gray-200 rounded-2xl dark:border-gray-800 dark:bg-gray-900 sm:px-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Storage Details
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            585 GB Free space left
          </p>
        </div>
      </div>
      <div className="flex justify-center mx-auto " id="chartDarkStyle">
        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          width="400"
        />
      </div>
    </div>
  );
};

export default StorageDetailsChart;
