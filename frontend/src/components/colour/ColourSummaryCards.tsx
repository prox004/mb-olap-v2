"use client";

import React from "react";
import { ColourSummaryResponse } from "@/hooks/useColourData";
import { BoltIcon, BoxCubeIcon, ListIcon, PieChartIcon } from "@/icons";

interface ColourSummaryCardsProps {
  summary: ColourSummaryResponse;
  loading?: boolean;
}

export const ColourSummaryCards: React.FC<ColourSummaryCardsProps> = ({
  summary,
  loading = false,
}) => {
  const topRevenueItem = summary.items.length > 0
    ? [...summary.items].sort((a, b) => b.net_revenue - a.net_revenue)[0]
    : null;

  const topSellThroughItem = summary.items.length > 0
    ? [...summary.items].sort((a, b) => b.sell_through_pct - a.sell_through_pct)[0]
    : null;

  const mostStockedItem = summary.items.length > 0
    ? [...summary.items].sort((a, b) => b.current_stock_units - a.current_stock_units)[0]
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/*  Top Revenue Colour */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Top Revenue Colour
          </span>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {loading ? "..." : (topRevenueItem?.extracted_colour || "N/A")}
          </div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
            ₹{loading ? "..." : Math.round(topRevenueItem?.net_revenue || 0).toLocaleString()}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-500 text-xl font-bold">
          <PieChartIcon className="h-6 w-6" />
        </div>
      </div>

      {/*  Highest Sell-Through Colour */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Top Sell-Through Colour
          </span>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {loading ? "..." : (topSellThroughItem?.extracted_colour || "N/A")}
          </div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
            {loading ? "..." : (topSellThroughItem?.sell_through_pct.toFixed(1) || "0.0")}% Realized
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500 text-xl font-bold">
          <BoltIcon className="h-6 w-6" />
        </div>
      </div>

      {/*  Most Stocked Colour */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Most Stocked Colour
          </span>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {loading ? "..." : (mostStockedItem?.extracted_colour || "N/A")}
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? "..." : Math.round(mostStockedItem?.current_stock_units || 0).toLocaleString()} units
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 text-xl font-bold">
          <BoxCubeIcon className="h-6 w-6" />
        </div>
      </div>

      {/*  Unique Colour Tags Parsed */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Parsed Colour Tags
          </span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {loading ? "..." : summary.total_colours}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Standardised colour taxonomy
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-500 text-xl font-bold">
          <ListIcon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
