"use client";

import React, { useState, useMemo, useCallback } from "react";
import { CategoryHierarchyItem, SkuVelocityItem } from "@/hooks/useCategoryData";
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

interface CategoryTreeTableProps {
  items: CategoryHierarchyItem[];
  loading: boolean;
  fetchDepartmentSkus: (division: string, section: string, department: string) => Promise<SkuVelocityItem[]>;
}

// SKU velocity status badge helper
function getStatusBadge(status: string) {
  switch (status) {
    case "FAST_MOVER":
      return <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Fast</span>;
    case "MEDIUM_MOVER":
      return <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Medium</span>;
    case "SLOW_MOVER":
      return <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Slow</span>;
    case "DEAD_STOCK":
      return <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Dead</span>;
    default:
      return <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
  }
}

export function CategoryTreeTable({ items, loading, fetchDepartmentSkus }: CategoryTreeTableProps) {
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // Track which departments have loaded SKUs
  const [deptSkus, setDeptSkus] = useState<Record<string, SkuVelocityItem[]>>({});
  const [deptSkusLoading, setDeptSkusLoading] = useState<Record<string, boolean>>({});

  // SKU Drawer state
  const [selectedSku, setSelectedSku] = useState<SkuVelocityItem | null>(null);

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

      // Load SKUs the first time this dept is expanded
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

  const groupedData = useMemo(() => {
    const divs: Record<string, GroupedDivision> = {};
    const safeItems = Array.isArray(items) ? items : [];

    safeItems.forEach((item) => {
      const divName = item.division || "UNKNOWN";
      const secName = item.section || "DEFAULT SECTION";

      if (!divs[divName]) {
        divs[divName] = { divisionName: divName, net_revenue: 0, sales_units: 0, gross_profit: 0, margin_pct: 0, closing_stock_value: 0, closing_stock_units: 0, sell_through_pct: 0, woc: 0, sections: {} };
      }
      const div = divs[divName];
      div.net_revenue += Number(item.net_revenue) || 0;
      div.sales_units += Number(item.sales_units) || 0;
      div.gross_profit += Number(item.gross_profit) || 0;
      div.closing_stock_value += Number(item.closing_stock_value) || 0;
      div.closing_stock_units += Number(item.closing_stock_units) || 0;

      if (!div.sections[secName]) {
        div.sections[secName] = { sectionName: secName, net_revenue: 0, sales_units: 0, gross_profit: 0, margin_pct: 0, closing_stock_value: 0, closing_stock_units: 0, sell_through_pct: 0, woc: 0, departments: [] };
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
      div.margin_pct = div.net_revenue > 0 ? Number(((div.gross_profit / div.net_revenue) * 100).toFixed(2)) : 0;
      div.woc = (div.sales_units / 12.0) > 0 ? Number((div.closing_stock_units / (div.sales_units / 12.0)).toFixed(1)) : 999;
      const divTotalUnits = div.sales_units + div.closing_stock_units;
      div.sell_through_pct = divTotalUnits > 0 ? Number(((div.sales_units / divTotalUnits) * 100).toFixed(1)) : 0;
      Object.values(div.sections).forEach((sec) => {
        sec.margin_pct = sec.net_revenue > 0 ? Number(((sec.gross_profit / sec.net_revenue) * 100).toFixed(2)) : 0;
        sec.woc = (sec.sales_units / 12.0) > 0 ? Number((sec.closing_stock_units / (sec.sales_units / 12.0)).toFixed(1)) : 999;
        const secTotalUnits = sec.sales_units + sec.closing_stock_units;
        sec.sell_through_pct = secTotalUnits > 0 ? Number(((sec.sales_units / secTotalUnits) * 100).toFixed(1)) : 0;
      });
    });

    return Object.values(divs).sort((a, b) => b.net_revenue - a.net_revenue);
  }, [items]);

  // Compute relatable SKUs for drawer
  const relatableSkus = useMemo(() => {
    if (!selectedSku) return [];
    // Find SKUs from same dept
    const deptKey = `${selectedSku.division}|||${selectedSku.section}|||${selectedSku.department}`;
    const allDeptSkus = deptSkus[deptKey] || [];
    return allDeptSkus.filter((s) => s.barcode !== selectedSku.barcode).slice(0, 6);
  }, [selectedSku, deptSkus]);

  if (loading) {
    return <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 h-80 animate-pulse" />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📂</span>
            <span>Category &amp; Division Breakdown</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Division › Section › Department › Product Line › Products
          </p>
        </div>
        <ExportCsvButton
          columns={[
            { key: "division", header: "Division" },
            { key: "section", header: "Section" },
            { key: "department", header: "Department" },
            { key: "net_revenue", header: "Net Revenue" },
            { key: "sales_units", header: "Sales Units" },
            { key: "margin_pct", header: "Margin %" },
            { key: "closing_stock_value", header: "Stock Value" },
            { key: "sell_through_pct", header: "Sell-Through %" },
            { key: "woc", header: "WOC" },
          ]}
          rows={items as unknown as Record<string, unknown>[]}
          filenameParts={["Category_Hierarchy"]}
        />
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {groupedData.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No category records found.</div>
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
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{div.divisionName}</span>
                    <span className="text-[10px] text-gray-400">({Object.keys(div.sections).length} Sections)</span>
                  </div>
                  <div className="flex items-center gap-5 text-xs text-right">
                    <div><span className="block text-[9px] text-gray-400 uppercase">Revenue</span><span className="font-bold text-gray-900 dark:text-white">{formatCurrency(div.net_revenue)}</span></div>
                    <div className="hidden sm:block"><span className="block text-[9px] text-gray-400 uppercase">Units</span><span className="font-semibold">{div.sales_units.toLocaleString()}</span></div>
                    <div className="hidden md:block"><span className="block text-[9px] text-gray-400 uppercase">Margin</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{div.margin_pct}%</span></div>
                    <div><span className="block text-[9px] text-gray-400 uppercase">ST%</span><span className="font-bold text-brand-600 dark:text-brand-400">{div.sell_through_pct}%</span></div>
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
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{sec.sectionName}</span>
                          <span className="text-[10px] text-gray-400">({sec.departments.length} Departments)</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-right">
                          <div><span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(sec.net_revenue)}</span></div>
                          <div className="hidden sm:block"><span className="text-gray-500">{sec.margin_pct}%</span></div>
                          <div><span className="text-brand-600 dark:text-brand-400 font-semibold">{sec.sell_through_pct}% ST</span></div>
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
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{dept.department}</span>
                                {isDeptExpanded && deptSkuList.length > 0 && (
                                  <span className="text-[10px] text-gray-400">({deptSkuList.length} SKUs)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(dept.net_revenue)}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{dept.margin_pct}%</span>
                                <span className="text-brand-600 dark:text-brand-400 font-medium">{dept.sell_through_pct}% ST</span>
                                <span className="text-gray-400 text-[10px] hidden md:block">WOC: {dept.woc} Wks</span>
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
                                    <span>Loading SKU details for {dept.department}...</span>
                                  </div>
                                ) : deptSkuList.length === 0 ? (
                                  <div className="p-4 text-xs text-gray-400">No SKU records found for this department.</div>
                                ) : (
                                  <DepartmentSkuDrilldown
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

      {/* MULTI-TIER SKU DETAIL DRAWER */}
      {selectedSku && (
        <SkuDetailDrawer
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
  // If many unique Cat2, group them; otherwise flat list
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
    // Flat list of barcodes
    return (
      <div className="pl-4 bg-gray-50/30 dark:bg-gray-900/40 divide-y divide-gray-100 dark:divide-gray-800/40">
        {skus.map((sku) => (
          <BarcodeRow key={sku.barcode} sku={sku} onSelectSku={onSelectSku} />
        ))}
      </div>
    );
  }

  // Grouped by Cat2 (Brand/Range)
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
        <div>{getStatusBadge(sku.velocity_status)}</div>
        <span className="text-[9px] font-semibold text-brand-500 group-hover/barcode:underline hidden sm:block">Details →</span>
      </div>
    </div>
  );
}

// ─── Sub-Component: Full Multi-Tier SKU Detail Drawer ─────────────────────────

function SkuDetailDrawer({
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
                SKU Detail View
              </span>
              {getStatusBadge(sku.velocity_status)}
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

        {/* PERFORMANCE KPIS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Financial &amp; Stock Velocity Performance
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Net Revenue", value: `₹${sku.net_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
              { label: "Sales Volume", value: `${sku.sales_units.toLocaleString()} units` },
              { label: "Closing Stock", value: `₹${sku.closing_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: `${sku.closing_stock_units.toLocaleString()} units` },
              { label: "Sell-Through", value: `${sku.sell_through_pct.toFixed(1)}%`, sub: `WOC: ${sku.woc >= 999 ? "999+" : sku.woc.toFixed(1)} wks`, highlight: true },
            ].map(({ label, value, sub, highlight }) => (
              <div key={label} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">{label}</span>
                <p className={`font-bold text-base mt-0.5 ${highlight ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-white"}`}>
                  {value}
                </p>
                {sub && <span className="text-[10px] text-gray-500">{sub}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* RELATABLE SKUS */}
        {relatableSkus.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span>🔗</span>
              <span>Relatable SKUs in {sku.department || sku.section}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {relatableSkus.map((rel) => (
                <button
                  key={rel.barcode}
                  onClick={() => onSelectSku(rel)}
                  className="text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all group/rel"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{rel.barcode}</span>
                    <span className="text-[10px] font-semibold text-gray-500">{formatCurrency(rel.net_revenue)}</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5 group-hover/rel:text-brand-600 transition-colors">
                    {rel.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-gray-400">{rel.department}</span>
                    <span className="text-[9px] text-brand-600 dark:text-brand-400 font-semibold">{rel.sell_through_pct.toFixed(0)}% ST</span>
                  </div>
                </button>
              ))}
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

// ─── Tiny helper components ────────────────────────────────────────────────────

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
