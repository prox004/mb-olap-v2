"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DynamicReportRendererProps {
  visualizationType: string;
  columns: string[];
  data: Record<string, unknown>[];
}

export const DynamicReportRenderer: React.FC<DynamicReportRendererProps> = ({
  visualizationType,
  columns,
  data
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 text-sm text-center">
        No records returned for this query.
      </div>
    );
  }

  const exportCSV = () => {
    if (!data.length) return;
    const headers = columns.join(",");
    const rows = data.map((row) => columns.map((col) => `"${row[col] ?? ""}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `olap_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. KPI CARD
  if (visualizationType === "KPI_CARD") {
    const firstRow = data[0];
    const key = columns[columns.length - 1];
    const val = firstRow[key];
    const formattedVal = typeof val === "number" ? val.toLocaleString() : String(val);

    return (
      <div className="my-3 p-4 rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            {key.replace(/_/g, " ")}
          </span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formattedVal}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
          📊
        </div>
      </div>
    );
  }

  // 2. PIE / DONUT CHART
  if (visualizationType === "PIE_CHART" && columns.length >= 2) {
    const catCol = columns[0];
    const valCol = columns[1];
    const labels = data.map((d) => String(d[catCol] ?? "N/A"));
    const series = data.map((d) => Number(d[valCol]) || 0);

    const options: ApexOptions = {
      chart: { type: "donut", background: "transparent" },
      labels: labels,
      colors: ["#3c50e0", "#80caee", "#0fadcf", "#6577f3", "#8fd0ef", "#00e396", "#feb019", "#ff4560"],
      legend: { position: "bottom", labels: { colors: "#64748b" } },
      dataLabels: { enabled: true },
      stroke: { show: false }
    };

    return (
      <div className="my-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 flex justify-between items-center">
          <span>{catCol} vs {valCol}</span>
          <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 text-[10px]">Donut Chart</span>
        </div>
        <ReactApexChart options={options} series={series} type="donut" height={280} />
      </div>
    );
  }

  // 3. BAR CHART
  if (visualizationType === "BAR_CHART" && columns.length >= 2) {
    const catCol = columns[0];
    const valCol = columns[1];
    const categories = data.slice(0, 15).map((d) => String(d[catCol] ?? "N/A"));
    const values = data.slice(0, 15).map((d) => Number(d[valCol]) || 0);

    const options: ApexOptions = {
      chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
      colors: ["#3c50e0"],
      plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: "55%" } },
      dataLabels: { enabled: false },
      xaxis: { categories: categories, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      grid: { borderColor: "#e2e8f0", strokeDashArray: 4 }
    };

    const series = [{ name: valCol.replace(/_/g, " "), data: values }];

    return (
      <div className="my-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 flex justify-between items-center">
          <span>Top Results for {valCol.replace(/_/g, " ")}</span>
          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px]">Bar Chart</span>
        </div>
        <ReactApexChart options={options} series={series} type="bar" height={280} />
      </div>
    );
  }

  // 4. DATA TABLE (Default Fallback)
  return (
    <div className="my-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
          Result Table ({data.length} records)
        </span>
        <button
          onClick={exportCSV}
          className="px-2.5 py-1 text-[11px] font-medium rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors flex items-center gap-1"
        >
          <span>📥 Export CSV</span>
        </button>
      </div>
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 font-semibold border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 whitespace-nowrap">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
            {data.slice(0, 50).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 whitespace-nowrap">
                    {typeof row[col] === "number" ? row[col].toLocaleString() : String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
