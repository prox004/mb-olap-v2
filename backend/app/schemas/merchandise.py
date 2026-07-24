from pydantic import BaseModel
from typing import List, Optional

class SkuVelocityItem(BaseModel):
    barcode: str
    description: Optional[str] = None
    division: Optional[str] = None
    section: Optional[str] = None
    department: Optional[str] = None
    vendor: Optional[str] = None
    mrp: float
    cost_rate: float
    net_revenue: float
    sales_units: float
    gross_profit: float
    closing_stock_units: float
    closing_stock_value: float
    sell_through_pct: float
    woc: float
    moi: float
    velocity_status: str # FAST_MOVER, MEDIUM_MOVER, SLOW_MOVER, DEAD_STOCK

class SkuVelocityResponse(BaseModel):
    total_records: int
    page: int
    page_size: int
    items: List[SkuVelocityItem]

class DeadStockSummary(BaseModel):
    total_dead_skus: int
    total_locked_capital: float
    items: List[SkuVelocityItem]

class VelocityBreakdownItem(BaseModel):
    velocity_status: str
    sku_count: int
    closing_stock_value: float
