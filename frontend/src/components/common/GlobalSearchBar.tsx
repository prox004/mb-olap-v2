"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type SearchableItem = {
  title: string;
  category: "Navigation Page" | "Analytics Module" | "Component";
  path: string;
  keywords: string[];
  description: string;
  parentPage?: string;
};

const SEARCH_INDEX: SearchableItem[] = [
  // --- 1. CEO EXECUTIVE DASHBOARD PAGE & COMPONENTS ---
  {
    title: "CEO Executive Dashboard",
    category: "Navigation Page",
    path: "/",
    keywords: ["ceo", "executive", "kpi", "overview", "revenue", "profit", "dashboard"],
    description: "High-level retail metrics, store rankings, and SKU performance",
  },
  {
    title: "Executive KPI Summary Cards",
    category: "Component",
    path: "/",
    parentPage: "CEO Executive View",
    keywords: ["kpi", "cards", "total revenue", "inventory value", "sell through", "woc", "weeks of cover", "gross profit"],
    description: "Primary metrics: Chain Revenue, Inventory Valuation, Sell-Through Rate %, Average WOC",
  },
  {
    title: "Monthly Performance Trend Chart",
    category: "Component",
    path: "/",
    parentPage: "CEO Executive View",
    keywords: ["monthly trend", "revenue chart", "gross margin line", "apexchart", "q2 2026", "april", "may", "june"],
    description: "Dual-axis visualization comparing Monthly Net Revenue vs Gross Margin %",
  },
  {
    title: "Store Performance Rankings Table",
    category: "Component",
    path: "/",
    parentPage: "CEO Executive View",
    keywords: ["store rankings", "outlet performance", "gariahat", "vip", "andul road", "metro retail pro", "store woc", "store margin"],
    description: "Retail outlet performance comparison sorted by Revenue, Margin %, and Stock WOC",
  },
  {
    title: "Top 10 Revenue Generating SKUs Widget",
    category: "Component",
    path: "/",
    parentPage: "CEO Executive View",
    keywords: ["top skus", "best sellers", "fastest selling barcode", "high revenue skus"],
    description: "Highlighting top 10 revenue generating barcodes and items",
  },
  {
    title: "Bottom 10 Slow Movers & Dead Stock Widget",
    category: "Component",
    path: "/",
    parentPage: "CEO Executive View",
    keywords: ["bottom skus", "slow movers", "dead stock", "liquidation", "zero sales"],
    description: "Bottom 10 slow-moving barcodes burdened with active on-hand inventory",
  },

  // --- 2. CATEGORY PERFORMANCE PAGE & COMPONENTS ---
  {
    title: "Category Performance & Hierarchy",
    category: "Navigation Page",
    path: "/category-performance",
    keywords: ["category", "hierarchy", "division", "section", "department", "matrix", "top movers"],
    description: "Multi-tier hierarchy analysis and Category Performance Matrix",
  },
  {
    title: "Category Hierarchy Tree Table",
    category: "Component",
    path: "/category-performance",
    parentPage: "Category Performance",
    keywords: ["hierarchy tree", "tree table", "expandable division", "section", "department", "department alias", "drilldown"],
    description: "Expandable tree table displaying Division → Section → Department rollup metrics",
  },
  {
    title: "Category Performance Scatter Matrix Chart",
    category: "Component",
    path: "/category-performance",
    parentPage: "Category Performance",
    keywords: ["category matrix", "scatter plot", "quadrant", "winners", "volume drivers", "high margin slow", "overstocked"],
    description: "4-Quadrant scatter plot analyzing Sell-Through Rate % vs Gross Margin % per department",
  },
  {
    title: "Top 5 Fastest Moving Categories Widget",
    category: "Component",
    path: "/category-performance",
    parentPage: "Category Performance",
    keywords: ["fastest moving categories", "top sell through", "high velocity departments"],
    description: "Top 5 categories ranked by highest sell-through percentage",
  },
  {
    title: "Top 5 Overstocked Underperforming Categories Widget",
    category: "Component",
    path: "/category-performance",
    parentPage: "Category Performance",
    keywords: ["overstocked categories", "high woc departments", "underperforming categories"],
    description: "Top 5 categories burdened with excess inventory weeks of cover (>16 WOC)",
  },

  // --- 3. MERCHANDISE & SKUS PAGE & COMPONENTS ---
  {
    title: "Merchandise & SKUs",
    category: "Navigation Page",
    path: "/merchandise-buying",
    keywords: ["merchandise", "buying", "sku", "velocity", "dead stock", "inventory"],
    description: "SKU velocity classification and dead stock liquidation desk",
  },
  {
    title: "SKU Velocity Distribution Summary Cards",
    category: "Component",
    path: "/merchandise-buying",
    parentPage: "Merchandise & SKUs",
    keywords: ["velocity cards", "fast movers count", "medium movers", "slow movers", "dead stock count"],
    description: "Count and inventory valuation summary for Fast, Medium, Slow, and Dead Stock SKUs",
  },
  {
    title: "SKU Performance Classification Matrix",
    category: "Component",
    path: "/merchandise-buying",
    parentPage: "Merchandise & SKUs",
    keywords: ["sku matrix", "barcode table", "velocity class", "item description", "closing stock"],
    description: "Searchable table of individual barcodes categorized by velocity grade",
  },
  {
    title: "Dead Stock Liquidation Action Desk",
    category: "Component",
    path: "/merchandise-buying",
    parentPage: "Merchandise & SKUs",
    keywords: ["dead stock desk", "liquidation", "markdown candidate", "discount percentage", "trapped capital"],
    description: "Action desk recommending discount markdowns for zero-velocity inventory",
  },

  // --- 4. SIZE & PRICE ANALYTICS PAGE & COMPONENTS ---
  {
    title: "Size & Price Analytics",
    category: "Navigation Page",
    path: "/size-price-analytics",
    keywords: ["size", "price", "analytics", "ladder", "curve", "distribution"],
    description: "Price ladder elasticity and size curve sales contribution",
  },
  {
    title: "Price Ladder Elasticity Analysis Chart",
    category: "Component",
    path: "/size-price-analytics",
    parentPage: "Size & Price Analytics",
    keywords: ["price ladder", "price band", "elasticity chart", "mrp range", "revenue by price"],
    description: "Bar & Line chart analyzing revenue, sales units, and margin across MRP price bands",
  },
  {
    title: "Size Curve Contribution Heatmap & Table",
    category: "Component",
    path: "/size-price-analytics",
    parentPage: "Size & Price Analytics",
    keywords: ["size curve", "size breakdown", "size s", "size m", "size l", "size xl", "size xxl", "sales contribution"],
    description: "Sales unit contribution and stock availability breakdown across garment sizes",
  },
  {
    title: "Size Brokenness & Stockout Alert Desk",
    category: "Component",
    path: "/size-price-analytics",
    parentPage: "Size & Price Analytics",
    keywords: ["size brokenness", "broken size ratio", "stockout alert", "missing sizes"],
    description: "Alerts identifying SKUs with incomplete size runs causing lost sales",
  },

  // --- 5. COLOUR ANALYTICS PAGE & COMPONENTS ---
  {
    title: "Colour Analytics",
    category: "Navigation Page",
    path: "/colour-analytics",
    keywords: ["colour", "color", "attribute", "taxonomy", "preference", "heatmap"],
    description: "Regex description attribute extraction and departmental colour preference",
  },
  {
    title: "Colour Distribution & Sales Heatmap",
    category: "Component",
    path: "/colour-analytics",
    parentPage: "Colour Analytics",
    keywords: ["colour heatmap", "color revenue", "black", "blue", "red", "white", "navy", "color shares"],
    description: "Revenue and sales unit breakdown across extracted item colours",
  },
  {
    title: "Departmental Colour Preference Matrix",
    category: "Component",
    path: "/colour-analytics",
    parentPage: "Colour Analytics",
    keywords: ["colour preference", "department colour matrix", "mens colour", "ladies colour"],
    description: "Cross-tabulation of department sales velocity mapped against top garment colours",
  },
  {
    title: "Colour Taxonomy Attribute Extraction Desk",
    category: "Component",
    path: "/colour-analytics",
    parentPage: "Colour Analytics",
    keywords: ["colour taxonomy", "regex extraction", "desc1 parsing", "unclassified items"],
    description: "Automated regex parser extracting shade attributes from item descriptions",
  },

  // --- 6. FINANCIAL & GMROI ANALYSIS PAGE & COMPONENTS ---
  {
    title: "Financial & GMROI Analysis",
    category: "Navigation Page",
    path: "/financial-gmroi",
    keywords: ["financial", "gmroi", "margin", "return", "investment", "buying accuracy"],
    description: "Gross Margin Return on Investment and procurement realization",
  },
  {
    title: "GMROI Summary KPI Cards",
    category: "Component",
    path: "/financial-gmroi",
    parentPage: "Financial & GMROI",
    keywords: ["gmroi ratio", "gross margin return", "turns", "inventory turns", "capital efficiency"],
    description: "Chain-wide GMROI ratio, inventory turn rate, and margin realization",
  },
  {
    title: "Departmental GMROI Performance Matrix",
    category: "Component",
    path: "/financial-gmroi",
    parentPage: "Financial & GMROI",
    keywords: ["gmroi table", "department gmroi", "gross margin return on investment table"],
    description: "Department-level breakdown of GMROI ratio, margin %, and inventory turnover",
  },
  {
    title: "Procurement Realization & Buying Accuracy Desk",
    category: "Component",
    path: "/financial-gmroi",
    parentPage: "Financial & GMROI",
    keywords: ["buying accuracy", "procurement realization", "planned vs actual", "overbuying alert"],
    description: "Tracking initial order volume versus actual sell-through realization",
  },

  // --- 7. VENDOR SCORECARD PAGE & COMPONENTS ---
  {
    title: "Vendor Scorecard",
    category: "Navigation Page",
    path: "/vendor-performance",
    keywords: ["vendor", "scorecard", "supplier", "returns", "commercial", "rating"],
    description: "Supplier commercial performance, goods returns, and composite scores",
  },
  {
    title: "Vendor Composite Scorecard Table",
    category: "Component",
    path: "/vendor-performance",
    parentPage: "Vendor Scorecard",
    keywords: ["vendor table", "supplier ratings", "partyname", "vendor revenue", "vendor margin"],
    description: "Comprehensive vendor rating table evaluating Revenue, Margin %, and Defect Rate",
  },
  {
    title: "Supplier Goods Returns & Defect Rate Widget",
    category: "Component",
    path: "/vendor-performance",
    parentPage: "Vendor Scorecard",
    keywords: ["vendor returns", "defect rate", "return value", "quality score"],
    description: "Tracking customer returns and RTV (Return to Vendor) rates per supplier",
  },

  // --- 8. STORE ALLOCATION PAGE & COMPONENTS ---
  {
    title: "Store Allocation",
    category: "Navigation Page",
    path: "/store-allocation",
    keywords: ["store", "allocation", "stock cover", "rebalance", "transfers"],
    description: "Weeks of cover analysis and inter-store rebalancing recommendations",
  },
  {
    title: "Store Weeks of Cover (WOC) Heatmap",
    category: "Component",
    path: "/store-allocation",
    parentPage: "Store Allocation",
    keywords: ["store woc heatmap", "outlet stock cover", "overstocked store", "understocked store"],
    description: "Visual matrix comparing stock cover across Gariahat, VIP, Andul Road, and DC",
  },
  {
    title: "Inter-Store Inventory Transfer & Rebalancing Table",
    category: "Component",
    path: "/store-allocation",
    parentPage: "Store Allocation",
    keywords: ["store rebalance", "inter store transfer", "source store", "destination store", "suggested transfer qty"],
    description: "Automated recommendations for shifting inventory between outlets to balance WOC",
  },

  // --- 9. AI RECOMMENDATIONS PAGE & COMPONENTS ---
  {
    title: "AI Recommendations Engine",
    category: "Navigation Page",
    path: "/ai-recommendations",
    keywords: ["ai", "recommendations", "intelligence", "actionable", "insights"],
    description: "Automated inventory optimization and markdown recommendations",
  },
  {
    title: "Automated Markdown & Clearance Action Cards",
    category: "Component",
    path: "/ai-recommendations",
    parentPage: "AI Recommendations",
    keywords: ["markdown ai", "discount recommendation", "clearance cards", "ai price reduction"],
    description: "AI-driven discount recommendations for slow-moving categories and dead stock",
  },
  {
    title: "Automated Reorder & Replenishment Insights",
    category: "Component",
    path: "/ai-recommendations",
    parentPage: "AI Recommendations",
    keywords: ["reorder ai", "replenishment recommendation", "stockout prevention", "purchase order suggestion"],
    description: "Predictive inventory replenishment alerts to prevent stockouts in high-velocity SKUs",
  },

  // --- 10. NLP AI ASSISTANT PAGE & COMPONENTS ---
  {
    title: "NLP AI Assistant",
    category: "Navigation Page",
    path: "/olap-assistant",
    keywords: ["nlp", "chat", "assistant", "ai", "query", "duckdb"],
    description: "Natural language query interface for OLAP warehouse",
  },
  {
    title: "Natural Language SQL Query Chat Console",
    category: "Component",
    path: "/olap-assistant",
    parentPage: "NLP AI Assistant",
    keywords: ["chat console", "sql query generator", "ask questions", "nl2sql", "duckdb chat"],
    description: "Conversational BI interface translating plain English questions into live DuckDB queries",
  },
];

export function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchableItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search filter matching across Title, Description, Keywords, and Parent Page
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase().trim();
    const filtered = SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.parentPage && item.parentPage.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
    setResults(filtered);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <div className="relative w-full xl:w-[460px]">
      <div className="relative">
        <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
          <svg
            className="fill-gray-500 dark:fill-gray-400"
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill=""
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search pages & individual components (Ctrl+K)..."
          className="dark:bg-dark-900 h-11 w-full rounded-xl border border-gray-200 bg-transparent py-2.5 pl-11 pr-14 text-sm text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
        >
          <span>⌘K</span>
        </button>
      </div>

      {/* Search Dropdown Results */}
      {isOpen && query.trim() !== "" && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-2 z-99999 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400 px-3 flex items-center justify-between">
            <span>Search Results ({results.length})</span>
            <span>Jump to Component</span>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {results.length === 0 ? (
              <div className="p-4 text-xs text-center text-gray-400">
                No pages or components found matching &quot;{query}&quot;
              </div>
            ) : (
              results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  className="w-full p-3 text-left hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-colors flex items-center justify-between group"
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                        {item.title}
                      </span>
                      {item.parentPage && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          Page: {item.parentPage}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
                      item.category === "Navigation Page"
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200 dark:border-brand-800"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item.category}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
