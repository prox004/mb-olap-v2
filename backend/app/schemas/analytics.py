from pydantic import BaseModel
from typing import List, Optional

class SizeCurveItem(BaseModel):
    division: str
    department: str
    size_code: str
    total_bought_units: float
    total_sold_units: float
    current_stock_units: float
    net_revenue: float
    size_contribution_pct: float

class PriceBandItem(BaseModel):
    price_band: str
    department: Optional[str]
    total_skus: int
    total_sales_units: float
    total_revenue: float
    total_gross_profit: float
    margin_pct: float
    stock_units: float

class SizeRecommendationRequest(BaseModel):
    department: str
    target_total_po_units: int

class SizeRecommendationItem(BaseModel):
    size_code: str
    historical_contribution_pct: float
    recommended_units: int

class SizeRecommendationResponse(BaseModel):
    department: str
    target_total_po_units: int
    recommendations: List[SizeRecommendationItem]
