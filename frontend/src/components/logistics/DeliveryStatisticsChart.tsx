"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function DeliveryStatisticsChart() {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 265,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    colors: ["#C2D6FF", "#465FFF"],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val}%`,
        style: { fontSize: "12px", colors: "#344054" },
      },
      max: 100,
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}%`,
      },
    },
    legend: { show: false },
    grid: {
      borderColor: "#F2F4F7",
      strokeDashArray: 0,
    },
  };

  const series = [
    {
      name: "2023",
      data: [80, 60, 70, 40, 65, 45, 48, 55, 58, 50, 67, 75],
    },
    {
      name: "2024",
      data: [90, 50, 65, 25, 78, 68, 75, 90, 30, 70, 90, 95],
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-center justify-between gap-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delivery Statistics
          </h3>
          <p className="dark:text-gray-40 text-sm text-gray-500">
            Total number of deliveries 70.5K
          </p>
        </div>
        <div>
          <div className="relative z-20 bg-transparent">
            <select className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30">
              <option
                value=""
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                Monthly
              </option>

              <option
                value=""
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                Yearly
              </option>
            </select>
            <span className="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <svg
                className="stroke-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-5 pt-5">
          <div className="flex items-center gap-1.5">
            <div className="bg-brand-200 h-2.5 w-2.5 rounded-full"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Shipment</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-brand-500 h-2.5 w-2.5 rounded-full"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Delivery</p>
          </div>
        </div>
        <div id="chartTwentyThree" className="h-[265px] w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={265}
          />
        </div>
      </div>
    </div>
  );
}
