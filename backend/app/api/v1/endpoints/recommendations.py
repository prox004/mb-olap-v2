import uuid
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query

from backend.app.api.deps import get_clickhouse_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.recommendations import (
    RecommendationItem,
    RecommendationSummaryResponse,
    ActionApplyRequest,
    ActionApplyResponse,
)
from backend.app.services.recommendation_agent import recommendation_agent

router = APIRouter()

@router.get("/feed", response_model=StandardResponse[Optional[List[RecommendationItem]]])
def get_recommendation_feed(
    category: Optional[str] = Query(None, enum=["REORDER", "TRANSFER", "MARKDOWN"]),
    priority: Optional[str] = Query(None, enum=["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0),
    department: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Any = Depends(get_clickhouse_db),
):
    """
    Returns AI-generated actionable recommendation feed with deterministic confidence scores and predicted financial impact.
    Routes directly and exclusively to the RecommendationAgent backed by ClickHouse.
    """
    items, meta = recommendation_agent.generate_recommendations(
        db=db,
        category=category,
        priority=priority,
        min_confidence=min_confidence,
        department=department,
        limit=limit,
        offset=offset
    )

    if not meta.get("supported", True):
        return StandardResponse(
            success=True,
            data=[],
            meta=FilterMeta(total_records=0),
            supported=False,
            message=meta.get("message", "Requested recommendation category is not supported by warehouse data.")
        )

    return StandardResponse(
        success=True,
        data=items,
        meta=FilterMeta(total_records=meta.get("total_count", len(items))),
        supported=True
    )


@router.get("/summary", response_model=StandardResponse[Optional[RecommendationSummaryResponse]])
def get_recommendation_summary(db: Any = Depends(get_clickhouse_db)):
    """
    Returns overall recommendation summary metrics, recommendation category breakdown, and financial impact.
    Routes directly and exclusively to the RecommendationAgent backed by ClickHouse.
    """
    summary = recommendation_agent.get_summary(db)
    return StandardResponse(success=True, data=summary, supported=True)


@router.post("/apply-action", response_model=StandardResponse[ActionApplyResponse])
def apply_recommendation_action(
    request: ActionApplyRequest,
):
    """
    Simulates executing an ML inventory recommendation trigger (generating Purchase Orders, STO Transfer Orders, or Markdown Schedules).
    """
    order_ref = f"AI-{request.action_type[:3]}-{uuid.uuid4().hex[:8].upper()}"
    msg = f"Recommendation {request.recommendation_id} for barcode {request.barcode} successfully executed. Created order reference {order_ref}."

    result = ActionApplyResponse(
        success=True,
        message=msg,
        order_reference=order_ref,
    )

    return StandardResponse(success=True, data=result)
