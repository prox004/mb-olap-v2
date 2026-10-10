"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ColourPerformanceItem } from "@/hooks/useColourData";
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

export function getColourHex(colourName?: string): { bg: string; border: string; text: string } {
  if (!colourName) return { bg: "#94A3B8", border: "#CBD5E1", text: "#475569" };
  const col = colourName.toUpperCase().trim();
  if (col.includes("WHITE") || col.includes("OFF WHITE")) return { bg: "#FFFFFF", border: "#CBD5E1", text: "#0F172A" };
  if (col.includes("BLACK")) return { bg: "#0F172A", border: "#334155", text: "#FFFFFF" };
  if (col.includes("NAVY") || col.includes("DARK BLUE")) return { bg: "#1E3A8A", border: "#1D4ED8", text: "#FFFFFF" };
  if (col.includes("BLUE") || col.includes("INDIGO") || col.includes("DENIM")) return { bg: "#3B82F6", border: "#2563EB", text: "#FFFFFF" };
  if (col.includes("RED") || col.includes("MAROON") || col.includes("CRIMSON") || col.includes("WINE")) return { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" };
  if (col.includes("GREEN") || col.includes("OLIVE") || col.includes("MINT")) return { bg: "#10B981", border: "#059669", text: "#FFFFFF" };
  if (col.includes("YELLOW") || col.includes("MUSTARD") || col.includes("GOLD")) return { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" };
  if (col.includes("PINK") || col.includes("MAGENTA") || col.includes("ROSE") || col.includes("FUCHSIA")) return { bg: "#EC4899", border: "#DB2777", text: "#FFFFFF" };
  if (col.includes("ORANGE") || col.includes("PEACH") || col.includes("CORAL") || col.includes("RUST")) return { bg: "#F97316", border: "#EA580C", text: "#FFFFFF" };
  if (col.includes("PURPLE") || col.includes("VIOLET") || col.includes("LAVENDER") || col.includes("LILAC")) return { bg: "#8B5CF6", border: "#7C3AED", text: "#FFFFFF" };
  if (col.includes("GREY") || col.includes("GRAY") || col.includes("CHARCOAL") || col.includes("MELANGE") || col.includes("SLATE")) return { bg: "#64748B", border: "#475569", text: "#FFFFFF" };
  if (col.includes("BEIGE") || col.includes("CREAM") || col.includes("KHAKI") || col.includes("FAWN") || col.includes("ECRU")) return { bg: "#F5F5DC", border: "#D4D4AA", text: "#44403C" };
  if (col.includes("BROWN") || col.includes("TAN") || col.includes("CHOCOLATE") || col.includes("COFFEE")) return { bg: "#78350F", border: "#92400E", text: "#FFFFFF" };
  return { bg: "#6366F1", border: "#4F46E5", text: "#FFFFFF" };
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
  sections: Record<string, GroupedSection>;
};

interface ColourMatrixTableProps {
  items: ColourPerformanceItem[];
  loading?: boolean;
}

export const ColourMatrixTable: React.FC<ColourMatrixTableProps> = ({
  items,
  loading: flatLoading = false,
}) => {
  const { hierarchy, loading: hierarchyLoading, fetchDepartmentSkus } = useCategoryData();

  // Dual View Mode: Hierarchy Drill-Down vs Flat Department Colour Matrix
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");

  // Flat table filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedColourFilter, setSelectedColourFilter] = useState<string>("ALL");

  // Tree expansion state
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // On-demand SKU drilldown state
  const [deptSkus, setDeptSkus] = useState<Record<string, SkuVelocityItem[]>>({});
  const [deptSkusLoading, setDeptSkusLoading] = useState<Record<string, boolean>>({});

  // Selected SKU for detail drawer
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
          margin_pct: 0,
          closing_stock_value: 0,
          closing_stock_units: 0,
          sell_through_pct: 0,
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
          margin_pct: 0,
          closing_stock_value: 0,
          closing_stock_units: 0,
          sell_through_pct: 0,
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
      div.margin_pct = div.net_revenue > 0 ? Number(((div.gross_profit / div.net_revenue) * 100).toFixed(1)) : 0;
      const divTotalUnits = div.sales_units + div.closing_stock_units;
      div.sell_through_pct = divTotalUnits > 0 ? Number(((div.sales_units / divTotalUnits) * 100).toFixed(1)) : 0;

      Object.values(div.sections).forEach((sec) => {
        sec.margin_pct = sec.net_revenue > 0 ? Number(((sec.gross_profit / sec.net_revenue) * 100).toFixed(1)) : 0;
        const secTotalUnits = sec.sales_units + sec.closing_stock_units;
        sec.sell_through_pct = secTotalUnits > 0 ? Number(((sec.sales_units / secTotalUnits) * 100).toFixed(1)) : 0;
      });
    });

    return Object.values(divs).sort((a, b) => b.net_revenue - a.net_revenue);
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

  // Find relatable SKUs for drawer (matching colour or department)
  const relatableSkus = useMemo(() => {
    if (!selectedSku) return [];
    const deptKey = `${selectedSku.division}|||${selectedSku.section}|||${selectedSku.department}`;
    const allDeptSkus = deptSkus[deptKey] || [];
    return allDeptSkus.filter((s) => s.barcode !== selectedSku.barcode).slice(0, 6);
  }, [selectedSku, deptSkus]);

  // Distinct colours for flat table filter
  const distinctColours = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.extracted_colour))).filter(Boolean);
  }, [items]);

  // Filter flat items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.extracted_colour || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColour =
      selectedColourFilter === "ALL" || item.extracted_colour === selectedColourFilter;
    return matchesSearch && matchesColour;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs space-y-6">
      {/* Table Toolbar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎨</span>
            <span>Colour Preferences &amp; Category Sales</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Colour attribute revenue share, gross margins, sell-through %, and product line breakdown
          </p>
        </div>

        {/* View Mode Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <ExportCsvButton
            columns={[
              { key: "dimension", header: "Category / Colour" },
              { key: "sales_units", header: "Sales Units" },
              { key: "revenue", header: "Revenue" },
              { key: "gross_profit", header: "Gross Profit" },
              { key: "margin_pct", header: "Margin %" },
              { key: "sell_through_pct", header: "Sell Through %" },
            ]}
            rows={
              viewMode === "flat"
                ? filteredItems.map((item) => ({
                    dimension: `${item.extracted_colour} - ${item.department}`,
                    sales_units: item.sales_units,
                    revenue: item.net_revenue,
                    gross_profit: item.gross_profit,
                    margin_pct: item.margin_pct,
                    sell_through_pct: item.sell_through_pct,
                  }))
                : groupedData.map((d) => ({
                    dimension: d.divisionName,
                    sales_units: d.sales_units,
                    revenue: d.net_revenue,
                    gross_profit: d.gross_profit,
                    margin_pct: d.margin_pct,
                    sell_through_pct: d.sell_through_pct,
                  }))
            }
            filenameParts={["ColourAnalytics", viewMode]}
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
              📋 Colour Matrix View
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: CATEGORY COLOUR HIERARCHY DRILL-DOWN */}
      {viewMode === "tree" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Category &amp; Division:
              </span>
              <span className="text-gray-400">
                Division › Section › Department › Product Line › Products with Colour Swatches
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
                <span>Loading category colour hierarchy...</span>
              </div>
            ) : groupedData.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No category records found matching current filters.
              </div>
            ) : (
              groupedData.map((div) => {
                const isDivExpanded = !!expandedDivisions[div.divisionName];

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
                          <span className="text-[9px] text-gray-400 uppercase block">Revenue</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(div.net_revenue)}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-[9px] text-gray-400 uppercase block">Sales Units</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {div.sales_units.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase block">Gross Margin</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {div.margin_pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="hidden md:block">
                          <span className="text-[9px] text-gray-400 uppercase block">Sell-Through</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {div.sell_through_pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LEVEL 2: SECTION */}
                    {isDivExpanded && Object.values(div.sections).map((sec) => {
                      const secKey = `${div.divisionName}|||${sec.sectionName}`;
                      const isSecExpanded = !!expandedSections[secKey];

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
                                  {formatCurrency(sec.net_revenue)}
                                </span>
                              </div>
                              <div className="hidden sm:block">
                                <span className="text-gray-500">
                                  {sec.sales_units.toLocaleString()} units
                                </span>
                              </div>
                              <div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {sec.margin_pct.toFixed(1)}% Margin
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
                                      {formatCurrency(dept.net_revenue)}
                                    </span>
                                    <span className="text-gray-500 hidden sm:block">
                                      {dept.sales_units.toLocaleString()} units
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                      {dept.margin_pct.toFixed(1)}%
                                    </span>
                                    <span className="text-blue-600 dark:text-blue-400 font-medium hidden md:inline">
                                      {dept.sell_through_pct.toFixed(1)}% ST
                                    </span>
                                    {!isDeptExpanded && (
                                      <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 opacity-60 hover:opacity-100">
                                        View Products →
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* LEVEL 4+: CATEGORY 1-6 GROUPS → END BARCODES WITH COLOUR BADGES */}
                                {isDeptExpanded && (
                                  <div className="pl-5 border-l-2 border-teal-200 dark:border-teal-900/40">
                                    {isDeptLoading ? (
                                      <div className="p-4 text-xs text-gray-400 flex items-center gap-2">
                                        <span className="animate-spin">⟳</span>
                                        <span>Loading SKU colours and attributes for {dept.department}...</span>
                                      </div>
                                    ) : deptSkuList.length === 0 ? (
                                      <div className="p-4 text-xs text-gray-400">No SKU records found for this department.</div>
                                    ) : (
                                      <ColourDepartmentDrilldown
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

      {/* VIEW 2: FLAT DEPARTMENT COLOUR MATRIX TABLE */}
      {viewMode === "flat" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Cross-tabular performance of colour tags across retail departments.
            </span>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Colour Dropdown Filter */}
              <select
                value={selectedColourFilter}
                onChange={(e) => setSelectedColourFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="ALL">All Colours ({distinctColours.length})</option>
                {distinctColours.map((col) => (
                  <option key={col} value={col}>
                    {formatDisplayValue(col)}
                  </option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search department or colour..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          {flatLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="py-3.5 px-4">Extracted Colour</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4 text-right">SKU Count</th>
                    <th className="py-3.5 px-4 text-right">Sales Units</th>
                    <th className="py-3.5 px-4 text-right">Revenue (₹)</th>
                    <th className="py-3.5 px-4 text-right">Gross Margin %</th>
                    <th className="py-3.5 px-4 text-right">Sell-Through %</th>
                    <th className="py-3.5 px-4 text-right">Stock On-Hand (Units)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        No department colour metrics match search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const swatch = getColourHex(item.extracted_colour);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border shadow-2xs"
                                style={{ backgroundColor: swatch.bg, borderColor: swatch.border }}
                              />
                              {formatDisplayValue(item.extracted_colour)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                            {formatDisplayValue(item.department)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                            {item.total_skus.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                            {Math.round(item.sales_units).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                            {formatCurrency(item.net_revenue)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.margin_pct != null ? `${item.margin_pct.toFixed(1)}%` : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                            {item.sell_through_pct != null ? `${item.sell_through_pct.toFixed(1)}%` : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                            {item.current_stock_units != null ? Math.round(item.current_stock_units).toLocaleString() : "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MULTI-TIER SKU DETAIL DRAWER MODAL */}
      {selectedSku && (
        <ColourSkuDrawer
          sku={selectedSku}
          relatableSkus={relatableSkus}
          onClose={() => setSelectedSku(null)}
          onSelectSku={setSelectedSku}
        />
      )}
    </div>
  );
};

// ─── Sub-Component: Department SKU Drill-Down with Category 1 Grouping ────────

function ColourDepartmentDrilldown({
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
      const revA = a[1].reduce((s, x) => s + x.net_revenue, 0);
      const revB = b[1].reduce((s, x) => s + x.net_revenue, 0);
      return revB - revA;
    });
  }, [skus]);

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
      {cat1Groups.map(([cat1Name, cat1Skus]) => {
        const isExpanded = !!expandedCat1[cat1Name];
        const cat1Revenue = cat1Skus.reduce((s, x) => s + x.net_revenue, 0);
        const cat1Units = cat1Skus.reduce((s, x) => s + x.sales_units, 0);
        const cat1Profit = cat1Skus.reduce((s, x) => s + x.gross_profit, 0);
        const cat1Margin = cat1Revenue > 0 ? (cat1Profit / cat1Revenue) * 100 : 0;

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
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(cat1Revenue)}</span>
                <span className="text-gray-500 hidden sm:block">{cat1Units.toLocaleString()} units</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{cat1Margin.toFixed(1)}% Margin</span>
              </div>
            </div>

            {/* Level 5+: End Barcodes (grouped by Category 2 if multiple) */}
            {isExpanded && (
              <ColourBarcodeList skus={cat1Skus} onSelectSku={onSelectSku} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ColourBarcodeList({
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
          <ColourBarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
        ))}
      </div>
    );
  }

  return (
    <div className="pl-4 divide-y divide-gray-100 dark:divide-gray-800/40">
      {Array.from(cat2Groups.entries()).map(([cat2Name, cat2Skus]) => (
        <ColourCat2Group key={cat2Name} cat2Name={cat2Name} skus={cat2Skus} onSelectSku={onSelectSku} />
      ))}
    </div>
  );
}

function ColourCat2Group({
  cat2Name,
  skus,
  onSelectSku,
}: {
  cat2Name: string;
  skus: SkuVelocityItem[];
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const revenue = skus.reduce((s, x) => s + x.net_revenue, 0);
  const units = skus.reduce((s, x) => s + x.sales_units, 0);

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
          <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(revenue)}</span>
          <span className="text-gray-500">{units.toLocaleString()} units</span>
        </div>
      </div>
      {expanded && (
        <div className="pl-4 bg-gray-50/20 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800/40">
          {skus.map((sku) => (
            <ColourBarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
          ))}
        </div>
      )}
    </div>
  );
}

function ColourBarcodeRow({ sku, onSelectSku }: { sku: SkuVelocityItem; onSelectSku: (sku: SkuVelocityItem) => void }) {
  const colourName = sku.colour && sku.colour !== "Others" ? sku.colour : "General";
  const swatch = getColourHex(colourName);

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

        {/* Colour Pill with Swatch */}
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shadow-2xs"
          style={{ backgroundColor: swatch.bg, borderColor: swatch.border, color: swatch.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
          {colourName}
        </span>

        {sku.category3 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hidden lg:inline">
            {sku.category3}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs mt-1 sm:mt-0 flex-shrink-0">
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(sku.net_revenue)}</span>
        <span className="text-gray-500">{sku.sales_units.toLocaleString()} units</span>
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
          {sku.net_revenue > 0 ? `${((sku.gross_profit / sku.net_revenue) * 100).toFixed(1)}%` : "0%"}
        </span>
        <span className="text-[9px] font-semibold text-brand-500 group-hover/barcode:underline hidden sm:block">Details →</span>
      </div>
    </div>
  );
}

// ─── Sub-Component: Full Multi-Tier SKU Detail Drawer for Colour Analytics ────

function ColourSkuDrawer({
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
  const colourName = sku.colour && sku.colour !== "Others" ? sku.colour : "General";
  const swatch = getColourHex(colourName);
  const marginPct = sku.net_revenue > 0 ? (sku.gross_profit / sku.net_revenue) * 100 : 0;

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
                Colour &amp; SKU Attribute Detail
              </span>

              {/* Colour Identity Pill */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs"
                style={{ backgroundColor: swatch.bg, borderColor: swatch.border, color: swatch.text }}
              >
                <span className="w-2 h-2 rounded-full bg-current opacity-90" />
                {colourName}
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

        {/* COLOUR PERFORMANCE KPIS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>🎨</span>
            <span>Colour &amp; Commercial Velocity Metrics</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/20">
              <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block">Net Revenue</span>
              <p className="font-extrabold text-xl mt-0.5 text-brand-700 dark:text-brand-300">
                {formatCurrency(sku.net_revenue)}
              </p>
              <span className="text-[10px] text-gray-500">{sku.sales_units.toLocaleString()} units sold</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Gross Margin %</span>
              <p className="font-bold text-base mt-0.5 text-emerald-600 dark:text-emerald-400">
                {marginPct.toFixed(1)}%
              </p>
              <span className="text-[10px] text-gray-500">Profit: {formatCurrency(sku.gross_profit)}</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Sell-Through Rate</span>
              <p className="font-bold text-base mt-0.5 text-blue-600 dark:text-blue-400">
                {sku.sell_through_pct.toFixed(1)}%
              </p>
              <span className="text-[10px] text-gray-500">Stock: {sku.closing_stock_units.toLocaleString()} units</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Inventory Cover (WOC)</span>
              <p className="font-bold text-base mt-0.5 text-gray-900 dark:text-white">
                {sku.woc >= 999 ? "999+" : `${sku.woc.toFixed(1)} wks`}
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
                    <span className="text-gray-400 text-[10px] uppercase block">Extracted Colour</span>
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full border" style={{ backgroundColor: swatch.bg, borderColor: swatch.border }} />
                      {colourName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Vendor</span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate block">{formatDisplayValueStr(sku.vendor)}</span>
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
                const relColour = rel.colour && rel.colour !== "Others" ? rel.colour : "General";
                const relSwatch = getColourHex(relColour);

                return (
                  <button
                    key={rel.barcode}
                    onClick={() => onSelectSku(rel)}
                    className="text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all group/rel"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{rel.barcode}</span>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-bold border shadow-2xs"
                        style={{ backgroundColor: relSwatch.bg, borderColor: relSwatch.border, color: relSwatch.text }}
                      >
                        <span className="w-1 h-1 rounded-full bg-current opacity-90" />
                        {relColour}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5 group-hover/rel:text-brand-600 transition-colors">
                      {rel.description}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[9px] text-gray-400">{rel.department}</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {formatCurrency(rel.net_revenue)}
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
