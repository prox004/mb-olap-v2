from pydantic import BaseModel
from typing import List, Optional

class RecommendationItem(BaseModel):
    id: str
    category: str # REORDER, TRANSFER, MARKDOWN
    priority: str # CRITICAL, HIGH, MEDIUM, LOW
    confidence_score: float # e.g. 94.5 (formatted percentage)
    barcode: str
    title: Optional[str] = None
    department: Optional[str] = None
    division: Optional[str] = None
    message: str
    action_quantity: int
    recommended_discount_pct: Optional[float] = 0.0
    estimated_financial_impact: float
    source_store_code: Optional[int] = None
    source_store_name: Optional[str] = None
    target_store_code: Optional[int] = None
    target_store_name: Optional[str] = None

class RecommendationSummaryResponse(BaseModel):
    total_recommendations: int
    reorder_count: int
    transfer_count: int
    markdown_count: int
    avg_confidence_score: float
    total_financial_impact: float

class ActionApplyRequest(BaseModel):
    recommendation_id: str
    barcode: str
    action_type: str # REORDER, TRANSFER, MARKDOWN
    action_quantity: Optional[int] = None
    notes: Optional[str] = None

class ActionApplyResponse(BaseModel):
    success: bool
    message: str
    order_reference: str
