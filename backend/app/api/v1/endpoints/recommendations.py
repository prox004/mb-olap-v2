import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.recommendations import (
    RecommendationItem,
    RecommendationSummaryResponse,
    ActionApplyRequest,
    ActionApplyResponse,
)

router = APIRouter()

@router.get("/feed", response_model=StandardResponse[List[RecommendationItem]])
def get_recommendation_feed(
    category: Optional[str] = Query(None, enum=["REORDER", "TRANSFER", "MARKDOWN"]),
    priority: Optional[str] = Query(None, enum=["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0),
    department: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns Machine Learning generated actionable recommendation feed with confidence scores and predicted financial impact.
    """
    conditions = []
    params = []

    if category and category.lower() != "all":
        conditions.append("v.category = ?")
        params.append(category)

    if priority and priority.lower() != "all":
        conditions.append("v.priority = ?")
        params.append(priority)

    if min_confidence:
        conditions.append("v.confidence_score >= ?")
        params.append(min_confidence)

    if department and department.lower() != "all":
        conditions.append("UPPER(v.department) LIKE ?")
        params.append(f"%{department.strip().upper()}%")

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    query = f"""
    SELECT
        v.id,
        v.category,
        v.priority,
        v.confidence_score,
        v.barcode,
        v.title,
        v.department,
        v.division,
        v.message,
        v.action_quantity,
        v.recommended_discount_pct,
        v.estimated_financial_impact,
        v.source_store_code,
        v.source_store_name,
        v.target_store_code,
        v.target_store_name
    FROM v_ai_recommendations_feed v
    {where_clause}
    ORDER BY v.confidence_score DESC, v.estimated_financial_impact DESC
    LIMIT {limit} OFFSET {offset};
    """

    rows = db.execute(query, params).fetchall()
    items = [
        RecommendationItem(
            id=row[0],
            category=row[1],
            priority=row[2],
            confidence_score=float(row[3]),
            barcode=row[4],
            title=row[5] or row[4],
            department=row[6] or "UNKNOWN",
            division=row[7] or "UNKNOWN",
            message=row[8],
            action_quantity=int(row[9]),
            recommended_discount_pct=float(row[10] or 0.0),
            estimated_financial_impact=float(row[11] or 0.0),
            source_store_code=row[12],
            source_store_name=row[13],
            target_store_code=row[14],
            target_store_name=row[15],
        )
        for row in rows
    ]

    meta = FilterMeta(total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/summary", response_model=StandardResponse[RecommendationSummaryResponse])
def get_recommendation_summary(db: DuckDBPyConnection = Depends(get_db)):
    """
    Returns overall Machine Learning model performance metrics, recommendation category breakdown, and financial impact.
    """
    query = """
    SELECT
        COUNT(*) AS total_count,
        COUNT(CASE WHEN category = 'REORDER' THEN 1 END) AS reorder_count,
        COUNT(CASE WHEN category = 'TRANSFER' THEN 1 END) AS transfer_count,
        COUNT(CASE WHEN category = 'MARKDOWN' THEN 1 END) AS markdown_count,
        COALESCE(ROUND(AVG(confidence_score), 1), 0.0) AS avg_confidence,
        COALESCE(ROUND(SUM(estimated_financial_impact), 2), 0.0) AS total_financial_impact
    FROM v_ai_recommendations_feed;
    """

    row = db.execute(query).fetchone()
    summary = RecommendationSummaryResponse(
        total_recommendations=int(row[0]),
        reorder_count=int(row[1]),
        transfer_count=int(row[2]),
        markdown_count=int(row[3]),
        avg_confidence_score=float(row[4]),
        total_financial_impact=float(row[5]),
    )

    return StandardResponse(success=True, data=summary)


@router.post("/apply-action", response_model=StandardResponse[ActionApplyResponse])
def apply_recommendation_action(
    request: ActionApplyRequest,
    db: DuckDBPyConnection = Depends(get_db),
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
