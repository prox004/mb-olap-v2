"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type PriceBandItem = {
  price_band: string;
  department: string | null;
  total_skus: number;
  total_sales_units: number;
  total_revenue: number;
  total_gross_profit: number;
  margin_pct: number;
  stock_units: number;
};

export default function PriceLadderWidget() {
  const { selectedStores, selectedDepartment } = useOlapFilter();
  const [data, setData] = useState<PriceBandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPriceLadder() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, unknown> = {};
        if (selectedDepartment && selectedDepartment !== "All") {
          params.department = selectedDepartment;
        }
        if (selectedStores && selectedStores.length > 0) {
          params.store_ids = selectedStores;
        }

        const res = await apiClient<{ success: boolean; data: PriceBandItem[] }>("/analytics/price-ladder", {
          params,
        });

        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load price ladder data:", err);
        setError("Error loading price ladder");
      } finally {
        setLoading(false);
      }
    }

    loadPriceLadder();
  }, [selectedStores, selectedDepartment]);

  // Aggregate data per price band (since the API returns them grouped by price_band & department)
  const bandSummaryMap: Record<string, {
    price_band: string;
    total_skus: number;
    total_sales_units: number;
    total_revenue: number;
    total_gross_profit: number;
    stock_units: number;
  }> = {};

  // Standard ordered price bands
  const bandOrder = ["< 300", "300 - 500", "500 - 1000", "> 1000"];

  bandOrder.forEach((band) => {
    bandSummaryMap[band] = {
      price_band: band,
      total_skus: 0,
      total_sales_units: 0,
      total_revenue: 0,
      total_gross_profit: 0,
      stock_units: 0,
    };
  });

  data.forEach((item) => {
    const band = item.price_band;
    if (!bandSummaryMap[band]) {
      bandSummaryMap[band] = {
        price_band: band,
        total_skus: 0,
        total_sales_units: 0,
        total_revenue: 0,
        total_gross_profit: 0,
        stock_units: 0,
      };
    }
    bandSummaryMap[band].total_skus += item.total_skus;
    bandSummaryMap[band].total_sales_units += item.total_sales_units;
    bandSummaryMap[band].total_revenue += item.total_revenue;
    bandSummaryMap[band].total_gross_profit += item.total_gross_profit;
    bandSummaryMap[band].stock_units += item.stock_units;
  });

  const aggregatedBands = bandOrder.map((band) => {
    const summary = bandSummaryMap[band];
    const margin_pct = summary.total_revenue > 0 ? (summary.total_gross_profit / summary.total_revenue) * 100.0 : 0.0;
    const woc = (summary.total_sales_units / 12.0) > 0 ? summary.stock_units / (summary.total_sales_units / 12.0) : 999.0;
    return {
      ...summary,
      margin_pct,
      woc,
    };
  });

  // Chart 1: Revenue (Bar) & Sales Units (Bar) Dual display
  const chart1Series = [
    {
      name: "Revenue (RS)",
      type: "column",
      data: aggregatedBands.map((b) => Math.round(b.total_revenue)),
    },
    {
      name: "Sales Units",
      type: "column",
      data: aggregatedBands.map((b) => Math.round(b.total_sales_units)),
    },
  ];

  const chart1Options: ApexOptions = {
    colors: ["#3E80F5", "#10B981"],
    chart: {
      height: 320,
      type: "line",
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      width: [0, 0],
    },
    plotOptions: {
      bar: {
        columnWidth: "50%",
        borderRadius: 4,
      },
    },
    xaxis: {
      categories: aggregatedBands.map((b) => b.price_band),
      title: {
        text: "Price Band (RS)",
        style: {
          fontWeight: 600,
        },
      },
    },
    yaxis: [
      {
        title: {
          text: "Total Revenue (RS)",
          style: {
            color: "#3E80F5",
            fontWeight: 600,
          },
        },
        labels: {
          style: {
            colors: "#3E80F5",
          },
          formatter: function (val: number) {
            return "₹" + val.toLocaleString();
          },
        },
      },
      {
        opposite: true,
        title: {
          text: "Sales Units",
          style: {
            color: "#10B981",
            fontWeight: 600,
          },
        },
        labels: {
          style: {
            colors: "#10B981",
          },
          formatter: function (val: number) {
            return val.toLocaleString();
          },
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  // Chart 2: Gross Profit Margin % (Line)
  const chart2Series = [
    {
      name: "Gross Margin %",
      data: aggregatedBands.map((b) => parseFloat(b.margin_pct.toFixed(2))),
    },
  ];

  const chart2Options: ApexOptions = {
    colors: ["#F59E0B"],
    chart: {
      height: 320,
      type: "line",
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    markers: {
      size: 5,
    },
    xaxis: {
      categories: aggregatedBands.map((b) => b.price_band),
      title: {
        text: "Price Band (RS)",
        style: {
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      title: {
        text: "Gross Profit Margin (%)",
        style: {
          fontWeight: 600,
        },
      },
      labels: {
        formatter: function (val: number) {
          return val.toFixed(1) + "%";
        },
      },
      min: 0,
      max: 100,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + "% Margin";
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Price Ladder Performance & Elasticity
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Analyze sales velocity and gross margins across standard retail price bands
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs dark:bg-rose-950/20 dark:text-rose-400">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20 dark:bg-white/[0.01]">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                Volume & Revenue distribution
              </h4>
              <ReactApexChart options={chart1Options} series={chart1Series} type="line" height={320} />
            </div>

            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20 dark:bg-white/[0.01]">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                Profit Margin % trend
              </h4>
              <ReactApexChart options={chart2Options} series={chart2Series} type="line" height={320} />
            </div>
          </div>

          {/* Table Summary */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Price Band Performance Summary Table
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Price Band</th>
                    <th className="px-4 py-3 text-right">SKU Count</th>
                    <th className="px-4 py-3 text-right">Sales Units</th>
                    <th className="px-4 py-3 text-right">Net Revenue</th>
                    <th className="px-4 py-3 text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-right">Margin %</th>
                    <th className="px-4 py-3 text-right">Stock Units</th>
                    <th className="px-4 py-3 text-right">WOC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {aggregatedBands.map((band) => (
                    <tr key={band.price_band} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{band.price_band}</td>
                      <td className="px-4 py-3 text-right">{band.total_skus.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{band.total_sales_units.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">₹{band.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-right">₹{band.total_gross_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400">
                        {band.margin_pct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right">{band.stock_units.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                        {band.woc > 100 ? "999.0" : band.woc.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
