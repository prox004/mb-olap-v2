"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type MarkdownSummaryItem = {
  total_discount_amount: number;
  total_promo_amount: number;
  total_gross_profit: number;
  total_adjusted_gross_profit: number;
};

export default function MarkdownWidget() {
  const { selectedStores, selectedDepartment } = useOlapFilter();
  const [data, setData] = useState<MarkdownSummaryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMarkdown() {
      try {
        setLoading(true);
        const params: Record<string, unknown> = {};
        if (selectedDepartment && selectedDepartment !== "All") {
          params.department = selectedDepartment;
        }
        if (selectedStores && selectedStores.length > 0) {
          params.store_ids = selectedStores;
        }

        const res = await apiClient<{ success: boolean; data: MarkdownSummaryItem }>("/financial/markdown-summary", {
          params,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load markdown summary data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMarkdown();
  }, [selectedStores, selectedDepartment]);

  if (loading || !data) {
    return (
      <div className="flex h-72 items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const series = [
    {
      name: "Value (RS)",
      data: [
        Math.round(data.total_discount_amount),
        Math.round(data.total_promo_amount),
        Math.round(data.total_gross_profit),
        Math.round(data.total_adjusted_gross_profit),
      ],
    },
  ];

  const options: ApexOptions = {
    colors: ["#EF4444", "#F59E0B", "#10B981", "#3E80F5"],
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 4,
        columnWidth: "45%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ["Sale Discount", "Promo markdown", "Gross Profit", "Adjusted GP"],
      labels: {
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: function (val: number) {
          return "₹" + val.toLocaleString();
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return "₹" + val.toLocaleString();
        },
      },
    },
    legend: {
      show: false,
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Markdown & Discount Profit Impact
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Write-off value of markdowns vs gross profit comparison
        </p>
      </div>

      <div className="min-h-[250px]">
        <ReactApexChart options={options} series={series} type="bar" height={250} />
      </div>

      {/* Info card details */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-gray-400">Total Discounts & Promos</span>
          <span className="font-bold text-rose-500">
            ₹{(data.total_discount_amount + data.total_promo_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400">Adjusted Gross Profit</span>
          <span className="font-bold text-blue-500">
            ₹{data.total_adjusted_gross_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}
