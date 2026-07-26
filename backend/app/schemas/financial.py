from pydantic import BaseModel
from typing import List, Optional

class GmroiItem(BaseModel):
    admsite_code: Optional[int] = None
    store_name: Optional[str] = None
    division: Optional[str] = None
    department: Optional[str] = None
    vendor_name: Optional[str] = None
    barcode: Optional[str] = None
    item_name: Optional[str] = None
    total_revenue: float
    total_gross_profit: float
    avg_inventory_value: float
    gmroi_ratio: float

class BuyingAccuracyItem(BaseModel):
    department: str
    total_bought_units: float
    total_bought_value: float
    total_sold_units: float
    total_sold_value: float
    unsold_units: float
    unsold_value: float
    total_discount_amount: float
    total_promo_amount: float
    buying_accuracy_pct: float

class MarkdownSummaryItem(BaseModel):
    total_discount_amount: float
    total_promo_amount: float
    total_gross_profit: float
    total_adjusted_gross_profit: float
