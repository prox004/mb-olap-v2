"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type BuyingAccuracyItem = {
  department: string;
  total_bought_units: number;
  total_bought_value: number;
  total_sold_units: number;
  total_sold_value: number;
  unsold_units: number;
  unsold_value: number;
  total_discount_amount: number;
  total_promo_amount: number;
  buying_accuracy_pct: number;
};

export default function BoughtVsSoldChart() {
  const { selectedStores, selectedDepartment } = useOlapFilter();
  const [data, setData] = useState<BuyingAccuracyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAccuracy() {
      try {
        setLoading(true);
        const params: Record<string, unknown> = {};
        if (selectedDepartment && selectedDepartment !== "All") {
          params.department = selectedDepartment;
        }
        if (selectedStores && selectedStores.length > 0) {
          params.store_ids = selectedStores;
        }

        const res = await apiClient<{ success: boolean; data: BuyingAccuracyItem[] }>("/financial/buying-accuracy", {
          params,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load buying accuracy data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAccuracy();
  }, [selectedStores, selectedDepartment]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate totals
  const totalBought = data.reduce((acc, curr) => acc + curr.total_bought_units, 0);
  const totalSold = data.reduce((acc, curr) => acc + curr.total_sold_units, 0);
  const totalUnsold = data.reduce((acc, curr) => acc + curr.unsold_units, 0);

  const accuracyPct = totalBought > 0 ? (totalSold / totalBought) * 100.0 : 0.0;

  const series = [totalSold, totalUnsold];

  const options: ApexOptions = {
    colors: ["#10B981", "#EF4444"],
    labels: ["Sold Units (Realized)", "Unsold Units (On-Hand)"],
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          background: "transparent",
          labels: {
            show: true,
            name: {
              show: true,
            },
            value: {
              show: true,
              formatter: function (val: string) {
                return parseInt(val).toLocaleString() + " units";
              },
            },
            total: {
              show: true,
              label: "Total Units",
              formatter: function () {
                return (totalSold + totalUnsold).toLocaleString() + " pcs";
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toLocaleString() + " units";
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Procurement Realization
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bought vs Sold vs Unsold Stock units ratio
          </p>
        </div>

        {/* Accuracy Badge */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400">Buying Accuracy</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            accuracyPct > 50
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900"
          }`}>
            {accuracyPct.toFixed(2)}% Realized
          </span>
        </div>
      </div>

      <div className="flex justify-center mx-auto" id="chartDarkStyle">
        <ReactApexChart options={options} series={series} type="donut" height={270} />
      </div>

      {/* Info card details */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-gray-400">Total Bought</span>
          <span className="font-bold text-gray-900 dark:text-white">{totalBought.toLocaleString()} units</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400">Total Sold</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalSold.toLocaleString()} units</span>
        </div>
      </div>
    </div>
  );
}
