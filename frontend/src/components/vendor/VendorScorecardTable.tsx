"use client";

import React from "react";
import { VendorScorecardItem } from "@/hooks/useVendorData";
import { ExportCsvButton } from "@/components/common/ExportCsvButton";

interface VendorScorecardTableProps {
  items: VendorScorecardItem[];
  totalVendors: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
  loading?: boolean;
}

export const VendorScorecardTable: React.FC<VendorScorecardTableProps> = ({
  items,
  totalVendors,
  searchTerm,
  onSearchChange,
  sortBy,
  order,
  onSort,
  loading = false,
}) => {
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Grade A ({score.toFixed(1)})
        </span>
      );
    } else if (score >= 60) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Grade B ({score.toFixed(1)})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          Grade C ({score.toFixed(1)})
        </span>
      );
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return <span className="text-gray-300 dark:text-gray-600 ml-1"></span>;
    return <span className="text-brand-500 ml-1">{order === "asc" ? "Asc" : "Desc"}</span>;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      {/* Table Toolbar / Search Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Vendor Commercial Scorecard
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Showing {items.length} of {totalVendors.toLocaleString()} suppliers sorted by {sortBy.replace("_", " ")} ({order.toUpperCase()})
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ExportCsvButton
            columns={[
              { key: "vendor_name", header: "Vendor" },
              { key: "net_revenue", header: "Net Revenue" },
              { key: "gross_profit", header: "Gross Profit" },
              { key: "margin_pct", header: "Margin %" },
              { key: "return_rate_pct", header: "Return Rate %" },
              { key: "total_skus_supplied", header: "SKUs Supplied" },
              { key: "vendor_score", header: "Score" },
            ]}
            rows={items as unknown as Record<string, unknown>[]}
            filenameParts={["Vendor_Scorecard"]}
          />
          <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search vendor name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <th
                onClick={() => onSort("vendor_name")}
                className="py-3.5 px-4 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Vendor Name {renderSortIndicator("vendor_name")}
              </th>
              <th
                onClick={() => onSort("total_skus_supplied")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                SKUs Supplied {renderSortIndicator("total_skus_supplied")}
              </th>
              <th
                onClick={() => onSort("receive_units")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Received Units {renderSortIndicator("receive_units")}
              </th>
              <th
                onClick={() => onSort("net_revenue")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Net Revenue (₹) {renderSortIndicator("net_revenue")}
              </th>
              <th
                onClick={() => onSort("gross_profit")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Gross Profit (₹) {renderSortIndicator("gross_profit")}
              </th>
              <th
                onClick={() => onSort("sell_through_pct")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sell-Through % {renderSortIndicator("sell_through_pct")}
              </th>
              <th
                onClick={() => onSort("margin_pct")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Gross Margin % {renderSortIndicator("margin_pct")}
              </th>
              <th
                onClick={() => onSort("return_rate_pct")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Return Rate % {renderSortIndicator("return_rate_pct")}
              </th>
              <th
                onClick={() => onSort("vendor_score")}
                className="py-3.5 px-4 text-center cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Vendor Score {renderSortIndicator("vendor_score")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  Loading vendor commercial performance...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  No vendors found matching search filters.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white max-w-xs truncate" title={item.vendor_name}>
                    {item.vendor_name}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300 font-medium">
                    {item.total_skus_supplied.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300 font-medium">
                    {Math.round(item.receive_units).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-bold">
                    ₹{Math.round(item.net_revenue).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    ₹{Math.round(item.gross_profit).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-700 dark:text-gray-300">
                    {item.sell_through_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-700 dark:text-gray-300">
                    {item.margin_pct.toFixed(1)}%
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${item.return_rate_pct > 5 ? "text-rose-600 dark:text-rose-400" : "text-gray-600 dark:text-gray-300"}`}>
                    {item.return_rate_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getScoreBadge(item.vendor_score)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
