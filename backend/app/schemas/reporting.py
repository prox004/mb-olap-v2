from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime


FieldRole = Literal["dimension", "measure"]
VizType = Literal["table", "bar", "line", "pie", "kpi"]
FilterOperator = Literal[
    "eq", "neq", "in", "not_in", "gt", "gte", "lt", "lte", "contains", "between"
]
SortDirection = Literal["asc", "desc"]


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
    measures: List[str] = Field(default_factory=list, description="Measure field IDs")
    filters: List[FilterClause] = Field(default_factory=list)
    sort: List[SortClause] = Field(default_factory=list)
    limit: int = Field(default=500, ge=1, le=10000)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=500)


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
