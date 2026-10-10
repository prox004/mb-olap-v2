"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useOlapFilter } from "@/context/OlapFilterContext";
import { formatDisplayValue } from "@/utils";

export function OlapFilterBar() {
  const {
    selectedStores,
    selectedMonths,
    selectedDivision,
    selectedDepartment,
    availableStores,
    availableMonths,
    availableDivisions,
    availableDepartments,
    availableStates,
    isLoadingLocations,
    setSelectedStores,
    setSelectedMonths,
    setSelectedDivision,
    setSelectedDepartment,
    toggleStore,
    toggleMonth,
    toggleYear,
    resetFilters,
  } = useOlapFilter();

  const [isOpen, setIsOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<"stores" | "period" | null>(null);

  const storeDropdownRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        openDropdown === "stores" &&
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
      if (
        openDropdown === "period" &&
        periodDropdownRef.current &&
        !periodDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  // Expanded states in the tree
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({
    ASSAM: true,
    ODISHA: true,
    "WEST BENGAL": true,
  });

  const formatStateName = (st: string) => {
    if (!st) return "";
    return st
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getStateCode = (stateName?: string) => {
    if (!stateName) return "";
    const s = stateName.toUpperCase();
    if (s.includes("BENGAL")) return "WB";
    if (s.includes("ODISHA")) return "OD";
    if (s.includes("ASSAM")) return "AS";
    return s.slice(0, 2);
  };

  const formatMonthName = (m: string) => {
    const [year, month] = m.split("-");
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    return isNaN(dateObj.getTime())
      ? m
      : dateObj.toLocaleString("en-US", { month: "short", year: "2-digit" });
  };

  // Group stores by parent State
  const storesByState = useMemo(() => {
    const map: Record<string, typeof availableStores> = {};
    for (const store of availableStores) {
      const st = store.state || "OTHER";
      if (!map[st]) map[st] = [];
      map[st].push(store);
    }
    return map;
  }, [availableStores]);

  // Toggle all stores in a specific state
  const toggleAllStoresInState = (stateName: string) => {
    const storesInState = availableStores
      .filter((s) => s.state?.toUpperCase() === stateName.toUpperCase())
      .map((s) => s.admsite_code);

    const allSelected = storesInState.every((id) => selectedStores.includes(id));
    if (allSelected) {
      const remaining = selectedStores.filter((id) => !storesInState.includes(id));
      if (remaining.length > 0) {
        setSelectedStores(remaining);
      } else {
        setSelectedStores(availableStores.map((s) => s.admsite_code));
      }
    } else {
      setSelectedStores(Array.from(new Set([...selectedStores, ...storesInState])));
    }
  };

  const isFY25Active = useMemo(() => {
    const fy25 = availableMonths.filter((m) => m.startsWith("2025"));
    return fy25.length > 0 && fy25.every((m) => selectedMonths.includes(m));
  }, [availableMonths, selectedMonths]);

  const isFY26Active = useMemo(() => {
    const fy26 = availableMonths.filter((m) => m.startsWith("2026"));
    return fy26.length > 0 && fy26.every((m) => selectedMonths.includes(m));
  }, [availableMonths, selectedMonths]);

  // Summary labels for the dropdown trigger buttons
  const storeSummaryLabel = useMemo(() => {
    if (selectedStores.length === availableStores.length && availableStores.length > 0) {
      return `All Outlets (${availableStores.length})`;
    }
    if (selectedStores.length === 0) {
      return "0 Outlets Selected";
    }
    return `${selectedStores.length}/${availableStores.length} Outlets`;
  }, [selectedStores, availableStores]);

  const periodSummaryLabel = useMemo(() => {
    if (selectedMonths.length === availableMonths.length && availableMonths.length > 0) {
      return `All Periods (${availableMonths.length})`;
    }
    if (selectedMonths.length === 0) {
      return "0 Periods Selected";
    }
    if (isFY25Active && selectedMonths.length === availableMonths.filter((m) => m.startsWith("2025")).length) {
      return "FY 2025-26 (6 Mos)";
    }
    if (isFY26Active && selectedMonths.length === availableMonths.filter((m) => m.startsWith("2026")).length) {
      return "FY 2026-27 (6 Mos)";
    }
    return `${selectedMonths.length}/${availableMonths.length} Months`;
  }, [selectedMonths, availableMonths, isFY25Active, isFY26Active]);

  const activeFilterCount =
    (selectedStores.length !== availableStores.length ? 1 : 0) +
    (selectedMonths.length !== availableMonths.length ? 1 : 0) +
    (selectedDivision !== "All" ? 1 : 0) +
    (selectedDepartment !== "All" ? 1 : 0);

  return (
    <div className="sticky top-16 z-20 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs p-4 transition-all">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Active Filter Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-left group"
          >
            <span className="flex h-3 w-3 rounded-full bg-brand-500 animate-pulse"></span>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white uppercase tracking-wider group-hover:text-brand-500 transition-colors">
              Analytics Filters
            </h3>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activeFilterCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              {activeFilterCount} Active Filter{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Filter Controls Toggle & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isOpen ? "Hide Filters" : "Show Filters"}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/30 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Body - 4-Column Dropdown Bar */}
      {isOpen && (
        <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            
            {/* 1. STORE OUTLETS DROPDOWN (STATE > OUTLETS) */}
            <div ref={storeDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Store Outlets (State &gt; Outlets)
              </label>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "stores" ? null : "stores")}
                className={`w-full h-10 px-3.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all bg-white dark:bg-gray-800 ${
                  openDropdown === "stores"
                    ? "border-brand-500 ring-2 ring-brand-500/20 shadow-xs"
                    : selectedStores.length !== availableStores.length
                    ? "border-brand-500/60 text-brand-600 dark:text-brand-400 shadow-2xs"
                    : "border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate font-semibold">{storeSummaryLabel}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    openDropdown === "stores" ? "rotate-180 text-brand-500" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Popover Tree Menu */}
              {openDropdown === "stores" && (
                <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-[420px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Hierarchy Tree: State &gt; Outlets
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStores(availableStores.map((s) => s.admsite_code))}
                        className="text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allOpen: Record<string, boolean> = {};
                          const someClosed = availableStates.some((s) => !expandedStates[s]);
                          availableStates.forEach((s) => (allOpen[s] = someClosed));
                          setExpandedStates(allOpen);
                        }}
                        className="text-[11px] font-medium text-gray-500 hover:underline"
                      >
                        {availableStates.some((s) => !expandedStates[s]) ? "Expand" : "Collapse"}
                      </button>
                    </div>
                  </div>

                  {isLoadingLocations ? (
                    <div className="h-28 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  ) : (
                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                      {availableStates.map((st) => {
                        const stores = storesByState[st] || [];
                        const selectedInState = stores.filter((s) => selectedStores.includes(s.admsite_code));
                        const isStateActive = selectedInState.length === stores.length;
                        const isPartial = selectedInState.length > 0 && selectedInState.length < stores.length;
                        const isExpanded = !!expandedStates[st];
                        const stateCode = getStateCode(st);

                        return (
                          <div
                            key={st}
                            className="rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/60 p-2 transition-all shadow-2xs"
                          >
                            {/* Parent State Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedStates({ ...expandedStates, [st]: !isExpanded })}
                                  className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                <input
                                  type="checkbox"
                                  checked={isStateActive}
                                  ref={(el) => {
                                    if (el) el.indeterminate = isPartial;
                                  }}
                                  onChange={() => toggleAllStoresInState(st)}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 dark:bg-gray-900 cursor-pointer accent-brand-500"
                                />
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                  {formatStateName(st)}
                                </span>
                                <span className="text-[10px] px-1 py-0.2 rounded font-mono font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  {stateCode}
                                </span>
                              </div>

                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  isStateActive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400"
                                    : isPartial
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400"
                                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                }`}
                              >
                                {selectedInState.length}/{stores.length} Outlets
                              </span>
                            </div>

                            {/* Child Stores */}
                            {isExpanded && (
                              <div className="mt-2 ml-5 pl-2.5 border-l-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-wrap gap-1.5 pt-0.5">
                                {stores.map((store) => {
                                  const isSelected = selectedStores.includes(store.admsite_code);
                                  return (
                                    <button
                                      key={store.admsite_code}
                                      type="button"
                                      onClick={() => toggleStore(store.admsite_code)}
                                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                                        isSelected
                                          ? "bg-brand-500 text-white shadow-2xs font-semibold"
                                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                      }`}
                                    >
                                      <span>{store.name.replace("M Baazar - ", "")}</span>
                                      <span
                                        className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                          isSelected
                                            ? "bg-white/25 text-white"
                                            : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                                        }`}
                                      >
                                        #{store.admsite_code}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {selectedStores.length} of {availableStores.length} outlets active
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(null)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-2xs transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. OPERATIONAL PERIOD DROPDOWN */}
            <div ref={periodDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Operational Period
              </label>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "period" ? null : "period")}
                className={`w-full h-10 px-3.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all bg-white dark:bg-gray-800 ${
                  openDropdown === "period"
                    ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                    : selectedMonths.length !== availableMonths.length
                    ? "border-blue-500/60 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate font-semibold">{periodSummaryLabel}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    openDropdown === "period" ? "rotate-180 text-blue-500" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Popover Period Menu */}
              {openDropdown === "period" && (
                <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-[380px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Select Fiscal Period
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMonths(availableMonths)}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        All
                      </button>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <button
                        type="button"
                        onClick={() => toggleYear("2025")}
                        className={`text-[11px] font-medium hover:underline ${
                          isFY25Active ? "text-blue-600 dark:text-blue-400 font-bold" : "text-gray-500"
                        }`}
                      >
                        FY25
                      </button>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <button
                        type="button"
                        onClick={() => toggleYear("2026")}
                        className={`text-[11px] font-medium hover:underline ${
                          isFY26Active ? "text-blue-600 dark:text-blue-400 font-bold" : "text-gray-500"
                        }`}
                      >
                        FY26
                      </button>
                    </div>
                  </div>

                  {/* FY 2025-26 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                        FY 2025-26
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleYear("2025")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        {isFY25Active ? "Deselect FY25" : "Select FY25"}
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {availableMonths
                        .filter((m) => m.startsWith("2025"))
                        .map((m) => {
                          const isSelected = selectedMonths.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => toggleMonth(m)}
                              className={`py-1.5 text-[11px] rounded font-medium transition-all text-center ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-2xs font-semibold"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                              }`}
                            >
                              {formatMonthName(m)}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* FY 2026-27 */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                        FY 2026-27
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleYear("2026")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        {isFY26Active ? "Deselect FY26" : "Select FY26"}
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {availableMonths
                        .filter((m) => m.startsWith("2026"))
                        .map((m) => {
                          const isSelected = selectedMonths.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => toggleMonth(m)}
                              className={`py-1.5 text-[11px] rounded font-medium transition-all text-center ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-2xs font-semibold"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                              }`}
                            >
                              {formatMonthName(m)}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {selectedMonths.length} of {availableMonths.length} months active
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(null)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. DIVISION DROPDOWN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Division
              </label>
              <div className="relative">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className={`w-full h-10 px-3.5 pr-8 rounded-lg border text-xs font-medium appearance-none bg-white dark:bg-gray-800 transition-all cursor-pointer ${
                    selectedDivision !== "All"
                      ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold shadow-2xs"
                      : "border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600"
                  } focus:outline-hidden focus:ring-2 focus:ring-brand-500/20`}
                >
                  <option value="All">All Divisions</option>
                  {availableDivisions.map((div) => (
                    <option key={div} value={div}>
                      {formatDisplayValue(div)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 4. DEPARTMENT DROPDOWN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Department
              </label>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className={`w-full h-10 px-3.5 pr-8 rounded-lg border text-xs font-medium appearance-none bg-white dark:bg-gray-800 transition-all cursor-pointer ${
                    selectedDepartment !== "All"
                      ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold shadow-2xs"
                      : "border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600"
                  } focus:outline-hidden focus:ring-2 focus:ring-brand-500/20`}
                >
                  <option value="All">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {formatDisplayValue(dept)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
