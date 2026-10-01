"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/utils/apiClient";

export type LocationOption = {
  admsite_code: number;
  name: string;
  site_type?: string;
};

export type OlapFilterState = {
  selectedStores: number[];
  selectedMonths: string[];
  selectedDivision: string;
  selectedDepartment: string;
  availableStores: LocationOption[];
  availableMonths: string[];
  availableDivisions: string[];
  availableDepartments: string[];
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

const DEFAULT_DIVISIONS = [
  "Accessories 1",
  "Accessories 2",
  "Kids Wear",
  "Ladies Wear",
  "Mens Wear",
  "Winter Garments",
];

const OlapFilterContext = createContext<OlapFilterContextType | undefined>(undefined);

export function OlapFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedStores, setSelectedStores] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("All");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  
  const [availableStores, setAvailableStores] = useState<LocationOption[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableDivisions, setAvailableDivisions] = useState<string[]>(DEFAULT_DIVISIONS);
  const [hierarchyData, setHierarchyData] = useState<{ division: string; department: string }[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);
  const [isLoadingMonths, setIsLoadingMonths] = useState<boolean>(true);

  useEffect(() => {
    async function loadMasterData() {
      try {
        setIsLoadingLocations(true);
        setIsLoadingMonths(true);
        
        const results = await Promise.allSettled([
          apiClient<{ success: boolean; data: LocationOption[] }>("/locations"),
          apiClient<{ success: boolean; data: string[] }>("/months"),
          apiClient<{ success: boolean; data: { division: string; department: string }[] }>("/category/hierarchy"),
        ]);

        const locRes = results[0].status === "fulfilled" ? results[0].value : null;
        const monthRes = results[1].status === "fulfilled" ? results[1].value : null;
        const hierRes = results[2].status === "fulfilled" ? results[2].value : null;

        if (locRes?.success && Array.isArray(locRes.data)) {
          setAvailableStores(locRes.data);
          const allStoreIds = locRes.data.map((loc: LocationOption) => loc.admsite_code);
          setSelectedStores(allStoreIds);
        }

        if (monthRes?.success && Array.isArray(monthRes.data)) {
          setAvailableMonths(monthRes.data);
          setSelectedMonths(monthRes.data);
        }

        if (hierRes?.success && Array.isArray(hierRes.data)) {
          setHierarchyData(hierRes.data);
          const divs = Array.from(new Set(hierRes.data.map((h) => h.division).filter(Boolean))).sort();
          if (divs.length > 0) {
            setAvailableDivisions(divs);
          }
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

  // Compute available departments based on selectedDivision
  const availableDepartments = React.useMemo(() => {
    if (hierarchyData.length === 0) return [];
    const filtered = selectedDivision === "All"
      ? hierarchyData
      : hierarchyData.filter((h) => h.division === selectedDivision);
    return Array.from(new Set(filtered.map((h) => h.department).filter(Boolean))).sort();
  }, [hierarchyData, selectedDivision]);

  const handleSetDivision = (division: string) => {
    setSelectedDivision(division);
    setSelectedDepartment("All");
  };

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
        availableDivisions,
        availableDepartments,
        isLoadingLocations,
        isLoadingMonths,
        setSelectedStores,
        setSelectedMonths,
        setSelectedDivision: handleSetDivision,
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
