"use client";
import React, { useState } from "react";
import ChartTab from "../common/ChartTab";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import dynamic from "next/dynamic";
// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function TrafficStats() {
  const optionsOne: ApexOptions = {
    grid: {
      show: false,
    },
    colors: ["#12B76A"],
    fill: {
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    legend: {
      show: false,
    },
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 70,
      type: "area",
      parentHeightOffset: 0,

      toolbar: {
        show: false,
      },
    },
    tooltip: {
      enabled: false,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 1,
    },
    xaxis: {
      type: "datetime",
      categories: [
        "2018-09-19T00:00:00.000Z",
        "2018-09-19T01:30:00.000Z",
        "2018-09-19T02:30:00.000Z",
        "2018-09-19T03:30:00.000Z",
        "2018-09-19T04:30:00.000Z",
        "2018-09-19T05:30:00.000Z",
        "2018-09-19T06:30:00.000Z",
        "2018-09-19T07:30:00.000Z",
        "2018-09-19T08:30:00.000Z",
        "2018-09-19T09:30:00.000Z",
        "2018-09-19T10:30:00.000Z",
        "2018-09-19T11:30:00.000Z",
        "2018-09-19T12:30:00.000Z",
      ],
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
  };

  const series = [
    {
      name: "New Sales",
      data: [300, 350, 310, 370, 248, 187, 295, 191, 269, 201, 185, 252, 151],
    },
  ];

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-1 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Traffic Stats
          </h3>
        </div>
        <div className="relative h-fit">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <ChartTab />
      <div>
        {/* <!-- Stats item --> */}
        <div className="flex items-end justify-between py-5">
          <div>
            <p className="mb-1 text-gray-500 text-theme-sm dark:text-gray-400">
              New Subscribers
            </p>
            <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              567K
            </h4>
            <span className="flex items-center gap-1.5">
              <span className="text-success-600"> +3.85% </span>
              <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                then last Week
              </span>
            </span>
          </div>
          <div className="w-full max-w-[150px]">
            <div className="chartNine chartNine-01">
              <ReactApexChart
                options={optionsOne}
                series={series}
                type="area"
                height={70}
              />
            </div>
          </div>
        </div>
        {/* <!-- Stats item --> */}
        <div className="flex items-end justify-between py-5 border-gray-100 border-y dark:border-gray-800">
          <div>
            <p className="mb-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Conversion Rate
            </p>
            <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              276K
            </h4>
            <span className="flex items-center gap-1.5">
              <span className="text-error-600"> -5.39% </span>
              <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                then last Week
              </span>
            </span>
          </div>

          <div className="w-full max-w-[150px]">
            <div className="chartTen ">
              <ReactApexChart
                options={optionsOne}
                series={series}
                type="area"
                height={70}
              />
            </div>
          </div>
        </div>
        {/* <!-- Stats item --> */}
        <div className="flex items-end justify-between py-5">
          <div>
            <p className="mb-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Page Bounce Rate
            </p>
            <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              285
            </h4>
            <span className="flex items-center gap-1.5">
              <span className="text-success-600"> +12.74% </span>
              <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                then last Week
              </span>
            </span>
          </div>

          <div className="w-full max-w-[150px]">
            <div className="chartNine chartNine-02">
              <ReactApexChart
                options={optionsOne}
                series={series}
                type="area"
                height={70}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
