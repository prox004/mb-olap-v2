"use client";

import React, { useState, useMemo } from "react";
import { SkuVelocityItem } from "@/hooks/useMerchandiseData";
import { ExportCsvButton } from "@/components/common/ExportCsvButton";
import { formatDisplayValue } from "@/utils";

interface SkuVelocityTableProps {
  items: SkuVelocityItem[];
  totalRecords: number;
  page: number;
  pageSize: number;
  loading: boolean;
  velocityFilter: string;
  onVelocityFilterChange: (val: string) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onPageChange: (newPage: number) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (field: string) => void;
}

// Tree hierarchy types
function formatCurrency(val: number | null | undefined): string {
  if (val == null || isNaN(Number(val))) return "N/A";
  const num = Number(val);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function getStatusBadge(status: string, compact: boolean = false) {
  switch (status) {
    case "FAST_MOVER":
      return (
        <span className={`inline-flex items-center ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300`}>
          {compact ? "Fast" : "Fast Mover"}
        </span>
      );
    case "MEDIUM_MOVER":
      return (
        <span className={`inline-flex items-center ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300`}>
          {compact ? "Medium" : "Medium Mover"}
        </span>
      );
    case "SLOW_MOVER":
      return (
        <span className={`inline-flex items-center ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300`}>
          {compact ? "Slow" : "Slow Mover"}
        </span>
      );
    case "DEAD_STOCK":
      return (
        <span className={`inline-flex items-center ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300`}>
          {compact ? "Dead" : "Dead Stock"}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>
          {status}
        </span>
      );
  }
}

interface HierarchyNode {
  name: string;
  level: "division" | "section" | "department";
  skuCount: number;
  netRevenue: number;
  salesUnits: number;
  closingStockValue: number;
  avgSellThrough: number;
  children?: HierarchyNode[];
  skus?: SkuVelocityItem[];
}

export const SkuVelocityTable: React.FC<SkuVelocityTableProps> = ({
  items,
  totalRecords,
  page,
  pageSize,
  loading,
  velocityFilter,
  onVelocityFilterChange,
  searchQuery,
  onSearchQueryChange,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const [selectedSku, setSelectedSku] = useState<SkuVelocityItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree");
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  // Build hierarchy tree from currently loaded items
  const hierarchyTree = useMemo(() => {
    const divMap = new Map<string, Map<string, Map<string, SkuVelocityItem[]>>>();

    for (const item of items) {
      const div = item.division?.trim() || "Unassigned Division";
      const sec = item.section?.trim() || "General Section";
      const dep = item.department?.trim() || "General Department";

      if (!divMap.has(div)) divMap.set(div, new Map());
      const secMap = divMap.get(div)!;

      if (!secMap.has(sec)) secMap.set(sec, new Map());
      const depMap = secMap.get(sec)!;

      if (!depMap.has(dep)) depMap.set(dep, []);
      depMap.get(dep)!.push(item);
    }

    const tree: HierarchyNode[] = [];

    divMap.forEach((secMap, divName) => {
      const divChildren: HierarchyNode[] = [];
      let divSkuCount = 0;
      let divRevenue = 0;
      let divSalesUnits = 0;
      let divStockVal = 0;
      let divTotalSellThrough = 0;

      secMap.forEach((depMap, secName) => {
        const secChildren: HierarchyNode[] = [];
        let secSkuCount = 0;
        let secRevenue = 0;
        let secSalesUnits = 0;
        let secStockVal = 0;
        let secTotalSellThrough = 0;

        depMap.forEach((deptSkus, depName) => {
          let depRevenue = 0;
          let depSalesUnits = 0;
          let depStockVal = 0;
          let depTotalSellThrough = 0;

          for (const s of deptSkus) {
            depRevenue += s.net_revenue || 0;
            depSalesUnits += s.sales_units || 0;
            depStockVal += s.closing_stock_value || 0;
            depTotalSellThrough += s.sell_through_pct || 0;
          }

          const depAvgST = deptSkus.length > 0 ? depTotalSellThrough / deptSkus.length : 0;

          secChildren.push({
            name: depName,
            level: "department",
            skuCount: deptSkus.length,
            netRevenue: depRevenue,
            salesUnits: depSalesUnits,
            closingStockValue: depStockVal,
            avgSellThrough: depAvgST,
            skus: deptSkus,
          });

          secSkuCount += deptSkus.length;
          secRevenue += depRevenue;
          secSalesUnits += depSalesUnits;
          secStockVal += depStockVal;
          secTotalSellThrough += depTotalSellThrough;
        });

        const secAvgST = secSkuCount > 0 ? secTotalSellThrough / secSkuCount : 0;

        divChildren.push({
          name: secName,
          level: "section",
          skuCount: secSkuCount,
          netRevenue: secRevenue,
          salesUnits: secSalesUnits,
          closingStockValue: secStockVal,
          avgSellThrough: secAvgST,
          children: secChildren,
        });

        divSkuCount += secSkuCount;
        divRevenue += secRevenue;
        divSalesUnits += secSalesUnits;
        divStockVal += secStockVal;
        divTotalSellThrough += secTotalSellThrough;
      });

      const divAvgST = divSkuCount > 0 ? divTotalSellThrough / divSkuCount : 0;

      tree.push({
        name: divName,
        level: "division",
        skuCount: divSkuCount,
        netRevenue: divRevenue,
        salesUnits: divSalesUnits,
        closingStockValue: divStockVal,
        avgSellThrough: divAvgST,
        children: divChildren,
      });
    });

    return tree;
  }, [items]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    const keys: Record<string, boolean> = {};
    hierarchyTree.forEach((div) => {
      keys[`div_${div.name}`] = true;
      div.children?.forEach((sec) => {
        keys[`div_${div.name}_sec_${sec.name}`] = true;
        sec.children?.forEach((dep) => {
          keys[`div_${div.name}_sec_${sec.name}_dep_${dep.name}`] = true;
        });
      });
    });
    setExpandedKeys(keys);
  };

  const collapseAll = () => {
    setExpandedKeys({});
  };

  // Find relatable SKUs for the selected item
  const relatableSkus = useMemo(() => {
    if (!selectedSku) return [];
    return items
      .filter(
        (s) =>
          s.barcode !== selectedSku.barcode &&
          (s.department === selectedSku.department ||
            s.section === selectedSku.section ||
            s.division === selectedSku.division)
      )
      .slice(0, 6);
  }, [selectedSku, items]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4">
      {/* Search & Control Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Barcode, Description, Division, or Vendor..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full px-4 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* View Mode & Velocity Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Hierarchy Tree vs Flat Table */}
          <div className="flex items-center p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "tree"
                  ? "bg-white text-brand-600 dark:bg-gray-700 dark:text-brand-300 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
              title="Category &amp; Division View"
            >
              <span>📂</span>
              <span>Category &amp; Division View</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white text-brand-600 dark:bg-gray-700 dark:text-brand-300 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
              title="All Products Table"
            >
              <span>📋</span>
              <span>All Products Table</span>
            </button>
          </div>

          <ExportCsvButton
            columns={[
              { key: "barcode", header: "Barcode" },
              { key: "description", header: "Description" },
              { key: "division", header: "Division" },
              { key: "section", header: "Section" },
              { key: "department", header: "Department" },
              { key: "category1", header: "Category 1" },
              { key: "category2", header: "Category 2" },
              { key: "category3", header: "Category 3" },
              { key: "category4", header: "Category 4" },
              { key: "category5", header: "Category 5" },
              { key: "category6", header: "Category 6" },
              { key: "vendor", header: "Vendor" },
              { key: "mrp", header: "MRP" },
              { key: "cost_rate", header: "Cost Rate" },
              { key: "net_revenue", header: "Revenue" },
              { key: "sales_units", header: "Units Sold" },
              { key: "closing_stock_units", header: "Stock Units" },
              { key: "closing_stock_value", header: "Stock Value" },
              { key: "sell_through_pct", header: "Sell Through Pct" },
              { key: "velocity_status", header: "Velocity" },
            ]}
            rows={items as unknown as Record<string, unknown>[]}
            filenameParts={["SKU_Velocity_Hierarchy", velocityFilter]}
          />

          {/* Velocity Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["ALL", "FAST_MOVER", "MEDIUM_MOVER", "SLOW_MOVER", "DEAD_STOCK"].map((st) => (
              <button
                key={st}
                onClick={() => onVelocityFilterChange(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  velocityFilter === st
                    ? "bg-brand-500 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {st === "ALL" ? "All Velocity" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VIEW 1: CATEGORY DRILL-DOWN HIERARCHY TREE */}
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
                className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Loading category hierarchy tree...
              </div>
            ) : hierarchyTree.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No matching category or SKU records found.
              </div>
            ) : (
              hierarchyTree.map((divNode) => {
                const divKey = `div_${divNode.name}`;
                const isDivExpanded = !!expandedKeys[divKey];

                return (
                  <div key={divKey} className="group/div">
                    {/* LEVEL 1: DIVISION */}
                    <div
                      onClick={() => toggleExpand(divKey)}
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
                          {divNode.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ({divNode.skuCount} SKUs across {divNode.children?.length || 0} Sections)
                        </span>
                      </div>

                      <div className="flex items-center gap-5 text-xs text-right">
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase block">Revenue</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(divNode.netRevenue)}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-[9px] text-gray-400 uppercase block">Sales Units</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {divNode.salesUnits.toLocaleString()}
                          </span>
                        </div>
                        <div className="hidden md:block">
                          <span className="text-[9px] text-gray-400 uppercase block">Stock Value</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {formatCurrency(divNode.closingStockValue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase block">Avg ST %</span>
                          <span className="font-bold text-brand-600 dark:text-brand-400">
                            {divNode.avgSellThrough.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LEVEL 2: SECTION */}
                    {isDivExpanded && divNode.children && (
                      <div className="pl-5 border-l-2 border-brand-200 dark:border-brand-900/40 divide-y divide-gray-100 dark:divide-gray-800">
                        {divNode.children.map((secNode) => {
                          const secKey = `div_${divNode.name}_sec_${secNode.name}`;
                          const isSecExpanded = !!expandedKeys[secKey];

                          return (
                            <div key={secKey}>
                              <div
                                onClick={() => toggleExpand(secKey)}
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
                                    {secNode.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    ({secNode.skuCount} SKUs in {secNode.children?.length || 0} Departments)
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-right">
                                  <div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {formatCurrency(secNode.netRevenue)}
                                    </span>
                                  </div>
                                  <div className="text-brand-600 dark:text-brand-400 font-semibold">
                                    {secNode.avgSellThrough.toFixed(1)}% ST
                                  </div>
                                </div>
                              </div>

                              {/* LEVEL 3: DEPARTMENT */}
                              {isSecExpanded && secNode.children && (
                                <div className="pl-5 border-l-2 border-indigo-200 dark:border-indigo-900/40 divide-y divide-gray-50 dark:divide-gray-800/60">
                                  {secNode.children.map((deptNode) => {
                                    const deptKey = `div_${divNode.name}_sec_${secNode.name}_dep_${deptNode.name}`;
                                    const isDeptExpanded = !!expandedKeys[deptKey];

                                    return (
                                      <div key={deptKey}>
                                        <div
                                          onClick={() => toggleExpand(deptKey)}
                                          className="flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-800/20 dark:hover:bg-gray-800/50 cursor-pointer select-none transition-colors border-l-2 border-l-teal-400"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-xs font-bold w-4 flex-shrink-0">
                                              {isDeptExpanded ? "▼" : "▶"}
                                            </span>
                                            <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                                              DEPT
                                            </span>
                                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                              {deptNode.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                              ({deptNode.skus?.length || 0} SKUs)
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-3 text-xs">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                              {formatCurrency(deptNode.netRevenue)}
                                            </span>
                                            <span className="text-brand-600 dark:text-brand-400 font-medium">
                                              {deptNode.avgSellThrough.toFixed(1)}% ST
                                            </span>
                                          </div>
                                        </div>

                                        {/* LEVEL 4+: CATEGORY 1-6 GROUPS → END BARCODES */}
                                        {isDeptExpanded && deptNode.skus && (
                                          <div className="pl-5 border-l-2 border-teal-200 dark:border-teal-900/40">
                                            <DepartmentSkuDrilldown
                                              skus={deptNode.skus}
                                              onSelectSku={setSelectedSku}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: FLAT TABLE SECTION */}
      {viewMode === "table" && (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="p-3">Barcode</th>
                <th className="p-3">Description</th>
                <th className="p-3">Division</th>
                <th className="p-3">Section</th>
                <th className="p-3">Department</th>
                <th className="p-3 cursor-pointer select-none" onClick={() => onSortChange("net_revenue")}>
                  Revenue (₹) {sortBy === "net_revenue" && (sortOrder === "desc" ? "▼" : "▲")}
                </th>
                <th className="p-3 text-right">Sales Units</th>
                <th className="p-3 text-right">Stock Value</th>
                <th className="p-3 text-right">Sell-Through %</th>
                <th className="p-3 text-right">WOC (Wks)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400">
                    Loading SKU velocity records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400">
                    No matching SKU records found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.barcode}
                    onClick={() => setSelectedSku(item)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">{item.barcode}</td>
                    <td className="p-3 max-w-xs truncate font-medium text-gray-900 dark:text-white" title={formatDisplayValue(item.description)}>
                      {formatDisplayValue(item.description)}
                    </td>
                    <td className="p-3 text-gray-500">{formatDisplayValue(item.division)}</td>
                    <td className="p-3 text-gray-500">{formatDisplayValue(item.section)}</td>
                    <td className="p-3 text-gray-500">{formatDisplayValue(item.department)}</td>
                    <td className="p-3 font-bold text-gray-900 dark:text-white">
                      ₹{item.net_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-medium">{item.sales_units.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">
                      ₹{item.closing_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-brand-600 dark:text-brand-400">
                      {item.sell_through_pct.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {item.woc >= 999 ? "999+" : item.woc.toFixed(1)}
                    </td>
                    <td className="p-3 text-center">{getStatusBadge(item.velocity_status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
        <div>
          Showing page <span className="font-bold text-gray-900 dark:text-white">{page}</span> of{" "}
          <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span> ({totalRecords.toLocaleString()} total SKUs)
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 font-medium disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 font-medium disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE MULTI-TIER CATEGORY DRILL-DOWN DRAWER MODAL */}
      {selectedSku && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setSelectedSku(null)}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Navigation & Breadcrumbs */}
            <div className="space-y-2 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-md">
                    End Barcode Item Details
                  </span>
                  {getStatusBadge(selectedSku.velocity_status)}
                </div>
                <button
                  onClick={() => setSelectedSku(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Breadcrumb Path Trail */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-1">
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {selectedSku.division || "Division"}
                </span>
                <span>&gt;</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedSku.section || "Section"}
                </span>
                <span>&gt;</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedSku.department || "Department"}
                </span>
                {selectedSku.category1 && (
                  <>
                    <span>&gt;</span>
                    <span className="text-gray-600 dark:text-gray-400">{selectedSku.category1}</span>
                  </>
                )}
                {selectedSku.category2 && (
                  <>
                    <span>&gt;</span>
                    <span className="text-gray-600 dark:text-gray-400">{selectedSku.category2}</span>
                  </>
                )}
                {selectedSku.category3 && (
                  <>
                    <span>&gt;</span>
                    <span className="text-gray-600 dark:text-gray-400">{selectedSku.category3}</span>
                  </>
                )}
                <span>&gt;</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  {selectedSku.barcode}
                </span>
              </div>

              {/* Title & Description */}
              <div className="pt-1">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="font-mono text-brand-600 dark:text-brand-400">{selectedSku.barcode}</span>
                  <span>-</span>
                  <span>{selectedSku.description || "SKU Item"}</span>
                </h3>
              </div>
            </div>

            {/* VISUAL HIERARCHY DRILL-DOWN TREE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span>📂</span>
                  <span>Category &amp; Division Lineage</span>
                </h4>
                <span className="text-[11px] text-gray-400">Division › Section › Department › Products</span>
              </div>

              <div className="relative pl-6 space-y-4 border-l-2 border-brand-500/40 dark:border-brand-500/30 ml-3 py-1">
                {/* Level 1: Parent Category */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-brand-500 border-4 border-white dark:border-gray-900 shadow-xs" />
                  <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Level 1 • Parent Category (Division)
                      </span>
                      <span className="text-[10px] text-gray-400">Top-Level Division</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {formatDisplayValue(selectedSku.division)}
                    </p>
                  </div>
                </div>

                {/* Level 2: Section (Sub-Category) */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white dark:border-gray-900 shadow-xs" />
                  <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Level 2 • Sub-Category (Section)
                      </span>
                      <span className="text-[10px] text-gray-400">Product Section</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {formatDisplayValue(selectedSku.section)}
                    </p>
                  </div>
                </div>

                {/* Level 3: Department (Sub-Category) */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-teal-500 border-4 border-white dark:border-gray-900 shadow-xs" />
                  <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        Level 3 • Sub-Category (Department)
                      </span>
                      <span className="text-[10px] text-gray-400">Merchandise Dept</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {formatDisplayValue(selectedSku.department)}
                    </p>
                  </div>
                </div>

                {/* Sub-Category Attributes (Category 1 - 6) */}
                {(selectedSku.category1 ||
                  selectedSku.category2 ||
                  selectedSku.category3 ||
                  selectedSku.category4 ||
                  selectedSku.category5 ||
                  selectedSku.category6) && (
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
                        {selectedSku.category1 && (
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Category 1 (Product Line)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedSku.category1}</span>
                          </div>
                        )}
                        {selectedSku.category2 && (
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Category 2 (Brand / Range)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedSku.category2}</span>
                          </div>
                        )}
                        {selectedSku.category3 && (
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Category 3 (Form / Type)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedSku.category3}</span>
                          </div>
                        )}
                        {selectedSku.category4 && (
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Category 4 (Pack / Spec)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedSku.category4}</span>
                          </div>
                        )}
                        {selectedSku.category5 && (
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Category 5 (Size)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedSku.category5}</span>
                          </div>
                        )}
                        {selectedSku.category6 && (
                          <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Category 6 (Season / Year)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedSku.category6}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Node: End Barcode / SKU Leaf */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-gray-900 shadow-xs ring-4 ring-emerald-500/20" />
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <span>🎯</span>
                        <span>Product Details &amp; Barcode</span>
                      </span>
                      <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                        {selectedSku.barcode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Vendor</span>
                        <span className="font-semibold text-gray-900 dark:text-white truncate block" title={selectedSku.vendor}>
                          {formatDisplayValue(selectedSku.vendor)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Colour</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatDisplayValue(selectedSku.colour) || "Standard"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Style Code</span>
                        <span className="font-semibold text-gray-900 dark:text-white font-mono">
                          {formatDisplayValue(selectedSku.style_code) || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Unit Pricing</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          MRP ₹{selectedSku.mrp} / Cost ₹{selectedSku.cost_rate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FINANCIAL & VELOCITY PERFORMANCE KPIS */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Financial &amp; Stock Velocity Performance
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Net Revenue</span>
                  <p className="font-bold text-gray-900 dark:text-white text-base mt-0.5">
                    ₹{selectedSku.net_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Sales Volume</span>
                  <p className="font-bold text-gray-900 dark:text-white text-base mt-0.5">
                    {selectedSku.sales_units.toLocaleString()} units
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Closing Stock</span>
                  <p className="font-bold text-gray-900 dark:text-white text-base mt-0.5">
                    ₹{selectedSku.closing_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-gray-500">
                    ({selectedSku.closing_stock_units.toLocaleString()} units)
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Sell-Through Rate</span>
                  <p className="font-bold text-brand-600 dark:text-brand-400 text-base mt-0.5">
                    {selectedSku.sell_through_pct.toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-gray-500">
                    WOC: {selectedSku.woc >= 999 ? "999+" : selectedSku.woc.toFixed(1)} wks
                  </span>
                </div>
              </div>
            </div>

            {/* RELATABLE SKUS IN SAME CATEGORY / DEPARTMENT */}
            {relatableSkus.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span>🔗</span>
                    <span>Relatable SKUs in {selectedSku.department || selectedSku.section}</span>
                  </h4>
                  <span className="text-[10px] text-gray-400">Click to inspect related hierarchy</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {relatableSkus.map((rel) => (
                    <button
                      key={rel.barcode}
                      onClick={() => setSelectedSku(rel)}
                      className="text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all group/rel"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          {rel.barcode}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500">
                          ₹{rel.net_revenue.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5 group-hover/rel:text-brand-600 transition-colors">
                        {rel.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-400">{rel.department}</span>
                        <span className="text-[9px] text-brand-600 dark:text-brand-400 font-semibold">
                          {rel.sell_through_pct.toFixed(0)}% ST
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Close Action */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSelectedSku(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-Component: Department SKU Drill-Down with Category 1 Grouping ────────

function DepartmentSkuDrilldown({
  skus,
  onSelectSku,
}: {
  skus: SkuVelocityItem[];
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const [expandedCat1, setExpandedCat1] = useState<Record<string, boolean>>({});

  // Group SKUs by Category 1 (Product Line), fallback to "General"
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
        const cat1Rev = cat1Skus.reduce((s, x) => s + x.net_revenue, 0);
        const cat1Units = cat1Skus.reduce((s, x) => s + x.sales_units, 0);
        const cat1AvgST = cat1Skus.length > 0 ? cat1Skus.reduce((s, x) => s + x.sell_through_pct, 0) / cat1Skus.length : 0;

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
                <span className="text-gray-700 dark:text-gray-300 font-medium">{formatCurrency(cat1Rev)}</span>
                <span className="text-gray-500 hidden sm:block">{cat1Units.toLocaleString()} units</span>
                <span className="text-brand-600 dark:text-brand-400 font-semibold">{cat1AvgST.toFixed(1)}% ST</span>
              </div>
            </div>

            {/* Level 5+: End Barcodes (grouped by Category 2 if multiple) */}
            {isExpanded && (
              <BarcodeList skus={cat1Skus} onSelectSku={onSelectSku} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-Component: Barcode List with Category 2 grouping ─────────────────────

function BarcodeList({
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
          <BarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
        ))}
      </div>
    );
  }

  return (
    <div className="pl-4 divide-y divide-gray-100 dark:divide-gray-800/40">
      {Array.from(cat2Groups.entries()).map(([cat2Name, cat2Skus]) => (
        <Cat2Group key={cat2Name} cat2Name={cat2Name} skus={cat2Skus} onSelectSku={onSelectSku} />
      ))}
    </div>
  );
}

function Cat2Group({
  cat2Name,
  skus,
  onSelectSku,
}: {
  cat2Name: string;
  skus: SkuVelocityItem[];
  onSelectSku: (sku: SkuVelocityItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rev = skus.reduce((s, x) => s + x.net_revenue, 0);

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
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{formatCurrency(rev)}</span>
      </div>
      {expanded && (
        <div className="pl-4 bg-gray-50/20 dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800/40">
          {skus.map((sku) => (
            <BarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
          ))}
        </div>
      )}
    </div>
  );
}

function BarcodeRow({ sku, onSelectSku }: { sku: SkuVelocityItem; onSelectSku: (sku: SkuVelocityItem) => void }) {
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
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(sku.net_revenue)}</span>
        <span className="text-gray-500">{sku.sales_units.toLocaleString()} units</span>
        <span className="text-brand-600 dark:text-brand-400 font-bold">{sku.sell_through_pct.toFixed(1)}%</span>
        <div>{getStatusBadge(sku.velocity_status, true)}</div>
        <span className="text-[9px] font-semibold text-brand-500 group-hover/barcode:underline hidden sm:block">Details →</span>
      </div>
    </div>
  );
}
