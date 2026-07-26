"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchableItem = {
  title: string;
  category: "Navigation Page" | "Analytics Module" | "Component";
  path: string;
  keywords: string[];
  description: string;
};

const SEARCH_INDEX: SearchableItem[] = [
  {
    title: "CEO Executive Dashboard",
    category: "Navigation Page",
    path: "/",
    keywords: ["ceo", "executive", "kpi", "overview", "revenue", "profit", "dashboard"],
    description: "High-level retail metrics, store rankings, and SKU performance",
  },
  {
    title: "Category Performance & Hierarchy",
    category: "Navigation Page",
    path: "/category-performance",
    keywords: ["category", "hierarchy", "division", "section", "department", "matrix", "top movers"],
    description: "Multi-tier hierarchy analysis and Category Performance Matrix",
  },
  {
    title: "Merchandise & SKUs",
    category: "Navigation Page",
    path: "/merchandise-buying",
    keywords: ["merchandise", "buying", "sku", "velocity", "dead stock", "inventory"],
    description: "SKU velocity classification and dead stock liquidation desk",
  },
  {
    title: "Size & Price Analytics",
    category: "Navigation Page",
    path: "/size-price-analytics",
    keywords: ["size", "price", "analytics", "ladder", "curve", "distribution"],
    description: "Price ladder elasticity and size curve sales contribution",
  },
  {
    title: "Colour Analytics",
    category: "Navigation Page",
    path: "/colour-analytics",
    keywords: ["colour", "color", "attribute", "taxonomy", "preference", "heatmap"],
    description: "Regex description attribute extraction and departmental colour preference",
  },
  {
    title: "Financial & GMROI Analysis",
    category: "Navigation Page",
    path: "/financial-gmroi",
    keywords: ["financial", "gmroi", "margin", "return", "investment", "buying accuracy"],
    description: "Gross Margin Return on Investment and procurement realization",
  },
  {
    title: "Vendor Scorecard",
    category: "Navigation Page",
    path: "/vendor-performance",
    keywords: ["vendor", "scorecard", "supplier", "returns", "commercial", "rating"],
    description: "Supplier commercial performance, goods returns, and composite scores",
  },
  {
    title: "Store Allocation",
    category: "Navigation Page",
    path: "/store-allocation",
    keywords: ["store", "allocation", "stock cover", "rebalance", "transfers"],
    description: "Weeks of cover analysis and inter-store rebalancing recommendations",
  },
  {
    title: "AI Recommendations Engine",
    category: "Navigation Page",
    path: "/ai-recommendations",
    keywords: ["ai", "recommendations", "intelligence", "actionable", "insights"],
    description: "Automated inventory optimization and markdown recommendations",
  },
  {
    title: "NLP AI Assistant",
    category: "Navigation Page",
    path: "/olap-assistant",
    keywords: ["nlp", "chat", "assistant", "ai", "query", "duckdb"],
    description: "Natural language query interface for OLAP warehouse",
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

  // Search filter matching
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
    <div className="relative w-full xl:w-[430px]">
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
          placeholder="Search pages & components (Ctrl+K)..."
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

      {/* Dropdown Results */}
      {isOpen && query.trim() !== "" && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-2 z-99999 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400 px-3">
            Search Results ({results.length})
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {results.length === 0 ? (
              <div className="p-4 text-xs text-center text-gray-400">
                No pages or components found for &quot;{query}&quot;
              </div>
            ) : (
              results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  className="w-full p-3 text-left hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
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
