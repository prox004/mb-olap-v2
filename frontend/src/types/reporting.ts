export type VizType = "table" | "bar" | "line" | "pie" | "kpi";

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
  | "between";

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

export interface ReportDefinition {
  dataset_id: string;
  name: string;
  visualization: VizType;
  rows: string[];
  measures: string[];
  filters: FilterClause[];
  sort: SortClause[];
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

export const DEFAULT_REPORT: ReportDefinition = {
  dataset_id: "sales_inventory",
  name: "Untitled Report",
  visualization: "table",
  rows: [],
  measures: [],
  filters: [],
  sort: [],
  limit: 500,
  page: 1,
  page_size: 50,
};

export const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "in", label: "in list" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
];

export const VIZ_OPTIONS: { value: VizType; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "kpi", label: "KPI Card" },
];
