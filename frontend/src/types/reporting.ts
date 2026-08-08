export type VizType = "table" | "bar" | "line" | "pie" | "kpi" | "pivot";

export type AggregationType =
  | "sum"
  | "avg"
  | "count"
  | "count_distinct"
  | "min"
  | "max"
  | "median"
  | "stddev"
  | "variance";

export type NumberFormat = "auto" | "number" | "currency" | "percent" | "decimal" | "accounting";

export type FilterOperator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "between"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty";

export interface FilterClause {
  field_id: string;
  operator: FilterOperator;
  value?: string | number | null;
  values?: (string | number)[];
}

export interface SortClause {
  field_id: string;
  direction: "asc" | "desc";
  role: "dimension" | "measure";
}

export interface ValueFieldConfig {
  id: string;
  field_id: string;
  aggregation: AggregationType;
  display_name?: string;
  format?: NumberFormat;
  decimals?: number;
  show_as?: "value" | "pct_grand_total" | "pct_row_total" | "pct_column_total" | "running_total";
}

export interface ReportOptions {
  show_grand_totals: boolean;
  show_row_subtotals: boolean;
  show_column_subtotals: boolean;
  layout: "compact" | "tabular" | "outline";
}

export interface ReportDefinition {
  dataset_id: string;
  name: string;
  visualization: VizType;
  rows: string[];
  columns: string[];
  measures: string[];
  value_fields: ValueFieldConfig[];
  filters: FilterClause[];
  sort: SortClause[];
  options: ReportOptions;
  limit: number;
  page: number;
  page_size: number;
}

export interface DimensionMeta {
  id: string;
  label: string;
  data_type: string;
  category: string;
  high_cardinality: boolean;
  description?: string;
}

export interface MeasureMeta {
  id: string;
  label: string;
  format: string;
  description?: string;
}

export interface DatasetMeta {
  id: string;
  label: string;
  description: string;
  dimensions: DimensionMeta[];
  measures: MeasureMeta[];
}

export interface PreviewResponse {
  sql: string;
  columns: string[];
  data: Record<string, unknown>[];
  record_count: number;
  total_count: number;
  page: number;
  page_size: number;
  visualization: VizType;
}

export interface SavedReportSummary {
  id: string;
  name: string;
  dataset_id: string;
  visualization: VizType;
  created_at: string;
  updated_at: string;
}

export interface SavedReport {
  id: string;
  name: string;
  definition: ReportDefinition;
  created_at: string;
  updated_at: string;
}

export interface FieldValueOption {
  value: string;
  label: string;
  count?: number;
}

export type PivotZone = "filters" | "columns" | "rows" | "values";

export const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  show_grand_totals: true,
  show_row_subtotals: true,
  show_column_subtotals: true,
  layout: "compact",
};

export const DEFAULT_REPORT: ReportDefinition = {
  dataset_id: "sales_inventory",
  name: "Untitled Report",
  visualization: "pivot",
  rows: [],
  columns: [],
  measures: [],
  value_fields: [],
  filters: [],
  sort: [],
  options: { ...DEFAULT_REPORT_OPTIONS },
  limit: 500,
  page: 1,
  page_size: 50,
};

export const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "count", label: "Count" },
  { value: "count_distinct", label: "Count Distinct" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "median", label: "Median" },
  { value: "stddev", label: "Std Dev" },
  { value: "variance", label: "Variance" },
];

export const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "in", label: "in list" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "between", label: "between" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

export const VIZ_OPTIONS: { value: VizType; label: string }[] = [
  { value: "pivot", label: "Pivot Table" },
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "kpi", label: "KPI Card" },
];

export function createValueField(fieldId: string, aggregation: AggregationType = "sum"): ValueFieldConfig {
  return {
    id: `vf_${fieldId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    field_id: fieldId,
    aggregation,
    format: "auto",
    decimals: 2,
    show_as: "value",
  };
}

export function normalizeReport(def: Partial<ReportDefinition>): ReportDefinition {
  const base = { ...DEFAULT_REPORT, ...def };
  if ((!base.value_fields || base.value_fields.length === 0) && base.measures?.length) {
    base.value_fields = base.measures.map((m) => createValueField(m, "sum"));
  }
  if (!base.columns) base.columns = [];
  if (!base.options) base.options = { ...DEFAULT_REPORT_OPTIONS };
  return base as ReportDefinition;
}

export function fieldTypeIcon(dataType: string): string {
  const t = dataType.toLowerCase();
  if (t.includes("date") || t.includes("time")) return "📅";
  if (t.includes("bool")) return "⏻";
  if (t.includes("int") || t.includes("float") || t.includes("number") || t.includes("decimal")) return "#";
  if (t.includes("currency")) return "₹";
  if (t.includes("percent")) return "%";
  return "Aa";
}
