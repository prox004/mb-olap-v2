"use client";

import React from "react";
import { VendorListResponse, VendorScorecardItem } from "@/hooks/useVendorData";
import { AlertIcon, GroupIcon, ShootingStarIcon } from "@/icons";

interface VendorSummaryCardsProps {
  scorecard: VendorListResponse;
  returnVendors: VendorScorecardItem[];
  loading?: boolean;
}

export const VendorSummaryCards: React.FC<VendorSummaryCardsProps> = ({
  scorecard,
  returnVendors,
  loading = false,
}) => {
  const topVendor = scorecard.items.length > 0
    ? [...scorecard.items].sort((a, b) => b.vendor_score - a.vendor_score)[0]
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/*  Total Active Suppliers */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Active Suppliers
          </span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {loading ? "..." : scorecard.total_vendors.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Suppliers with transaction history
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-500 text-xl font-bold">
          <GroupIcon className="h-6 w-6" />
        </div>
      </div>

      {/*  Top Rated Vendor */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div className="pr-2 overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Top Rated Supplier
          </span>
          <div className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate" title={topVendor?.vendor_name || "N/A"}>
            {loading ? "..." : (topVendor?.vendor_name || "N/A")}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Score: {topVendor ? topVendor.vendor_score.toFixed(1) : "0.0"} / 100
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 text-xl font-bold shrink-0">
          <ShootingStarIcon className="h-6 w-6" />
        </div>
      </div>

      {/*  High Return Rate Alert Vendors */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            High Return Alert Suppliers
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {loading ? "..." : returnVendors.length}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Suppliers with Goods Return Rate &gt; 5%
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 text-xl font-bold">
          <AlertIcon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
