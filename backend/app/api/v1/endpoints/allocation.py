from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.allocation import (
    StoreStockCoverItem,
    RebalanceRecommendationItem,
    TransferHistoryItem,
)
from backend.app.utils.query_builder import build_where_clause

router = APIRouter()

@router.get("/store-cover", response_model=StandardResponse[List[StoreStockCoverItem]])
def get_store_stock_cover(
    store_ids: Optional[List[int]] = Query(None),
    department: Optional[str] = Query(None),
    health_status: Optional[str] = Query(None, enum=["HIGH_RISK_STOCKOUT", "OVERSTOCKED", "BALANCED", "NEGATIVE_TRANSFER_LAG"]),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns store stock cover levels, inventory health status, and transfer balances per outlet and department.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        department=department,
        table_prefix="v"
    )

    if health_status:
        prefix = "WHERE " if not where_clause else f"{where_clause} AND "
        where_clause = f"{prefix}v.stock_health_status = ?"
        params.append(health_status)

    query = f"""
    SELECT
        v.admsite_code,
        v.store_name,
        v.site_type,
        v.department,
        v.sales_units,
        v.revenue,
        v.stock_units,
        v.stock_value,
        v.transfer_in_units,
        v.transfer_out_units,
        v.wh_transfer_in_units,
        v.store_woc,
        v.stock_health_status
    FROM v_store_stock_cover v
    {where_clause}
    ORDER BY v.sales_units DESC;
    """

    rows = db.execute(query, params).fetchall()
    items = [
        StoreStockCoverItem(
            admsite_code=row[0],
            store_name=row[1] or f"Store {row[0]}",
            site_type=row[2] or "RETAIL_STORE",
            department=row[3] or "UNKNOWN",
            sales_units=float(row[4]),
            revenue=float(row[5]),
            stock_units=float(row[6]),
            stock_value=float(row[7]),
            transfer_in_units=float(row[8]),
            transfer_out_units=float(row[9]),
            wh_transfer_in_units=float(row[10]),
            store_woc=float(row[11]),
            stock_health_status=row[12],
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/rebalance-recommendations", response_model=StandardResponse[List[RebalanceRecommendationItem]])
def get_rebalance_recommendations(
    source_store_code: Optional[int] = Query(None),
    target_store_code: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    transfer_type: Optional[str] = Query(None, enum=["DC_REPLENISHMENT", "LATERAL_REBALANCE"]),
    urgency_level: Optional[str] = Query(None, enum=["CRITICAL", "HIGH", "MEDIUM"]),
    min_transfer_qty: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns actionable inter-store transfer recommendations generated via real-life Min-Max WOC algorithm.
    """
    conditions = []
    params = []

    if source_store_code:
        conditions.append("v.source_store_code = ?")
        params.append(source_store_code)

    if target_store_code:
        conditions.append("v.target_store_code = ?")
        params.append(target_store_code)

    if department and department.lower() != "all":
        conditions.append("UPPER(v.department) LIKE ?")
        params.append(f"%{department.strip().upper()}%")

    if transfer_type:
        conditions.append("v.transfer_type = ?")
        params.append(transfer_type)

    if urgency_level:
        conditions.append("v.urgency_level = ?")
        params.append(urgency_level)

    if min_transfer_qty > 1:
        conditions.append("v.recommended_transfer_qty >= ?")
        params.append(min_transfer_qty)

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    query = f"""
    SELECT
        v.barcode,
        v.description,
        v.department,
        v.source_store_code,
        v.source_store_name,
        v.source_stock,
        v.source_woc,
        v.target_store_code,
        v.target_store_name,
        v.target_stock,
        v.target_woc,
        v.recommended_transfer_qty,
        v.transfer_type,
        v.urgency_level
    FROM v_rebalance_recommendations v
    {where_clause}
    ORDER BY 
        CASE v.urgency_level WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END ASC,
        v.recommended_transfer_qty DESC
    LIMIT {limit};
    """

    rows = db.execute(query, params).fetchall()
    items = [
        RebalanceRecommendationItem(
            barcode=row[0],
            description=row[1] or row[0],
            department=row[2] or "UNKNOWN",
            source_store_code=row[3],
            source_store_name=row[4],
            source_stock=float(row[5]),
            source_woc=float(row[6]),
            target_store_code=row[7],
            target_store_name=row[8],
            target_stock=float(row[9]),
            target_woc=float(row[10]),
            recommended_transfer_qty=int(row[11]),
            transfer_type=row[12],
            urgency_level=row[13],
        )
        for row in rows
    ]

    meta = FilterMeta(total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/transfer-history", response_model=StandardResponse[List[TransferHistoryItem]])
def get_transfer_history(
    store_ids: Optional[List[int]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns store location transfer movement history and net inventory flow across outlets.
    """
    where_clause, params = build_where_clause(store_ids=store_ids, table_prefix="f")

    query = f"""
    SELECT
        f.ADMSITE_CODE AS admsite_code,
        COALESCE(l.Name, 'Store ' || CAST(f.ADMSITE_CODE AS VARCHAR)) AS store_name,
        COALESCE(l.SITE_TYPE, CASE WHEN f.ADMSITE_CODE = 1070 THEN 'CENTRAL_WAREHOUSE' ELSE 'RETAIL_STORE' END) AS site_type,
        COALESCE(SUM(f.SITE_TRANSFER_IN_QUANTITY), 0.0) AS transfer_in_units,
        COALESCE(SUM(f.SITE_TRANSFER_OUT_QUANTITY), 0.0) AS transfer_out_units,
        COALESCE(SUM(f.WAREHOUSE_TRANSFER_IN_QUANTITY), 0.0) AS wh_transfer_in_units,
        COALESCE(SUM(f.SITE_TRANSFER_IN_QUANTITY) + SUM(f.WAREHOUSE_TRANSFER_IN_QUANTITY) - SUM(f.SITE_TRANSFER_OUT_QUANTITY), 0.0) AS net_transfer_flow
    FROM fact_cube_monthly f
    LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
    {where_clause}
    GROUP BY f.ADMSITE_CODE, l.Name, l.SITE_TYPE
    ORDER BY f.ADMSITE_CODE ASC;
    """

    rows = db.execute(query, params).fetchall()
    items = [
        TransferHistoryItem(
            admsite_code=row[0],
            store_name=row[1],
            site_type=row[2],
            transfer_in_units=float(row[3]),
            transfer_out_units=float(row[4]),
            wh_transfer_in_units=float(row[5]),
            net_transfer_flow=float(row[6]),
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)
