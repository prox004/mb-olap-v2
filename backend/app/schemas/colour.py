from pydantic import BaseModel
from typing import List, Optional

class ColourPerformanceItem(BaseModel):
    extracted_colour: str
    division: Optional[str] = "ALL"
    department: Optional[str] = "ALL"
    total_skus: int
    sales_units: float
    net_revenue: float
    gross_profit: float
    margin_pct: float
    current_stock_units: float
    current_stock_value: float
    sell_through_pct: float

class ColourSummaryResponse(BaseModel):
    total_colours: int
    top_colour_by_revenue: str
    items: List[ColourPerformanceItem]

class TopColoursResponse(BaseModel):
    top_performers: List[ColourPerformanceItem]
    underperformers: List[ColourPerformanceItem]
