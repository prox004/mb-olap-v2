"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useOlapFilter } from "@/context/OlapFilterContext";
import { useCategoryData, CategoryHierarchyItem, SkuVelocityItem } from "@/hooks/useCategoryData";
import { GmroiItem } from "./GmroiCards";
import { ExportCsvButton } from "@/components/common/ExportCsvButton";
import { formatDisplayValue } from "@/utils";

function formatCurrency(val: number | null | undefined): string {
  if (val == null || isNaN(Number(val))) return "N/A";
  const num = Number(val);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatDisplayValueStr(val: unknown): string {
  if (val == null || val === "") return "—";
  return String(val);
}

function computeGmroi(grossProfit: number, stockValue: number): { ratio: number; label: string; badgeClass: string } {
  const gp = Number(grossProfit) || 0;
  const inv = Number(stockValue) || 0;
  let ratio = 0;
  if (inv > 0) {
    ratio = Number((gp / inv).toFixed(2));
  } else if (gp > 0) {
    ratio = 99.0;
  }

  if (ratio > 2.5) {
    return {
      ratio,
      label: "High Efficiency",
      badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    };
  } else if (ratio >= 1.2) {
    return {
      ratio,
      label: "Optimal",
      badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    };
  } else {
    return {
      ratio,
      label: "Capital Drain",
      badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    };
  }
}

type GroupedSection = {
  sectionName: string;
  net_revenue: number;
  sales_units: number;
  gross_profit: number;
  closing_stock_value: number;
  closing_stock_units: number;
  sell_through_pct: number;
  woc: number;
  gmroi_ratio: number;
  departments: CategoryHierarchyItem[];
};

type GroupedDivision = {
  divisionName: string;
  net_revenue: number;
  sales_units: number;
  gross_profit: number;
  closing_stock_value: number;
  closing_stock_units: number;
  sell_through_pct: number;
  woc: number;
  gmroi_ratio: number;
  sections: Record<string, GroupedSection>;
};

export default function GmroiTable() {
  const { selectedStores, selectedDepartment } = useOlapFilter();
  const { hierarchy, loading: hierarchyLoading, fetchDepartmentSkus } = useCategoryData();

  // Primary View Mode: Tree (Hierarchy Drill-Down) vs Flat (Rank Table)
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");

  // Flat dimension state
  const [data, setData] = useState<GmroiItem[]>([]);
  const [groupBy, setGroupBy] = useState<"store" | "department" | "vendor" | "sku">("department");
  const [flatLoading, setFlatLoading] = useState<boolean>(true);

  // Tree expansion state
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // On-demand SKU drilldown state
  const [deptSkus, setDeptSkus] = useState<Record<string, SkuVelocityItem[]>>({});
  const [deptSkusLoading, setDeptSkusLoading] = useState<Record<string, boolean>>({});

  // Drawer state
  const [selectedSku, setSelectedSku] = useState<SkuVelocityItem | null>(null);

  // Load flat GMROI data
  useEffect(() => {
    async function loadGmroi() {
      try {
        setFlatLoading(true);
        const params: Record<string, unknown> = { group_by: groupBy };
        if (groupBy === "sku") {
          params.limit = 100;
        }
        if (selectedDepartment && selectedDepartment !== "All") {
          params.department = selectedDepartment;
        }
        if (selectedStores && selectedStores.length > 0) {
          params.store_ids = selectedStores;
        }

        const res = await apiClient<{ success: boolean; data: GmroiItem[] }>("/financial/gmroi", {
          params,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load GMROI table:", err);
      } finally {
        setFlatLoading(false);
      }
    }
    loadGmroi();
  }, [groupBy, selectedStores, selectedDepartment]);

  // Tree data aggregation
  const groupedData = useMemo(() => {
    const divs: Record<string, GroupedDivision> = {};
    const safeItems = Array.isArray(hierarchy) ? hierarchy : [];

    safeItems.forEach((item) => {
      const divName = item.division || "UNKNOWN";
      const secName = item.section || "DEFAULT SECTION";

      if (!divs[divName]) {
        divs[divName] = {
          divisionName: divName,
          net_revenue: 0,
          sales_units: 0,
          gross_profit: 0,
          closing_stock_value: 0,
          closing_stock_units: 0,
          sell_through_pct: 0,
          woc: 0,
          gmroi_ratio: 0,
          sections: {},
        };
      }
      const div = divs[divName];
      div.net_revenue += Number(item.net_revenue) || 0;
      div.sales_units += Number(item.sales_units) || 0;
      div.gross_profit += Number(item.gross_profit) || 0;
      div.closing_stock_value += Number(item.closing_stock_value) || 0;
      div.closing_stock_units += Number(item.closing_stock_units) || 0;

      if (!div.sections[secName]) {
        div.sections[secName] = {
          sectionName: secName,
          net_revenue: 0,
          sales_units: 0,
          gross_profit: 0,
          closing_stock_value: 0,
          closing_stock_units: 0,
          sell_through_pct: 0,
          woc: 0,
          gmroi_ratio: 0,
          departments: [],
        };
      }
      const sec = div.sections[secName];
      sec.net_revenue += Number(item.net_revenue) || 0;
      sec.sales_units += Number(item.sales_units) || 0;
      sec.gross_profit += Number(item.gross_profit) || 0;
      sec.closing_stock_value += Number(item.closing_stock_value) || 0;
      sec.closing_stock_units += Number(item.closing_stock_units) || 0;
      sec.departments.push(item);
    });

    Object.values(divs).forEach((div) => {
      div.gmroi_ratio = div.closing_stock_value > 0 ? Number((div.gross_profit / div.closing_stock_value).toFixed(2)) : (div.gross_profit > 0 ? 99 : 0);
      div.woc = (div.sales_units / 12.0) > 0 ? Number((div.closing_stock_units / (div.sales_units / 12.0)).toFixed(1)) : 999;
      const divTotalUnits = div.sales_units + div.closing_stock_units;
      div.sell_through_pct = divTotalUnits > 0 ? Number(((div.sales_units / divTotalUnits) * 100).toFixed(1)) : 0;

      Object.values(div.sections).forEach((sec) => {
        sec.gmroi_ratio = sec.closing_stock_value > 0 ? Number((sec.gross_profit / sec.closing_stock_value).toFixed(2)) : (sec.gross_profit > 0 ? 99 : 0);
        sec.woc = (sec.sales_units / 12.0) > 0 ? Number((sec.closing_stock_units / (sec.sales_units / 12.0)).toFixed(1)) : 999;
        const secTotalUnits = sec.sales_units + sec.closing_stock_units;
        sec.sell_through_pct = secTotalUnits > 0 ? Number(((sec.sales_units / secTotalUnits) * 100).toFixed(1)) : 0;
      });
    });

    return Object.values(divs).sort((a, b) => b.gross_profit - a.gross_profit);
  }, [hierarchy]);

  // Tree toggle actions
  const toggleDivision = (div: string) => {
    setExpandedDivisions((prev) => ({ ...prev, [div]: !prev[div] }));
  };

  const toggleSection = (secKey: string) => {
    setExpandedSections((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const toggleDept = useCallback(
    async (deptKey: string, division: string, section: string, department: string) => {
      const wasExpanded = !!expandedDepts[deptKey];
      setExpandedDepts((prev) => ({ ...prev, [deptKey]: !prev[deptKey] }));

      if (!wasExpanded && !deptSkus[deptKey]) {
        setDeptSkusLoading((prev) => ({ ...prev, [deptKey]: true }));
        try {
          const skus = await fetchDepartmentSkus(division, section, department);
          setDeptSkus((prev) => ({ ...prev, [deptKey]: skus }));
        } finally {
          setDeptSkusLoading((prev) => ({ ...prev, [deptKey]: false }));
        }
      }
    },
    [expandedDepts, deptSkus, fetchDepartmentSkus]
  );

  const expandAll = () => {
    const divKeys: Record<string, boolean> = {};
    const secKeys: Record<string, boolean> = {};
    groupedData.forEach((div) => {
      divKeys[div.divisionName] = true;
      Object.values(div.sections).forEach((sec) => {
        secKeys[`${div.divisionName}|||${sec.sectionName}`] = true;
      });
    });
    setExpandedDivisions(divKeys);
    setExpandedSections(secKeys);
  };

  const collapseAll = () => {
    setExpandedDivisions({});
    setExpandedSections({});
    setExpandedDepts({});
  };

  // Find relatable SKUs for drawer
  const relatableSkus = useMemo(() => {
    if (!selectedSku) return [];
    const deptKey = `${selectedSku.division}|||${selectedSku.section}|||${selectedSku.department}`;
    const allDeptSkus = deptSkus[deptKey] || [];
    return allDeptSkus.filter((s) => s.barcode !== selectedSku.barcode).slice(0, 6);
  }, [selectedSku, deptSkus]);

  // Flat dimension helpers
  const getDimensionName = (item: GmroiItem) => {
    if (groupBy === "store") return item.store_name || `Store #${item.admsite_code}`;
    if (groupBy === "department") return formatDisplayValue(item.department);
    if (groupBy === "vendor") return formatDisplayValue(item.vendor_name);
    return `${formatDisplayValue(item.item_name)} (${item.barcode || "N/A"})`;
  };

  const handleFlatRowClick = (item: GmroiItem) => {
    if (groupBy === "sku" && item.barcode) {
      const converted: SkuVelocityItem = {
        barcode: item.barcode,
        description: item.item_name || "",
        division: item.division || "Merchandise",
        section: "General Section",
        department: item.department || "General Department",
        vendor: item.vendor_name || "UNKNOWN",
        mrp: 0,
        cost_rate: 0,
        net_revenue: item.total_revenue,
        sales_units: 0,
        gross_profit: item.total_gross_profit,
        closing_stock_units: 0,
        closing_stock_value: item.avg_inventory_value,
        sell_through_pct: 0,
        woc: 0,
        moi: 0,
        velocity_status: item.gmroi_ratio > 2.5 ? "FAST_MOVER" : item.gmroi_ratio >= 1.2 ? "MEDIUM_MOVER" : "SLOW_MOVER",
      };
      setSelectedSku(converted);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>⚖️</span>
            <span>Capital Efficiency &amp; Product Profitability (GMROI)</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Gross Margin Return on Investment (Gross Profit ÷ Average Working Capital Inventory Value)
          </p>
        </div>

        {/* View Mode Toggle & CSV Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <ExportCsvButton
            columns={[
              { key: "dimension", header: "Dimension" },
              { key: "total_revenue", header: "Revenue" },
              { key: "total_gross_profit", header: "Gross Profit" },
              { key: "avg_inventory_value", header: "Avg Inventory" },
              { key: "gmroi_ratio", header: "GMROI" },
            ]}
            rows={
              viewMode === "flat"
                ? data.map((item) => ({
                    dimension: getDimensionName(item),
                    total_revenue: item.total_revenue,
                    total_gross_profit: item.total_gross_profit,
                    avg_inventory_value: item.avg_inventory_value,
                    gmroi_ratio: item.gmroi_ratio,
                  }))
                : groupedData.map((d) => ({
                    dimension: d.divisionName,
                    total_revenue: d.net_revenue,
                    total_gross_profit: d.gross_profit,
                    avg_inventory_value: d.closing_stock_value,
                    gmroi_ratio: d.gmroi_ratio,
                  }))
            }
            filenameParts={["GMROI", viewMode, groupBy]}
          />

          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "tree"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              📂 Category &amp; Division View
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "flat"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              📋 Category Rankings
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: HIERARCHY DRILL-DOWN TREE */}
      {viewMode === "tree" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Category &amp; Division:
              </span>
              <span className="text-gray-400">
                Division › Section › Department › Product Line › Products
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {hierarchyLoading ? (
              <div className="p-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <span>Loading GMROI category hierarchy...</span>
              </div>
            ) : groupedData.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No category records found matching current filters.
              </div>
            ) : (
              groupedData.map((div) => {
                const isDivExpanded = !!expandedDivisions[div.divisionName];
                const divGmroi = computeGmroi(div.gross_profit, div.closing_stock_value);

                return (
                  <div key={div.divisionName} className="group/div">
                    {/* LEVEL 1: DIVISION */}
                    <div
                      onClick={() => toggleDivision(div.divisionName)}
                      className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/70 dark:hover:bg-gray-800 cursor-pointer select-none transition-colors border-l-4 border-l-brand-500"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs font-bold w-4 flex-shrink-0">
                          {isDivExpanded ? "▼" : "▶"}
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                          DIV
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {div.divisionName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ({Object.keys(div.sections).length} Sections)
                        </span>
                      </div>

                      <div className="flex items-center gap-5 text-xs text-right">
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase block">Gross Profit</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(div.gross_profit)}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-[9px] text-gray-400 uppercase block">Capital Tied Up</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {formatCurrency(div.closing_stock_value)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase block">GMROI Ratio</span>
                          <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                            {divGmroi.ratio >= 99 ? "99x+" : `${divGmroi.ratio.toFixed(2)}x`}
                          </span>
                        </div>
                        <div className="hidden md:block">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${divGmroi.badgeClass}`}>
                            {divGmroi.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LEVEL 2: SECTION */}
                    {isDivExpanded && Object.values(div.sections).map((sec) => {
                      const secKey = `${div.divisionName}|||${sec.sectionName}`;
                      const isSecExpanded = !!expandedSections[secKey];
                      const secGmroi = computeGmroi(sec.gross_profit, sec.closing_stock_value);

                      return (
                        <div key={secKey} className="pl-5 border-l-2 border-brand-200 dark:border-brand-900/40">
                          <div
                            onClick={() => toggleSection(secKey)}
                            className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/40 cursor-pointer select-none transition-colors border-l-2 border-l-indigo-400"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-gray-400 text-xs font-bold w-4 flex-shrink-0">
                                {isSecExpanded ? "▼" : "▶"}
                              </span>
                              <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                SEC
                              </span>
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                {sec.sectionName}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                ({sec.departments.length} Departments)
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-right">
                              <div>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatCurrency(sec.gross_profit)} GP
                                </span>
                              </div>
                              <div className="hidden sm:block">
                                <span className="text-gray-500">
                                  {formatCurrency(sec.closing_stock_value)} Inv
                                </span>
                              </div>
                              <div>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {secGmroi.ratio >= 99 ? "99x+" : `${secGmroi.ratio.toFixed(2)}x`} GMROI
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* LEVEL 3: DEPARTMENT */}
                          {isSecExpanded && sec.departments.map((dept) => {
                            const deptKey = `${div.divisionName}|||${sec.sectionName}|||${dept.department}`;
                            const isDeptExpanded = !!expandedDepts[deptKey];
                            const deptSkuList = deptSkus[deptKey] || [];
                            const isDeptLoading = !!deptSkusLoading[deptKey];
                            const deptGmroi = computeGmroi(dept.gross_profit, dept.closing_stock_value);

                            return (
                              <div key={deptKey} className="pl-5 border-l-2 border-indigo-200 dark:border-indigo-900/40">
                                <div
                                  onClick={() => toggleDept(deptKey, div.divisionName, sec.sectionName, dept.department)}
                                  className="flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-800/20 dark:hover:bg-gray-800/50 cursor-pointer select-none transition-colors border-l-2 border-l-teal-400"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs font-bold w-4 flex-shrink-0">
                                      {isDeptLoading ? "⟳" : isDeptExpanded ? "▼" : "▶"}
                                    </span>
                                    <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                                      DEPT
                                    </span>
                                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                      {dept.department}
                                    </span>
                                    {isDeptExpanded && deptSkuList.length > 0 && (
                                      <span className="text-[10px] text-gray-400">({deptSkuList.length} SKUs)</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      {formatCurrency(dept.gross_profit)} GP
                                    </span>
                                    <span className="text-gray-500 hidden sm:block">
                                      {formatCurrency(dept.closing_stock_value)} Inv
                                    </span>
                                    <span className="font-extrabold text-teal-600 dark:text-teal-400">
                                      {deptGmroi.ratio >= 99 ? "99x+" : `${deptGmroi.ratio.toFixed(2)}x`} GMROI
                                    </span>
                                    {!isDeptExpanded && (
                                      <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 opacity-60 hover:opacity-100">
                                        View Products →
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* LEVEL 4+: CATEGORY 1-6 GROUPS → END BARCODES */}
                                {isDeptExpanded && (
                                  <div className="pl-5 border-l-2 border-teal-200 dark:border-teal-900/40">
                                    {isDeptLoading ? (
                                      <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                                        <span className="animate-spin">⟳</span>
                                        <span>Loading SKU financial GMROI details for {dept.department}...</span>
                                      </div>
                                    ) : deptSkuList.length === 0 ? (
                                      <div className="p-4 text-xs text-gray-400">No SKU records found for this department.</div>
                                    ) : (
                                      <GmroiDepartmentDrilldown
                                        skus={deptSkuList}
                                        onSelectSku={setSelectedSku}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: FLAT RANKING TABLE */}
      {viewMode === "flat" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Ranked by GMROI ratio descending across dimension aggregations.
            </span>

            {/* Dimension Selection Pills */}
            <div className="flex items-center p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
              {(["store", "department", "vendor", "sku"] as const).map((dim) => (
                <button
                  key={dim}
                  onClick={() => setGroupBy(dim)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all uppercase ${
                    groupBy === dim
                      ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  By {dim}
                </button>
              ))}
            </div>
          </div>

          {flatLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-8 dark:border-gray-800 dark:bg-gray-900/20 text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                No GMROI records found
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                No inventory or sales data found matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Category / Group Name</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-right">Avg Inventory Value</th>
                    <th className="px-4 py-3 text-center">GMROI Ratio</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    {groupBy === "sku" && <th className="px-4 py-3 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.map((item, idx) => {
                    const gmroi = computeGmroi(item.total_gross_profit, item.avg_inventory_value);
                    return (
                      <tr
                        key={idx}
                        onClick={() => handleFlatRowClick(item)}
                        className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.02] ${groupBy === "sku" ? "cursor-pointer" : ""}`}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {getDimensionName(item)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(item.total_revenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(item.total_gross_profit)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(item.avg_inventory_value)}
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold text-gray-900 dark:text-white">
                          {item.gmroi_ratio.toFixed(2)}x
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${gmroi.badgeClass}`}>
                            {gmroi.label}
                          </span>
                        </td>
                        {groupBy === "sku" && (
                          <td className="px-4 py-3 text-center text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                            Details →
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MULTI-TIER SKU DETAIL DRAWER MODAL */}
      {selectedSku && (
        <GmroiSkuDrawer
          sku={selectedSku}
          relatableSkus={relatableSkus}
          onClose={() => setSelectedSku(null)}
          onSelectSku={setSelectedSku}
        />
      )}
    </div>
  );
}

// ─── Sub-Component: Department SKU Drill-Down with GMROI & Category 1 Grouping ─

function GmroiDepartmentDrilldown({
  skus,
  onSelectSku,
}: {
  skus: SkuVelocityItem[];
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const [expandedCat1, setExpandedCat1] = useState<Record<string, boolean>>({});

  const cat1Groups = useMemo(() => {
    const groups = new Map<string, SkuVelocityItem[]>();
    for (const sku of skus) {
      const cat1 = sku.category1?.trim() || "General";
      if (!groups.has(cat1)) groups.set(cat1, []);
      groups.get(cat1)!.push(sku);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const gpA = a[1].reduce((s, x) => s + x.gross_profit, 0);
      const gpB = b[1].reduce((s, x) => s + x.gross_profit, 0);
      return gpB - gpA;
    });
  }, [skus]);

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
      {cat1Groups.map(([cat1Name, cat1Skus]) => {
        const isExpanded = !!expandedCat1[cat1Name];
        const cat1GP = cat1Skus.reduce((s, x) => s + x.gross_profit, 0);
        const cat1Stock = cat1Skus.reduce((s, x) => s + x.closing_stock_value, 0);
        const cat1Gmroi = computeGmroi(cat1GP, cat1Stock);

        return (
          <div key={cat1Name}>
            {/* Level 4: Category 1 (Product Line) */}
            <div
              onClick={() => setExpandedCat1((prev) => ({ ...prev, [cat1Name]: !prev[cat1Name] }))}
              className="flex items-center justify-between px-3 py-2 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer select-none transition-colors border-l-2 border-l-amber-400"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[10px] font-bold w-3">{isExpanded ? "▼" : "▶"}</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  CAT1
                </span>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{cat1Name}</span>
                <span className="text-[10px] text-gray-400">({cat1Skus.length} barcodes)</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(cat1GP)} GP</span>
                <span className="text-gray-500 hidden sm:block">{formatCurrency(cat1Stock)} Inv</span>
                <span className="text-amber-700 dark:text-amber-300 font-extrabold">{cat1Gmroi.ratio >= 99 ? "99x+" : `${cat1Gmroi.ratio.toFixed(2)}x`} GMROI</span>
              </div>
            </div>

            {/* Level 5+: End Barcodes (grouped by Category 2 if multiple) */}
            {isExpanded && (
              <GmroiBarcodeList skus={cat1Skus} onSelectSku={onSelectSku} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GmroiBarcodeList({
  skus,
  onSelectSku,
}: {
  skus: SkuVelocityItem[];
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const cat2Groups = useMemo(() => {
    const groups = new Map<string, SkuVelocityItem[]>();
    for (const sku of skus) {
      const cat2 = sku.category2?.trim() || "__FLAT__";
      if (!groups.has(cat2)) groups.set(cat2, []);
      groups.get(cat2)!.push(sku);
    }
    return groups;
  }, [skus]);

  const hasMultipleCat2 = cat2Groups.size > 1 && !cat2Groups.has("__FLAT__");

  if (!hasMultipleCat2) {
    return (
      <div className="pl-4 bg-gray-50/30 dark:bg-gray-900/40 divide-y divide-gray-100 dark:divide-gray-800/40">
        {skus.map((sku) => (
          <GmroiBarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
        ))}
      </div>
    );
  }

  return (
    <div className="pl-4 divide-y divide-gray-100 dark:divide-gray-800/40">
      {Array.from(cat2Groups.entries()).map(([cat2Name, cat2Skus]) => (
        <GmroiCat2Group key={cat2Name} cat2Name={cat2Name} skus={cat2Skus} onSelectSku={onSelectSku} />
      ))}
    </div>
  );
}

function GmroiCat2Group({
  cat2Name,
  skus,
  onSelectSku,
}: {
  cat2Name: string;
  skus: SkuVelocityItem[];
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const gp = skus.reduce((s, x) => s + x.gross_profit, 0);
  const inv = skus.reduce((s, x) => s + x.closing_stock_value, 0);
  const gmroi = computeGmroi(gp, inv);

  return (
    <div>
      <div
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer select-none transition-colors border-l-2 border-l-purple-400"
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-400 font-bold w-3">{expanded ? "▼" : "▶"}</span>
          <span className="px-1 py-0.5 text-[8px] uppercase font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            CAT2
          </span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat2Name === "__FLAT__" ? "General" : cat2Name}</span>
          <span className="text-[9px] text-gray-400">({skus.length})</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(gp)} GP</span>
          <span className="text-purple-700 dark:text-purple-300 font-bold">{gmroi.ratio >= 99 ? "99x+" : `${gmroi.ratio.toFixed(2)}x`} GMROI</span>
        </div>
      </div>
      {expanded && (
        <div className="pl-4 bg-gray-50/20 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800/40">
          {skus.map((sku) => (
            <GmroiBarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
          ))}
        </div>
      )}
    </div>
  );
}

function GmroiBarcodeRow({ sku, onSelectSku }: { sku: SkuVelocityItem; onSelectSku: (sku: SkuVelocityItem) => void }) {
  const gmroi = computeGmroi(sku.gross_profit, sku.closing_stock_value);

  return (
    <div
      onClick={() => onSelectSku(sku)}
      className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 cursor-pointer transition-colors group/barcode"
    >
      <div className="flex items-center gap-2">
        <span className="text-brand-500 text-xs">↳</span>
        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-900 group-hover/barcode:border-brand-500 transition-colors">
          {sku.barcode}
        </span>
        <span className="text-xs font-medium text-gray-900 dark:text-white max-w-xs truncate" title={sku.description}>
          {formatDisplayValue(sku.description)}
        </span>
        {sku.category3 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hidden lg:inline">
            {sku.category3}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs mt-1 sm:mt-0 flex-shrink-0">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(sku.gross_profit)} GP</span>
        <span className="text-gray-500">{formatCurrency(sku.closing_stock_value)} Inv</span>
        <span className="font-extrabold text-brand-600 dark:text-brand-400">
          {gmroi.ratio >= 99 ? "99x+" : `${gmroi.ratio.toFixed(2)}x`}
        </span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${gmroi.badgeClass}`}>
          {gmroi.label}
        </span>
        <span className="text-[9px] font-semibold text-brand-500 group-hover/barcode:underline hidden sm:block">Details →</span>
      </div>
    </div>
  );
}

// ─── Sub-Component: Full Multi-Tier SKU Detail Drawer with GMROI Metrics ────────

function GmroiSkuDrawer({
  sku,
  relatableSkus,
  onClose,
  onSelectSku,
}: {
  sku: SkuVelocityItem;
  relatableSkus: SkuVelocityItem[];
  onClose: () => void;
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const gmroi = computeGmroi(sku.gross_profit, sku.closing_stock_value);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Breadcrumb */}
        <div className="space-y-2 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-md">
                Financial GMROI SKU Analysis
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${gmroi.badgeClass}`}>
                {gmroi.ratio.toFixed(2)}x {gmroi.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Breadcrumb Trail */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-brand-600 dark:text-brand-400">{sku.division || "Division"}</span>
            <span>›</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{sku.section || "Section"}</span>
            <span>›</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{sku.department || "Department"}</span>
            {sku.category1 && <><span>›</span><span className="text-gray-500">{sku.category1}</span></>}
            {sku.category2 && <><span>›</span><span className="text-gray-500">{sku.category2}</span></>}
            {sku.category3 && <><span>›</span><span className="text-gray-500">{sku.category3}</span></>}
            <span>›</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {sku.barcode}
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="font-mono text-brand-600 dark:text-brand-400">{sku.barcode}</span>
            <span className="text-gray-400">—</span>
            <span className="text-sm font-semibold">{sku.description || "SKU Item"}</span>
          </h3>
        </div>

        {/* FINANCIAL CAPITAL & GMROI PERFORMANCE KPIS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>⚖️</span>
            <span>Financial Return &amp; Inventory Capital Efficiency</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/20">
              <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block">GMROI Ratio</span>
              <p className="font-extrabold text-xl mt-0.5 text-brand-700 dark:text-brand-300">
                {gmroi.ratio >= 99 ? "99x+" : `${gmroi.ratio.toFixed(2)}x`}
              </p>
              <span className="text-[10px] text-gray-500">{gmroi.label}</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Gross Profit</span>
              <p className="font-bold text-base mt-0.5 text-emerald-600 dark:text-emerald-400">
                {formatCurrency(sku.gross_profit)}
              </p>
              <span className="text-[10px] text-gray-500">Margin: {sku.net_revenue > 0 ? ((sku.gross_profit / sku.net_revenue) * 100).toFixed(1) : 0}%</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Capital In Stock</span>
              <p className="font-bold text-base mt-0.5 text-gray-900 dark:text-white">
                {formatCurrency(sku.closing_stock_value)}
              </p>
              <span className="text-[10px] text-gray-500">{sku.closing_stock_units.toLocaleString()} units holding</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Velocity &amp; Cover</span>
              <p className="font-bold text-base mt-0.5 text-gray-900 dark:text-white">
                {sku.sell_through_pct.toFixed(1)}% ST
              </p>
              <span className="text-[10px] text-gray-500">WOC: {sku.woc >= 999 ? "999+" : sku.woc.toFixed(1)} wks</span>
            </div>
          </div>
        </div>

        {/* CATEGORY LINEAGE TREE */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>📂</span>
            <span>Category &amp; Division Lineage</span>
          </h4>

          <div className="relative pl-6 space-y-3 border-l-2 border-brand-500/40 dark:border-brand-500/30 ml-3 py-1">
            {/* L1: Division */}
            <HierarchyLevel level={1} label="Division" color="brand" value={formatDisplayValueStr(sku.division)} />
            {/* L2: Section */}
            <HierarchyLevel level={2} label="Section" color="indigo" value={formatDisplayValueStr(sku.section)} />
            {/* L3: Department */}
            <HierarchyLevel level={3} label="Department" color="teal" value={formatDisplayValueStr(sku.department)} />

            {/* L4-9: Category 1-6 attributes */}
            {(sku.category1 || sku.category2 || sku.category3 || sku.category4 || sku.category5 || sku.category6) && (
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-white dark:border-gray-900 shadow-xs" />
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Product Attributes &amp; Details
                    </span>
                    <span className="text-[10px] text-gray-400">Classifications</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    {sku.category1 && <CatAttr label="Category 1 (Product Line)" value={sku.category1} />}
                    {sku.category2 && <CatAttr label="Category 2 (Brand / Range)" value={sku.category2} />}
                    {sku.category3 && <CatAttr label="Category 3 (Form / Type)" value={sku.category3} />}
                    {sku.category4 && <CatAttr label="Category 4 (Pack / Spec)" value={sku.category4} />}
                    {sku.category5 && <CatAttr label="Category 5 (Size)" value={sku.category5} />}
                    {sku.category6 && <CatAttr label="Category 6 (Season / Year)" value={sku.category6} />}
                  </div>
                </div>
              </div>
            )}

            {/* End Barcode Target */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-gray-900 shadow-xs ring-4 ring-emerald-500/20" />
              <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>Product Details &amp; Barcode</span>
                  </span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{sku.barcode}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Vendor</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate block">{formatDisplayValueStr(sku.vendor)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Colour</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatDisplayValueStr(sku.colour) === "Others" ? "—" : formatDisplayValueStr(sku.colour)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Style Code</span>
                    <span className="font-semibold text-gray-900 dark:text-white font-mono">{formatDisplayValueStr(sku.style_code) === "Others" ? "—" : formatDisplayValueStr(sku.style_code)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">MRP / Cost</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{sku.mrp} / ₹{sku.cost_rate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RELATABLE SKUS IN SAME DEPARTMENT */}
        {relatableSkus.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span>🔗</span>
              <span>Relatable SKUs in {sku.department || sku.section}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {relatableSkus.map((rel) => {
                const relGmroi = computeGmroi(rel.gross_profit, rel.closing_stock_value);
                return (
                  <button
                    key={rel.barcode}
                    onClick={() => onSelectSku(rel)}
                    className="text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all group/rel"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{rel.barcode}</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(rel.gross_profit)} GP</span>
                    </div>
                    <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5 group-hover/rel:text-brand-600 transition-colors">
                      {rel.description}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[9px] text-gray-400">{rel.department}</span>
                      <span className="text-[9px] text-brand-600 dark:text-brand-400 font-extrabold">
                        {relGmroi.ratio >= 99 ? "99x+" : `${relGmroi.ratio.toFixed(1)}x`} GMROI
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tiny Hierarchy Helper Components ──────────────────────────────────────────

const LEVEL_COLORS: Record<number, { dot: string; border: string; label: string }> = {
  1: { dot: "bg-brand-500", border: "border-gray-200/70 dark:border-gray-700/60", label: "text-brand-600 dark:text-brand-400" },
  2: { dot: "bg-indigo-500", border: "border-gray-200/70 dark:border-gray-700/60", label: "text-indigo-600 dark:text-indigo-400" },
  3: { dot: "bg-teal-500", border: "border-gray-200/70 dark:border-gray-700/60", label: "text-teal-600 dark:text-teal-400" },
};

function HierarchyLevel({ level, label, color, value }: { level: number; label: string; color: string; value: string }) {
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  return (
    <div className="relative">
      <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ${colors.dot} border-4 border-white dark:border-gray-900 shadow-xs`} />
      <div className={`bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border ${colors.border}`}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.label}`}>
            Level {level} • {label}
          </span>
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function CatAttr({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <span className="text-[9px] uppercase font-bold text-gray-400 block">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white text-xs">{value}</span>
    </div>
  );
}
