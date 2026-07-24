from pydantic import BaseModel
from typing import List, Optional

class ExecutiveKPIs(BaseModel):
    total_revenue: float
    total_sales_units: float
    total_gross_profit: float
    gross_margin_pct: float
    total_inventory_value: float
    total_inventory_units: float
    sell_through_pct: float
    average_woc: float

class StoreRankingItem(BaseModel):
    admsite_code: int
    store_name: str
    store_revenue: float
    store_sales_units: float
    store_gross_profit: float
    store_margin_pct: float
    store_stock_value: float
    store_stock_units: float
    store_woc: float

class SKURankingItem(BaseModel):
    barcode: str
    item_description: Optional[str] = None
    division: Optional[str] = None
    department: Optional[str] = None
    sku_revenue: float
    sku_sales_units: float
    sku_gross_profit: float
    current_stock_units: float

class TopBottomSkusResponse(BaseModel):
    top_skus: List[SKURankingItem]
    bottom_skus: List[SKURankingItem]

class MonthlyTrendItem(BaseModel):
    month_name: str
    revenue: float
    gross_profit: float
    gross_margin_pct: float
    inventory_value: float
