"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { apiClient } from "@/utils/apiClient";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type SizeCurveItem = {
  division: string;
  department: string;
  size_code: string;
  total_bought_units: number;
  total_sold_units: number;
  current_stock_units: number;
  net_revenue: number;
  size_contribution_pct: number;
};

const MIN_CONTRIBUTION_PCT = 0.05;

function departmentsForDivision(items: SizeCurveItem[], division: string): string[] {
  return Array.from(
    new Set(
      items
        .filter((item) => item.division.toUpperCase() === division)
        .map((item) => item.department.toUpperCase())
    )
  );
}

export default function SizeCurveChart() {
  const [data, setData] = useState<SizeCurveItem[]>([]);
  const [allItems, setAllItems] = useState<SizeCurveItem[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("MENS WEAR");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("T SHIRTS");
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const departments = useMemo(
    () => departmentsForDivision(allItems, selectedDivision),
    [allItems, selectedDivision]
  );

  useEffect(() => {
    async function loadInitialLookups() {
      try {
        setLoading(true);
        const res = await apiClient<{ success: boolean; data: SizeCurveItem[] }>("/analytics/size-curve");
        if (res.success && res.data) {
          setAllItems(res.data);
          const uniqueDivs = Array.from(new Set(res.data.map((item) => item.division.toUpperCase())));
          setDivisions(uniqueDivs);

          const defaultDiv = uniqueDivs.includes("MENS WEAR") ? "MENS WEAR" : uniqueDivs[0] || "";
          setSelectedDivision(defaultDiv);

          const depts = departmentsForDivision(res.data, defaultDiv);
          const defaultDept = depts.includes("T SHIRTS") ? "T SHIRTS" : depts[0] || "";
          setSelectedDepartment(defaultDept);
        }
      } catch (err) {
        console.error("Failed to load size curve lookup data:", err);
        setError("Failed to load filters");
      } finally {
        setLoading(false);
      }
    }
    loadInitialLookups();
  }, []);

  useEffect(() => {
    if (!departments.length) return;
    setSelectedDepartment((prev) => (departments.includes(prev) ? prev : departments[0]));
  }, [departments]);

  useEffect(() => {
    if (!selectedDepartment) return;

    let cancelled = false;

    async function loadSizeCurveData() {
      try {
        setLoading(true);
        const res = await apiClient<{ success: boolean; data: SizeCurveItem[] }>("/analytics/size-curve", {
          params: {
            division: selectedDivision || undefined,
            department: selectedDepartment || undefined,
          },
        });
        if (!cancelled && res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load size curve chart data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSizeCurveData();
    return () => {
      cancelled = true;
    };
  }, [selectedDivision, selectedDepartment]);

  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    const depts = departmentsForDivision(allItems, division);
    setSelectedDepartment((prev) => (depts.includes(prev) ? prev : depts[0] || ""));
  };

  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.size_contribution_pct - a.size_contribution_pct);
    if (showAllSizes) return sorted;
    const significant = sorted.filter((item) => item.size_contribution_pct >= MIN_CONTRIBUTION_PCT);
    if (significant.length === 0) return sorted.slice(0, 10);
    const hidden = sorted.filter((item) => item.size_contribution_pct < MIN_CONTRIBUTION_PCT);
    if (hidden.length === 0) return significant;
    const otherPct = hidden.reduce((sum, item) => sum + item.size_contribution_pct, 0);
    return [
      ...significant,
      {
        division: selectedDivision,
        department: selectedDepartment,
        size_code: `Other (${hidden.length} sizes)`,
        total_bought_units: 0,
        total_sold_units: 0,
        current_stock_units: 0,
        net_revenue: 0,
        size_contribution_pct: otherPct,
      },
    ];
  }, [data, showAllSizes, selectedDivision, selectedDepartment]);

  const categories = useMemo(() => chartData.map((item) => item.size_code), [chartData]);
  const contributions = useMemo(() => chartData.map((item) => item.size_contribution_pct), [chartData]);
  const barCount = chartData.length;
  const chartHeight = Math.max(280, barCount * 34 + 60);
  const maxContribution = useMemo(
    () => (contributions.length ? Math.max(...contributions, 5) : 5),
    [contributions]
  );

  const series = useMemo(
    () => [{ name: "Sales Contribution %", data: contributions }],
    [contributions]
  );

  const options: ApexOptions = useMemo(
    () => ({
      colors: ["#3E80F5"],
      chart: {
        type: "bar",
        height: chartHeight,
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: barCount > 12 ? "75%" : "55%",
          borderRadius: 4,
          dataLabels: { position: "right" },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        style: { fontSize: "11px", colors: ["#1e293b"] },
        offsetX: 24,
      },
      xaxis: {
        categories,
        title: {
          text: "Size Tag",
          style: { fontWeight: 600, fontSize: "11px" },
        },
        labels: {
          style: { fontSize: "11px" },
          maxWidth: 160,
          trim: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: {
          text: "Sales Contribution (%)",
          style: { fontWeight: 600, fontSize: "11px" },
        },
        labels: {
          formatter: (val: number) => `${Math.round(val)}%`,
          style: { fontSize: "11px" },
        },
        max: Math.ceil(maxContribution * 1.15),
        tickAmount: 6,
        min: 0,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(2)}% of department sales`,
        },
      },
      grid: {
        borderColor: "#f1f5f9",
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: { left: 8, right: 16 },
      },
    }),
    [categories, chartHeight, barCount, maxContribution]
  );

  const hiddenCount = data.filter((item) => item.size_contribution_pct < MIN_CONTRIBUTION_PCT).length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Size Curve Sales Distribution
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Empirical size sales contribution ratio (%) per category
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Division</span>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 dark:text-gray-200 outline-hidden"
            >
              {divisions.map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Department</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 dark:text-gray-200 outline-hidden"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs dark:bg-rose-950/20 dark:text-rose-400">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-xs text-gray-400">
          No size sales data available for this selection
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-500">
              Showing {barCount} size{barCount !== 1 ? "s" : ""}
              {!showAllSizes && hiddenCount > 0 && ` · ${hiddenCount} low-contribution sizes grouped`}
            </p>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllSizes((v) => !v)}
                className="text-[10px] font-semibold text-brand-600 hover:text-brand-700"
              >
                {showAllSizes ? "Group small sizes" : "Show all sizes"}
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[640px] rounded-xl border border-gray-100 dark:border-gray-800">
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={chartHeight}
            />
          </div>
        </>
      )}
    </div>
  );
}
