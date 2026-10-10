"use client";

import React, { useState, useMemo, useCallback } from "react";
import { StoreStockCoverItem } from "@/hooks/useAllocationData";
import { useCategoryData, CategoryHierarchyItem, SkuVelocityItem } from "@/hooks/useCategoryData";
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

function computeStockHealth(woc: number): { label: string; badgeClass: string } {
  if (woc >= 999 || woc > 26) {
    return {
      label: "Overstocked",
      badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    };
  } else if (woc <= 4) {
    return {
      label: "Stockout Risk",
      badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    };
  } else {
    return {
      label: "Balanced",
      badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
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
  sections: Record<string, GroupedSection>;
};

export function StoreStockCoverTable({
  items,
  loading: flatLoading,
}: {
  items: StoreStockCoverItem[];
  loading: boolean;
}) {
  const { hierarchy, loading: hierarchyLoading, fetchDepartmentSkus } = useCategoryData();

  // View Mode: Tree (Allocation Drill-Down) vs Flat (Store Position Matrix)
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");

  // Flat table filters
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Tree expansion state
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // On-demand SKU drilldown state
  const [deptSkus, setDeptSkus] = useState<Record<string, SkuVelocityItem[]>>({});
  const [deptSkusLoading, setDeptSkusLoading] = useState<Record<string, boolean>>({});

  // Selected SKU for drawer
  const [selectedSku, setSelectedSku] = useState<SkuVelocityItem | null>(null);

  // Group hierarchy data
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
      div.woc = (div.sales_units / 12.0) > 0 ? Number((div.closing_stock_units / (div.sales_units / 12.0)).toFixed(1)) : 999;
      const divTotalUnits = div.sales_units + div.closing_stock_units;
      div.sell_through_pct = divTotalUnits > 0 ? Number(((div.sales_units / divTotalUnits) * 100).toFixed(1)) : 0;

      Object.values(div.sections).forEach((sec) => {
        sec.woc = (sec.sales_units / 12.0) > 0 ? Number((sec.closing_stock_units / (sec.sales_units / 12.0)).toFixed(1)) : 999;
        const secTotalUnits = sec.sales_units + sec.closing_stock_units;
        sec.sell_through_pct = secTotalUnits > 0 ? Number(((sec.sales_units / secTotalUnits) * 100).toFixed(1)) : 0;
      });
    });

    return Object.values(divs).sort((a, b) => b.closing_stock_value - a.closing_stock_value);
  }, [hierarchy]);

  // Tree toggles
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

  // Filter flat items
  const filteredItems = items.filter((i) => {
    if (filterStatus === "ALL") return true;
    return i.stock_health_status === filterStatus;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs space-y-6">
      {/* Table Toolbar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📦</span>
            <span>Store Stock Cover &amp; Inventory Allocation Matrix</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Outlet stock positions, Weeks of Cover (WOC), and stockout risk classifications across categories
          </p>
        </div>

        {/* View Mode Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <ExportCsvButton
            columns={[
              { key: "dimension", header: "Category / Outlet" },
              { key: "sales_units", header: "Sales Units" },
              { key: "revenue", header: "Revenue" },
              { key: "stock_units", header: "Stock Units" },
              { key: "stock_value", header: "Stock Value" },
              { key: "woc", header: "WOC" },
            ]}
            rows={
              viewMode === "flat"
                ? filteredItems.map((item) => ({
                    dimension: `${item.store_name} - ${item.department}`,
                    sales_units: item.sales_units,
                    revenue: item.revenue,
                    stock_units: item.stock_units,
                    stock_value: item.stock_value,
                    woc: item.store_woc,
                  }))
                : groupedData.map((d) => ({
                    dimension: d.divisionName,
                    sales_units: d.sales_units,
                    revenue: d.net_revenue,
                    stock_units: d.closing_stock_units,
                    stock_value: d.closing_stock_value,
                    woc: d.woc,
                  }))
            }
            filenameParts={["StoreAllocation", viewMode]}
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
              🏪 Outlet Position View
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: CATEGORY ALLOCATION HIERARCHY DRILL-DOWN */}
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
                <span>Loading store allocation hierarchy...</span>
              </div>
            ) : groupedData.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No allocation inventory records found matching current outlet filters.
              </div>
            ) : (
              groupedData.map((div) => {
                const isDivExpanded = !!expandedDivisions[div.divisionName];
                const health = computeStockHealth(div.woc);

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
                          <span className="text-[9px] text-gray-400 uppercase block">Stock Value</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(div.closing_stock_value)}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-[9px] text-gray-400 uppercase block">Stock Units</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {div.closing_stock_units.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase block">Stock Cover (WOC)</span>
                          <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                            {div.woc >= 999 ? "999+" : `${div.woc} Wks`}
                          </span>
                        </div>
                        <div className="hidden md:block">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${health.badgeClass}`}>
                            {health.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LEVEL 2: SECTION */}
                    {isDivExpanded && Object.values(div.sections).map((sec) => {
                      const secKey = `${div.divisionName}|||${sec.sectionName}`;
                      const isSecExpanded = !!expandedSections[secKey];
                      const secHealth = computeStockHealth(sec.woc);

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
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(sec.closing_stock_value)} Stock
                                </span>
                              </div>
                              <div className="hidden sm:block">
                                <span className="text-gray-500">
                                  {sec.closing_stock_units.toLocaleString()} units
                                </span>
                              </div>
                              <div>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {sec.woc >= 999 ? "999+" : `${sec.woc} Wks`} Cover
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
                            const deptHealth = computeStockHealth(dept.woc);

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
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {formatCurrency(dept.closing_stock_value)} Stock
                                    </span>
                                    <span className="text-gray-500 hidden sm:block">
                                      {dept.closing_stock_units.toLocaleString()} units
                                    </span>
                                    <span className="font-extrabold text-teal-600 dark:text-teal-400">
                                      {dept.woc >= 999 ? "999+" : `${dept.woc} Wks`}
                                    </span>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${deptHealth.badgeClass}`}>
                                      {deptHealth.label}
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
                                        <span>Loading SKU allocation and stock cover for {dept.department}...</span>
                                      </div>
                                    ) : deptSkuList.length === 0 ? (
                                      <div className="p-4 text-xs text-gray-400">No SKU records found for this department.</div>
                                    ) : (
                                      <AllocationDepartmentDrilldown
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

      {/* VIEW 2: FLAT OUTLET STOCK POSITION MATRIX */}
      {viewMode === "flat" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Filtered outlet stock positions, weeks of cover, and transfer balances.
            </span>

            {/* Health Filter Pills */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterStatus === "ALL"
                    ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                All Outlets
              </button>
              <button
                onClick={() => setFilterStatus("NEGATIVE_TRANSFER_LAG")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterStatus === "NEGATIVE_TRANSFER_LAG"
                    ? "bg-white text-purple-600 shadow-xs dark:bg-gray-700 dark:text-purple-400"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Pending Transfer Lag
              </button>
              <button
                onClick={() => setFilterStatus("HIGH_RISK_STOCKOUT")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterStatus === "HIGH_RISK_STOCKOUT"
                    ? "bg-white text-rose-600 shadow-xs dark:bg-gray-700 dark:text-rose-400"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                High Risk Stockout
              </button>
              <button
                onClick={() => setFilterStatus("OVERSTOCKED")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterStatus === "OVERSTOCKED"
                    ? "bg-white text-amber-600 shadow-xs dark:bg-gray-700 dark:text-amber-400"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Overstocked
              </button>
            </div>
          </div>

          {flatLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Store Outlet</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Sales Units</th>
                    <th className="py-3 px-4">Revenue</th>
                    <th className="py-3 px-4">Stock Units</th>
                    <th className="py-3 px-4">Stock Value</th>
                    <th className="py-3 px-4">Weeks of Cover</th>
                    <th className="py-3 px-4">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Store stock cover data unavailable
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Requires stock-on-hand (SOH) inventory position data.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.slice(0, 50).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                              item.site_type === "CENTRAL_WAREHOUSE"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {item.site_type === "CENTRAL_WAREHOUSE" ? "DC" : "STORE"}
                          </span>
                          {formatDisplayValue(item.store_name)}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">
                          {formatDisplayValue(item.department)}
                        </td>
                        <td className="py-3 px-4 font-medium">{item.sales_units.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className={`py-3 px-4 font-semibold ${item.stock_units < 0 ? "text-purple-600 dark:text-purple-400" : ""}`}>
                          {item.stock_units.toLocaleString()} {item.stock_units < 0 ? "(Pending Lag)" : ""}
                        </td>
                        <td className="py-3 px-4">{formatCurrency(item.stock_value)}</td>
                        <td className="py-3 px-4 font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.store_woc <= 2.5
                                ? "text-rose-600 dark:text-rose-400"
                                : item.store_woc <= 8
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {item.store_woc} Wks
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.stock_health_status === "NEGATIVE_TRANSFER_LAG"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                                : item.stock_health_status === "HIGH_RISK_STOCKOUT"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                                : item.stock_health_status === "OVERSTOCKED"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                            }`}
                          >
                            {item.stock_health_status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MULTI-TIER SKU DETAIL DRAWER MODAL */}
      {selectedSku && (
        <AllocationSkuDrawer
          sku={selectedSku}
          relatableSkus={relatableSkus}
          onClose={() => setSelectedSku(null)}
          onSelectSku={setSelectedSku}
        />
      )}
    </div>
  );
}

// ─── Sub-Component: Department SKU Drill-Down with Category 1 Grouping ────────

function AllocationDepartmentDrilldown({
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
      const stockA = a[1].reduce((s, x) => s + x.closing_stock_value, 0);
      const stockB = b[1].reduce((s, x) => s + x.closing_stock_value, 0);
      return stockB - stockA;
    });
  }, [skus]);

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
      {cat1Groups.map(([cat1Name, cat1Skus]) => {
        const isExpanded = !!expandedCat1[cat1Name];
        const cat1Units = cat1Skus.reduce((s, x) => s + x.closing_stock_units, 0);
        const cat1Stock = cat1Skus.reduce((s, x) => s + x.closing_stock_value, 0);
        const cat1Sales = cat1Skus.reduce((s, x) => s + x.sales_units, 0);
        const cat1Woc = (cat1Sales / 12.0) > 0 ? Number((cat1Units / (cat1Sales / 12.0)).toFixed(1)) : 999;
        const health = computeStockHealth(cat1Woc);

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
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(cat1Stock)} Stock</span>
                <span className="text-gray-500 hidden sm:block">{cat1Units.toLocaleString()} units</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">{cat1Woc >= 999 ? "999+" : `${cat1Woc} Wks`}</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${health.badgeClass}`}>
                  {health.label}
                </span>
              </div>
            </div>

            {/* Level 5+: End Barcodes (grouped by Category 2 if multiple) */}
            {isExpanded && (
              <AllocationBarcodeList skus={cat1Skus} onSelectSku={onSelectSku} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AllocationBarcodeList({
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
          <AllocationBarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
        ))}
      </div>
    );
  }

  return (
    <div className="pl-4 divide-y divide-gray-100 dark:divide-gray-800/40">
      {Array.from(cat2Groups.entries()).map(([cat2Name, cat2Skus]) => (
        <AllocationCat2Group key={cat2Name} cat2Name={cat2Name} skus={cat2Skus} onSelectSku={onSelectSku} />
      ))}
    </div>
  );
}

function AllocationCat2Group({
  cat2Name,
  skus,
  onSelectSku,
}: {
  cat2Name: string;
  skus: SkuVelocityItem[];
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const stock = skus.reduce((s, x) => s + x.closing_stock_value, 0);
  const units = skus.reduce((s, x) => s + x.closing_stock_units, 0);

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
          <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(stock)} Stock</span>
          <span className="text-gray-500">{units.toLocaleString()} units</span>
        </div>
      </div>
      {expanded && (
        <div className="pl-4 bg-gray-50/20 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800/40">
          {skus.map((sku) => (
            <AllocationBarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
          ))}
        </div>
      )}
    </div>
  );
}

function AllocationBarcodeRow({ sku, onSelectSku }: { sku: SkuVelocityItem; onSelectSku: (sku: SkuVelocityItem) => void }) {
  const health = computeStockHealth(sku.woc);

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
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(sku.closing_stock_value)}</span>
        <span className="text-gray-500">{sku.closing_stock_units.toLocaleString()} units</span>
        <span className="font-extrabold text-brand-600 dark:text-brand-400">
          {sku.woc >= 999 ? "999+" : `${sku.woc.toFixed(1)} Wks`}
        </span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${health.badgeClass}`}>
          {health.label}
        </span>
        <span className="text-[9px] font-semibold text-brand-500 group-hover/barcode:underline hidden sm:block">Details →</span>
      </div>
    </div>
  );
}

// ─── Sub-Component: Full Multi-Tier SKU Detail Drawer for Store Allocation ─────

function AllocationSkuDrawer({
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
  const health = computeStockHealth(sku.woc);

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
                Store Inventory &amp; Allocation Detail
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${health.badgeClass}`}>
                {health.label} (WOC: {sku.woc >= 999 ? "999+" : `${sku.woc.toFixed(1)} Wks`})
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

        {/* STORE ALLOCATION & INVENTORY POSITION KPIS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>📦</span>
            <span>Inventory Position &amp; Coverage Metrics</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/20">
              <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block">Weeks of Cover</span>
              <p className="font-extrabold text-xl mt-0.5 text-brand-700 dark:text-brand-300">
                {sku.woc >= 999 ? "999+" : `${sku.woc.toFixed(1)} wks`}
              </p>
              <span className="text-[10px] text-gray-500">{health.label}</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Stock In Outlet</span>
              <p className="font-bold text-base mt-0.5 text-gray-900 dark:text-white">
                {formatCurrency(sku.closing_stock_value)}
              </p>
              <span className="text-[10px] text-gray-500">{sku.closing_stock_units.toLocaleString()} units on hand</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Sales Run Rate</span>
              <p className="font-bold text-base mt-0.5 text-emerald-600 dark:text-emerald-400">
                {sku.sales_units.toLocaleString()} units
              </p>
              <span className="text-[10px] text-gray-500">Revenue: {formatCurrency(sku.net_revenue)}</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Sell-Through Rate</span>
              <p className="font-bold text-base mt-0.5 text-brand-600 dark:text-brand-400">
                {sku.sell_through_pct.toFixed(1)}%
              </p>
              <span className="text-[10px] text-gray-500">Velocity: {sku.velocity_status.replace(/_/g, " ")}</span>
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
                const relHealth = computeStockHealth(rel.woc);
                return (
                  <button
                    key={rel.barcode}
                    onClick={() => onSelectSku(rel)}
                    className="text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all group/rel"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{rel.barcode}</span>
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{formatCurrency(rel.closing_stock_value)}</span>
                    </div>
                    <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5 group-hover/rel:text-brand-600 transition-colors">
                      {rel.description}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[9px] text-gray-400">{rel.department}</span>
                      <span className="text-[9px] text-brand-600 dark:text-brand-400 font-extrabold">
                        {rel.woc >= 999 ? "999+" : `${rel.woc.toFixed(0)} wks`}
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
