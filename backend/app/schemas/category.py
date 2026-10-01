from pydantic import BaseModel
from typing import List, Optional

class CategoryHierarchyItem(BaseModel):
    division: str
    section: Optional[str] = "ALL"
    department: Optional[str] = "ALL"
    department_alias: Optional[str] = "ALL"
    net_revenue: float
    sales_units: float
    gross_profit: float
    margin_pct: float
    closing_stock_value: Optional[float] = None
    closing_stock_units: Optional[float] = None
    sell_through_pct: Optional[float] = None
    woc: Optional[float] = None

class CategoryMatrixItem(BaseModel):
    department: str
    division: Optional[str] = None
    net_revenue: float
    sales_units: float
    gross_profit: float
    margin_pct: float
    closing_stock_value: Optional[float] = None
    closing_stock_units: Optional[float] = None
    sell_through_pct: Optional[float] = None
    woc: Optional[float] = None
    performance_quadrant: str # WINNER, VOLUME_DRIVER, HIGH_MARGIN_SLOW, OVERSTOCKED_UNDERPERFORMER

class TopMoversResponse(BaseModel):
    fastest_movers: List[CategoryMatrixItem]
    underperformers: List[CategoryMatrixItem]

class CategoryGrowthItem(BaseModel):
    department: str
    division: Optional[str] = "UNKNOWN"
    month: Optional[str] = None
    current_revenue: float
    prior_revenue: Optional[float] = None
    revenue_growth_pct: Optional[float] = None
    current_units: float
    prior_units: Optional[float] = None
    units_growth_pct: Optional[float] = None

