import { ExecutiveKPIs } from "@/hooks/useExecutiveData";

export type KpiFormat = "currency" | "number" | "percent";

export interface KpiMeta {
  label: string;
  format: KpiFormat;
  description?: string;
}

export const KPI_METADATA: Record<keyof ExecutiveKPIs, KpiMeta> = {
  total_revenue: { label: "Total Sales Revenue", format: "currency" },
  total_sales_units: { label: "Quantity Sold", format: "number" },
  total_gross_profit: { label: "Gross Profit", format: "currency" },
  gross_margin_pct: { label: "Gross Margin %", format: "percent" },
  total_inventory_value: { label: "Closing Stock Value", format: "currency" },
  total_inventory_units: { label: "Closing Stock Units", format: "number" },
  sell_through_pct: { label: "Sell-Through %", format: "percent" },
  average_woc: { label: "Weeks of Cover", format: "number" },
};

export function getKpiKeys(): (keyof ExecutiveKPIs)[] {
  return Object.keys(KPI_METADATA) as (keyof ExecutiveKPIs)[];
}
