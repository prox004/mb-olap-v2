"use client";

import dynamic from "next/dynamic";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

import { ApexOptions } from "apexcharts";

export default function OnlineSaleChart() {
  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
        allowMouseWheelZoom: false, // Disable mouse wheel zooming
      },
    },
    fill: {
      type: "gradient", // Explicitly specify gradient type
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    stroke: {
      curve: "smooth",
      width: [2, 2], // Correct width as an array of numbers
    },
    markers: {
      size: 0,
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      x: {
        format: "dd MMM yyyy",
      },
    },
    xaxis: {
      type: "category", // Ensure proper type for categories
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false, // Correct usage for disabling tooltips
      },
    },
    yaxis: {
      title: {
        text: "", // Ensure no text is displayed
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Sales",
      data: [180, 190, 170, 160, 175, 165, 170],
    },
    {
      name: "Revenue",
      data: [40, 30, 50, 40, 55, 40, 70],
    },
  ];
  return (
    <div>
      <ReactApexChart
        className="-ml-3"
        options={options}
        series={series}
        type="area"
        height={200}
      />
    </div>
  );
}
