"use client";

import React, { useState, useMemo } from "react";
import { CategoryHierarchyItem } from "@/hooks/useCategoryData";

function formatCurrency(val: number): string {
  if (val >= 1e7) {
    return `₹${(val / 1e7).toFixed(2)} Cr`;
  } else if (val >= 1e5) {
    return `₹${(val / 1e5).toFixed(2)} L`;
  } else {
    return `₹${val.toLocaleString("en-IN")}`;
  }
}

type GroupedSection = {
  sectionName: string;
  net_revenue: number;
  sales_units: number;
  gross_profit: number;
  margin_pct: number;
  closing_stock_value: number;
  closing_stock_units: number;
  sell_through_pct: number;
  woc: number;
  departments: CategoryHierarchyItem[];
};

type GroupedDivision = {
  divisionName: string;
  net_revenue: number;
  sales_units: number;
  gross_profit: number;
  margin_pct: number;
  closing_stock_value: number;
  closing_stock_units: number;
  sell_through_pct: number;
  woc: number;
  sections: Record<string, GroupedSection>;
};

export function CategoryTreeTable({ items, loading }: { items: CategoryHierarchyItem[]; loading: boolean }) {
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleDivision = (div: string) => {
    setExpandedDivisions((prev) => ({ ...prev, [div]: !prev[div] }));
  };

  const toggleSection = (secKey: string) => {
    setExpandedSections((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  // Group items hierarchically: Division -> Section -> Departments
  const groupedData = useMemo(() => {
    const divs: Record<string, GroupedDivision> = {};

    items.forEach((item) => {
      const divName = item.division || "UNKNOWN";
      const secName = item.section || "DEFAULT SECTION";

      if (!divs[divName]) {
        divs[divName] = {
          divisionName: divName,
          net_revenue: 0,
          sales_units: 0,
          gross_profit: 0,
          margin_pct: 0,
          closing_stock_value: 0,
          closing_stock_units: 0,
          sell_through_pct: 0,
          woc: 0,
          sections: {},
        };
      }

      const div = divs[divName];
      div.net_revenue += item.net_revenue;
      div.sales_units += item.sales_units;
      div.gross_profit += item.gross_profit;
      div.closing_stock_value += item.closing_stock_value;
      div.closing_stock_units += item.closing_stock_units;

      if (!div.sections[secName]) {
        div.sections[secName] = {
          sectionName: secName,
          net_revenue: 0,
          sales_units: 0,
          gross_profit: 0,
          margin_pct: 0,
          closing_stock_value: 0,
          closing_stock_units: 0,
          sell_through_pct: 0,
          woc: 0,
          departments: [],
        };
      }

      const sec = div.sections[secName];
      sec.net_revenue += item.net_revenue;
      sec.sales_units += item.sales_units;
      sec.gross_profit += item.gross_profit;
      sec.closing_stock_value += item.closing_stock_value;
      sec.closing_stock_units += item.closing_stock_units;
      sec.departments.push(item);
    });

    // Calculate aggregated percentages for Division & Section nodes
    Object.values(divs).forEach((div) => {
      div.margin_pct = div.net_revenue > 0 ? Number(((div.gross_profit / div.net_revenue) * 100).toFixed(2)) : 0;
      div.woc = (div.sales_units / 12.0) > 0 ? Number((div.closing_stock_units / (div.sales_units / 12.0)).toFixed(1)) : 999;

      Object.values(div.sections).forEach((sec) => {
        sec.margin_pct = sec.net_revenue > 0 ? Number(((sec.gross_profit / sec.net_revenue) * 100).toFixed(2)) : 0;
        sec.woc = (sec.sales_units / 12.0) > 0 ? Number((sec.closing_stock_units / (sec.sales_units / 12.0)).toFixed(1)) : 999;
      });
    });

    return Object.values(divs).sort((a, b) => b.net_revenue - a.net_revenue);
  }, [items]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-80 animate-pulse"></div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Category Hierarchy Performance Tree
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Expand Division & Section rows to drill down into Department performance
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="py-3 px-4">Category Node</th>
              <th className="py-3 px-4">Net Revenue (₹)</th>
              <th className="py-3 px-4">Sales Units</th>
              <th className="py-3 px-4">Gross Margin %</th>
              <th className="py-3 px-4">Stock Value (₹)</th>
              <th className="py-3 px-4">Sell-Through %</th>
              <th className="py-3 px-4">Weeks of Cover (WOC)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {groupedData.map((div) => {
              const isDivExpanded = !!expandedDivisions[div.divisionName];

              return (
                <React.Fragment key={div.divisionName}>
                  {/* Division Row */}
                  <tr
                    onClick={() => toggleDivision(div.divisionName)}
                    className="bg-gray-100/70 dark:bg-gray-800/80 font-bold hover:bg-gray-200/60 dark:hover:bg-gray-700/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-brand-500 font-mono text-sm">
                        {isDivExpanded ? "▼" : "▶"}
                      </span>
                      🏢 {div.divisionName}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                      {formatCurrency(div.net_revenue)}
                    </td>
                    <td className="py-3 px-4">{div.sales_units.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        {div.margin_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatCurrency(div.closing_stock_value)}</td>
                    <td className="py-3 px-4">{div.sell_through_pct}%</td>
                    <td className="py-3 px-4 font-semibold">{div.woc} Wks</td>
                  </tr>

                  {/* Section Rows */}
                  {isDivExpanded &&
                    Object.values(div.sections).map((sec) => {
                      const secKey = `${div.divisionName}-${sec.sectionName}`;
                      const isSecExpanded = !!expandedSections[secKey];

                      return (
                        <React.Fragment key={secKey}>
                          <tr
                            onClick={() => toggleSection(secKey)}
                            className="bg-gray-50/80 dark:bg-gray-800/40 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800/70 cursor-pointer transition-colors pl-6"
                          >
                            <td className="py-2.5 px-4 text-gray-800 dark:text-gray-200 flex items-center gap-2 pl-8">
                              <span className="text-gray-400 text-xs">
                                {isSecExpanded ? "▼" : "▶"}
                              </span>
                              📁 {sec.sectionName}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(sec.net_revenue)}
                            </td>
                            <td className="py-2.5 px-4">{sec.sales_units.toLocaleString()}</td>
                            <td className="py-2.5 px-4">{sec.margin_pct}%</td>
                            <td className="py-2.5 px-4">{formatCurrency(sec.closing_stock_value)}</td>
                            <td className="py-2.5 px-4">{sec.sell_through_pct}%</td>
                            <td className="py-2.5 px-4">{sec.woc} Wks</td>
                          </tr>

                          {/* Department Rows */}
                          {isSecExpanded &&
                            sec.departments.map((dept) => (
                              <tr
                                key={dept.department}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="py-2 px-4 text-gray-700 dark:text-gray-300 pl-14 font-medium">
                                  🏷️ {dept.department}
                                </td>
                                <td className="py-2 px-4 font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(dept.net_revenue)}
                                </td>
                                <td className="py-2 px-4">{dept.sales_units.toLocaleString()}</td>
                                <td className="py-2 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                                  {dept.margin_pct}%
                                </td>
                                <td className="py-2 px-4">{formatCurrency(dept.closing_stock_value)}</td>
                                <td className="py-2 px-4 font-semibold">{dept.sell_through_pct}%</td>
                                <td className="py-2 px-4 font-semibold text-amber-600 dark:text-amber-400">
                                  {dept.woc} Wks
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
