"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/utils/apiClient";

export type LocationOption = {
  admsite_code: number;
  name: string;
  site_type?: string;
  state?: string;
};

export type OlapFilterState = {
  selectedStores: number[];
  selectedMonths: string[];
  selectedDivision: string;
  selectedDepartment: string;
  selectedState: string;
  selectedStates: string[];
  availableStores: LocationOption[];
  availableMonths: string[];
  availableDivisions: string[];
  availableDepartments: string[];
  availableStates: string[];
  isLoadingLocations: boolean;
  isLoadingMonths: boolean;
};

export type OlapFilterContextType = OlapFilterState & {
  setSelectedStores: (stores: number[]) => void;
  setSelectedMonths: (months: string[]) => void;
  setSelectedDivision: (division: string) => void;
  setSelectedDepartment: (department: string) => void;
  setSelectedState: (state: string) => void;
  setSelectedStates: (states: string[]) => void;
  toggleState: (state: string) => void;
  toggleStore: (code: number) => void;
  toggleMonth: (month: string) => void;
  toggleYear: (yearPrefix: string) => void;
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

  // Compute available states from availableStores
  const availableStates = React.useMemo(() => {
    const states = Array.from(
      new Set(
        availableStores
          .map((s) => s.state)
          .filter((st): st is string => Boolean(st))
      )
    ).sort();
    return states;
  }, [availableStores]);

  // Derived list of states currently represented in selectedStores
  const selectedStates = React.useMemo(() => {
    if (availableStores.length === 0 || selectedStores.length === 0) return [];
    const activeStates = Array.from(
      new Set(
        availableStores
          .filter((s) => selectedStores.includes(s.admsite_code))
          .map((s) => s.state)
          .filter((st): st is string => Boolean(st))
      )
    ).sort();
    return activeStates;
  }, [selectedStores, availableStores]);

  // Derive active selected state single string for backward compatibility
  const selectedState = React.useMemo(() => {
    if (availableStores.length === 0 || selectedStores.length === 0) return "All";
    if (selectedStores.length === availableStores.length) return "All";
    if (selectedStates.length === 1) return selectedStates[0];
    if (selectedStates.length === 0) return "None";
    return selectedStates.join(", ");
  }, [selectedStores, availableStores, selectedStates]);

  const toggleState = (state: string) => {
    const storesInState = availableStores
      .filter((s) => s.state?.toUpperCase() === state.toUpperCase())
      .map((s) => s.admsite_code);

    if (storesInState.length === 0) return;

    // Check if all stores of this state are currently selected
    const allSelected = storesInState.every((code) => selectedStores.includes(code));

    if (allSelected) {
      // Deselect all stores of this state
      const nextStores = selectedStores.filter((code) => !storesInState.includes(code));
      if (nextStores.length > 0) {
        setSelectedStores(nextStores);
      } else {
        // If everything would be deselected, reset to all instead of showing empty
        setSelectedStores(availableStores.map((s) => s.admsite_code));
      }
    } else {
      // Select all stores of this state
      const nextStores = Array.from(new Set([...selectedStores, ...storesInState]));
      setSelectedStores(nextStores);
    }
  };

  const handleSetSelectedStates = (states: string[]) => {
    if (states.length === 0 || states.length === availableStates.length) {
      const allStoreIds = availableStores.map((loc) => loc.admsite_code);
      setSelectedStores(allStoreIds);
    } else {
      const upperStates = states.map((s) => s.toUpperCase());
      const nextStores = availableStores
        .filter((s) => s.state && upperStates.includes(s.state.toUpperCase()))
        .map((s) => s.admsite_code);
      if (nextStores.length > 0) {
        setSelectedStores(nextStores);
      }
    }
  };

  const handleSetState = (state: string) => {
    if (state === "All" || state === selectedState) {
      const allStoreIds = availableStores.map((loc) => loc.admsite_code);
      setSelectedStores(allStoreIds);
    } else {
      const stateStores = availableStores
        .filter((s) => s.state?.toUpperCase() === state.toUpperCase())
        .map((s) => s.admsite_code);
      if (stateStores.length > 0) {
        setSelectedStores(stateStores);
      }
    }
  };

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

  const toggleYear = (yearPrefix: string) => {
    const yearMonths = availableMonths.filter((m) => m.startsWith(yearPrefix));
    const allSelected = yearMonths.every((m) => selectedMonths.includes(m));
    if (allSelected) {
      const remaining = selectedMonths.filter((m) => !m.startsWith(yearPrefix));
      if (remaining.length > 0) {
        setSelectedMonths(remaining);
      }
    } else {
      setSelectedMonths(Array.from(new Set([...selectedMonths, ...yearMonths])));
    }
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
        selectedState,
        selectedStates,
        availableStores,
        availableMonths,
        availableDivisions,
        availableDepartments,
        availableStates,
        isLoadingLocations,
        isLoadingMonths,
        setSelectedStores,
        setSelectedMonths,
        setSelectedDivision: handleSetDivision,
        setSelectedDepartment,
        setSelectedState: handleSetState,
        setSelectedStates: handleSetSelectedStates,
        toggleState,
        toggleStore,
        toggleMonth,
        toggleYear,
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
