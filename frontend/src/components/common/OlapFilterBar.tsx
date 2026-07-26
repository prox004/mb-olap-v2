"use client";

import React, { useState } from "react";
import { useOlapFilter } from "@/context/OlapFilterContext";

export function OlapFilterBar() {
  const {
    selectedStores,
    selectedMonths,
    selectedDivision,
    selectedDepartment,
    availableStores,
    availableMonths,
    isLoadingLocations,
    setSelectedStores,
    setSelectedMonths,
    setSelectedDivision,
    setSelectedDepartment,
    resetFilters,
  } = useOlapFilter();

  const [isOpen, setIsOpen] = useState(false);

  const toggleStore = (code: number) => {
    if (selectedStores.includes(code)) {
      if (selectedStores.length > 1) {
        setSelectedStores(selectedStores.filter((id) => id !== code));
      }
    } else {
      setSelectedStores([...selectedStores, code]);
    }
  };

  const toggleMonth = (m: string) => {
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter((item) => item !== m));
      }
    } else {
      setSelectedMonths([...selectedMonths, m]);
    }
  };

  const activeFilterCount =
    (selectedStores.length !== availableStores.length ? 1 : 0) +
    (selectedMonths.length !== availableMonths.length ? 1 : 0) +
    (selectedDivision !== "All" ? 1 : 0) +
    (selectedDepartment !== "All" ? 1 : 0);

  return (
    <div className="sticky top-16 z-30 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs p-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Active Filter Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-left group"
          >
            <span className="flex h-3 w-3 rounded-full bg-brand-500 animate-pulse"></span>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white uppercase tracking-wider group-hover:text-brand-500 transition-colors">
              OLAP Slice & Dice Filters
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

      {/* Filter Body - Expandable Dropdown */}
      {isOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Outlets Multi-Select */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Store Outlets ({selectedStores.length}/{availableStores.length})
          </label>
          {isLoadingLocations ? (
            <div className="h-9 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availableStores.map((store) => {
                const isSelected = selectedStores.includes(store.admsite_code);
                return (
                  <button
                    key={store.admsite_code}
                    onClick={() => toggleStore(store.admsite_code)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                      isSelected
                        ? "bg-brand-500 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {store.name.replace("M Baazar - ", "")}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Period Months Multi-Select */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Operational Period (Q2 2026)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableMonths.map((m) => {
              const isSelected = selectedMonths.includes(m);
              const monthLabel = m === "2026-04" ? "April 26" : m === "2026-05" ? "May 26" : "June 26";
              return (
                <button
                  key={m}
                  onClick={() => toggleMonth(m)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {monthLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Division & Department Filter */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            >
              <option value="All">All Divisions</option>
              <option value="MENS">MENS</option>
              <option value="LADIES">LADIES</option>
              <option value="KIDS">KIDS</option>
              <option value="NON-APPAREL">NON-APPAREL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            >
              <option value="All">All Departments</option>
              <option value="MENS SHIRTS">MENS SHIRTS</option>
              <option value="MENS DENIMS">MENS DENIMS</option>
              <option value="LADIES TOPS">LADIES TOPS</option>
              <option value="KIDS WEAR">KIDS WEAR</option>
            </select>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
