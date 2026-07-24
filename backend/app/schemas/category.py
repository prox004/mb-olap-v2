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
    closing_stock_value: float
    closing_stock_units: float
    sell_through_pct: float
    woc: float

class CategoryMatrixItem(BaseModel):
    department: str
    division: Optional[str] = None
    net_revenue: float
    sales_units: float
    gross_profit: float
    margin_pct: float
    closing_stock_value: float
    closing_stock_units: float
    sell_through_pct: float
    woc: float
    performance_quadrant: str # WINNER, VOLUME_DRIVER, HIGH_MARGIN_SLOW, OVERSTOCKED_UNDERPERFORMER

class TopMoversResponse(BaseModel):
    fastest_movers: List[CategoryMatrixItem]
    underperformers: List[CategoryMatrixItem]
