from pydantic import BaseModel
from typing import List, Optional

class VendorScorecardItem(BaseModel):
    vendor_name: str
    total_skus_supplied: int
    receive_units: float
    receive_value: float
    return_units: float
    return_value: float
    sales_units: float
    net_revenue: float
    gross_profit: float
    current_stock_units: float
    current_stock_value: float
    sell_through_pct: float
    margin_pct: float
    return_rate_pct: float
    vendor_score: float

class VendorListResponse(BaseModel):
    total_vendors: int
    items: List[VendorScorecardItem]
