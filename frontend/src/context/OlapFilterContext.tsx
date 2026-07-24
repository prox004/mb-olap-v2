"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/utils/apiClient";

export type LocationOption = {
  admsite_code: number;
  name: string;
};

export type OlapFilterState = {
  selectedStores: number[];
  selectedMonths: string[];
  selectedDivision: string;
  selectedDepartment: string;
  availableStores: LocationOption[];
  availableMonths: string[];
  isLoadingLocations: boolean;
};

export type OlapFilterContextType = OlapFilterState & {
  setSelectedStores: (stores: number[]) => void;
  setSelectedMonths: (months: string[]) => void;
  setSelectedDivision: (division: string) => void;
  setSelectedDepartment: (department: string) => void;
  resetFilters: () => void;
};

const DEFAULT_MONTHS = ["2026-04", "2026-05", "2026-06"];

const OlapFilterContext = createContext<OlapFilterContextType | undefined>(undefined);

export function OlapFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedStores, setSelectedStores] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(DEFAULT_MONTHS);
  const [selectedDivision, setSelectedDivision] = useState<string>("All");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  
  const [availableStores, setAvailableStores] = useState<LocationOption[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);

  useEffect(() => {
    async function loadLocations() {
      try {
        setIsLoadingLocations(true);
        const response = await apiClient<{ success: boolean; data: LocationOption[] }>("/locations");
        if (response.success && Array.isArray(response.data)) {
          setAvailableStores(response.data);
          // Default to all store IDs
          const allStoreIds = response.data.map((loc: LocationOption) => loc.admsite_code);
          setSelectedStores(allStoreIds);
        }
      } catch (err) {
        console.error("Failed to load store locations:", err);
      } finally {
        setIsLoadingLocations(false);
      }
    }

    loadLocations();
  }, []);

  const resetFilters = () => {
    const allStoreIds = availableStores.map((loc) => loc.admsite_code);
    setSelectedStores(allStoreIds);
    setSelectedMonths(DEFAULT_MONTHS);
    setSelectedDivision("All");
    setSelectedDepartment("All");
  };

  return (
    <OlapFilterContext.Provider
      value={{
        selectedStores,
        selectedMonths,
        selectedDivision,
        selectedDepartment,
        availableStores,
        availableMonths: DEFAULT_MONTHS,
        isLoadingLocations,
        setSelectedStores,
        setSelectedMonths,
        setSelectedDivision,
        setSelectedDepartment,
        resetFilters,
      }}
    >
      {children}
    </OlapFilterContext.Provider>
  );
}

export function useOlapFilter() {
  const context = useContext(OlapFilterContext);
  if (!context) {
    throw new Error("useOlapFilter must be used within an OlapFilterProvider");
  }
  return context;
}
