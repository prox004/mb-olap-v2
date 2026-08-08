import { ExecutiveKPIs, SKURankingItem } from "@/hooks/useExecutiveData";
import { CategoryHierarchyItem } from "@/hooks/useCategoryData";

export interface ComparisonSelection {
  storeId: number | null;
  month: string | null;
  date: string | null;
}

export interface ComparisonFilters {
  division: string;
  department: string;
}

export interface ComparisonDateConfig {
  dateField: string | null;
  compareBy: CompareByUnit;
  dateRange: DateRangePreset;
  customFrom?: string;
  customTo?: string;
  comparePeriods: boolean;
}

export const DEFAULT_COMPARISON_DATE_CONFIG: ComparisonDateConfig = {
  dateField: null,
  compareBy: "month",
  dateRange: "this_month",
  comparePeriods: false,
};

export interface ComparisonSideData {
  storeId: number;
  storeName: string;
  month: string;
  date?: string | null;
  kpis: ExecutiveKPIs;
  departments: CategoryHierarchyItem[];
  topSkus: SKURankingItem[];
  bottomSkus: SKURankingItem[];
}

export interface ComparisonReport {
  left: ComparisonSideData;
  right: ComparisonSideData;
  generatedAt: string;
}

export type DateRangePreset =
  | "all_time"
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export type CompareByUnit = "date" | "day" | "week" | "month" | "quarter" | "year";

export interface ComparisonTableConfig {
  dimension: string | null;
  metric: string | null;
  dateField: string | null;
  compareBy: CompareByUnit;
  dateRange: DateRangePreset;
  customFrom?: string;
  customTo?: string;
  comparePeriods: boolean;
}

export const DEFAULT_COMPARISON_TABLE_CONFIG: ComparisonTableConfig = {
  dimension: null,
  metric: null,
  dateField: null,
  compareBy: "month",
  dateRange: "this_month",
  comparePeriods: false,
};
