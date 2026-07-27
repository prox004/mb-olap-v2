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
  isLoadingMonths: boolean;
};

export type OlapFilterContextType = OlapFilterState & {
  setSelectedStores: (stores: number[]) => void;
  setSelectedMonths: (months: string[]) => void;
  setSelectedDivision: (division: string) => void;
  setSelectedDepartment: (department: string) => void;
  resetFilters: () => void;
};

const OlapFilterContext = createContext<OlapFilterContextType | undefined>(undefined);

export function OlapFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedStores, setSelectedStores] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("All");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  
  const [availableStores, setAvailableStores] = useState<LocationOption[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);
  const [isLoadingMonths, setIsLoadingMonths] = useState<boolean>(true);

  useEffect(() => {
    async function loadMasterData() {
      try {
        setIsLoadingLocations(true);
        setIsLoadingMonths(true);
        
        const [locRes, monthRes] = await Promise.all([
          apiClient<{ success: boolean; data: LocationOption[] }>("/locations"),
          apiClient<{ success: boolean; data: string[] }>("/months")
        ]);

        if (locRes.success && Array.isArray(locRes.data)) {
          setAvailableStores(locRes.data);
          const allStoreIds = locRes.data.map((loc: LocationOption) => loc.admsite_code);
          setSelectedStores(allStoreIds);
        }

        if (monthRes.success && Array.isArray(monthRes.data)) {
          setAvailableMonths(monthRes.data);
          setSelectedMonths(monthRes.data);
        }
      } catch (err) {
        console.error("Failed to load filter metadata:", err);
      } finally {
        setIsLoadingLocations(false);
        setIsLoadingMonths(false);
      }
    }

    loadMasterData();
  }, []);

  const resetFilters = () => {
    const allStoreIds = availableStores.map((loc) => loc.admsite_code);
    setSelectedStores(allStoreIds);
    setSelectedMonths(availableMonths);
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
        availableMonths,
        isLoadingLocations,
        isLoadingMonths,
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
