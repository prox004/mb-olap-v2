import { ExecutiveKPIs, SKURankingItem } from "@/hooks/useExecutiveData";
import { CategoryHierarchyItem } from "@/hooks/useCategoryData";

export interface ComparisonSelection {
  storeId: number | null;
  month: string | null;
}

export interface ComparisonFilters {
  division: string;
  department: string;
}

export interface ComparisonSideData {
  storeId: number;
  storeName: string;
  month: string;
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
