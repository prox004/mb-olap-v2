from pydantic import BaseModel
from typing import List, Optional

class StoreStockCoverItem(BaseModel):
    admsite_code: int
    store_name: str
    site_type: Optional[str] = "RETAIL_STORE"
    department: str
    sales_units: float
    revenue: float
    stock_units: float
    stock_value: float
    transfer_in_units: float
    transfer_out_units: float
    wh_transfer_in_units: float
    store_woc: float
    stock_health_status: str # HIGH_RISK_STOCKOUT, OVERSTOCKED, BALANCED

class RebalanceRecommendationItem(BaseModel):
    barcode: str
    description: Optional[str] = None
    department: Optional[str] = None
    source_store_code: int
    source_store_name: str
    source_stock: float
    source_woc: float
    target_store_code: int
    target_store_name: str
    target_stock: float
    target_woc: float
    recommended_transfer_qty: int
    transfer_type: str # DC_REPLENISHMENT, LATERAL_REBALANCE
    urgency_level: str # CRITICAL, HIGH, MEDIUM

class TransferHistoryItem(BaseModel):
    admsite_code: int
    store_name: str
    site_type: str
    transfer_in_units: float
    transfer_out_units: float
    wh_transfer_in_units: float
    net_transfer_flow: float
