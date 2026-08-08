from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import uuid


FieldRole = Literal["dimension", "measure"]
VizType = Literal["table", "bar", "line", "pie", "kpi", "pivot"]
AggregationType = Literal[
    "sum", "avg", "count", "count_distinct", "min", "max", "median", "stddev", "variance"
]
FilterOperator = Literal[
    "eq", "neq", "in", "not_in", "gt", "gte", "lt", "lte", "contains", "between",
    "starts_with", "ends_with", "is_empty", "is_not_empty"
]
SortDirection = Literal["asc", "desc"]
DateGrouping = Literal["year", "quarter", "month", "week", "day"]
NumberFormat = Literal["auto", "number", "currency", "percent", "decimal", "accounting"]


class PivotFieldConfig(BaseModel):
    field_id: str
    label: Optional[str] = None
    grouping: Optional[DateGrouping] = None
    sort: SortDirection = "asc"


class ValueFieldConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    field_id: str
    aggregation: AggregationType = "sum"
    display_name: Optional[str] = None
    format: NumberFormat = "auto"
    decimals: int = 2
    show_as: Literal[
        "value", "pct_grand_total", "pct_row_total", "pct_column_total", "running_total"
    ] = "value"


class ReportOptions(BaseModel):
    show_grand_totals: bool = True
    show_row_subtotals: bool = True
    show_column_subtotals: bool = True
    layout: Literal["compact", "tabular", "outline"] = "compact"


class FieldRef(BaseModel):
    field_id: str
    role: FieldRole


class FilterClause(BaseModel):
    field_id: str
    operator: FilterOperator
    value: Union[str, int, float, List[Any], None] = None
    values: Optional[List[Any]] = None


class SortClause(BaseModel):
    field_id: str
    direction: SortDirection = "desc"
    role: FieldRole = "measure"


class ReportDefinition(BaseModel):
    dataset_id: str
    name: str = "Untitled Report"
    visualization: VizType = "table"
    rows: List[str] = Field(default_factory=list, description="Dimension field IDs on rows")
    columns: List[str] = Field(default_factory=list, description="Dimension field IDs on columns")
    measures: List[str] = Field(default_factory=list, description="Legacy measure field IDs")
    value_fields: List[ValueFieldConfig] = Field(default_factory=list, description="Pivot value fields")
    filters: List[FilterClause] = Field(default_factory=list)
    sort: List[SortClause] = Field(default_factory=list)
    options: ReportOptions = Field(default_factory=ReportOptions)
    limit: int = Field(default=500, ge=1, le=10000)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=500)

    @field_validator("rows", "columns", "measures", mode="before")
    @classmethod
    def coerce_legacy_fields(cls, v):
        if v is None:
            return []
        return v


class DimensionMeta(BaseModel):
    id: str
    label: str
    data_type: str
    category: str
    high_cardinality: bool = False
    description: Optional[str] = None


class MeasureMeta(BaseModel):
    id: str
    label: str
    format: str
    description: Optional[str] = None


class DatasetMeta(BaseModel):
    id: str
    label: str
    description: str
    dimensions: List[DimensionMeta]
    measures: List[MeasureMeta]


class FieldValueOption(BaseModel):
    value: str
    label: str
    count: Optional[int] = None


class PreviewRequest(BaseModel):
    report: ReportDefinition


class PreviewResponse(BaseModel):
    sql: str
    columns: List[str]
    data: List[Dict[str, Any]]
    record_count: int
    total_count: int
    page: int
    page_size: int
    visualization: VizType


class SavedReportSummary(BaseModel):
    id: str
    name: str
    dataset_id: str
    visualization: VizType
    created_at: str
    updated_at: str


class SavedReport(BaseModel):
    id: str
    name: str
    definition: ReportDefinition
    created_at: str
    updated_at: str
