from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.merchandise import (
    SkuVelocityItem,
    SkuVelocityResponse,
    DeadStockSummary,
    VelocityBreakdownItem,
)

router = APIRouter()

ALLOWED_SORT_FIELDS = {
    "barcode": "barcode",
    "description": "description",
    "division": "division",
    "section": "section",
    "department": "department",
    "vendor": "vendor",
    "mrp": "mrp",
    "cost_rate": "cost_rate",
    "net_revenue": "net_revenue",
    "sales_units": "sales_units",
    "gross_profit": "gross_profit",
    "closing_stock_units": "closing_stock_units",
    "closing_stock_value": "closing_stock_value",
    "sell_through_pct": "sell_through_pct",
    "woc": "woc",
    "moi": "moi",
    "velocity_status": "velocity_status",
}

def map_sku_row(row) -> SkuVelocityItem:
    return SkuVelocityItem(
        barcode=str(row[0]),
        description=row[1],
        division=row[2],
        section=row[3],
        department=row[4],
        vendor=row[5],
        mrp=float(row[6] or 0.0),
        cost_rate=float(row[7] or 0.0),
        net_revenue=float(row[8] or 0.0),
        sales_units=float(row[9] or 0.0),
        gross_profit=float(row[10] or 0.0),
        closing_stock_units=float(row[11] or 0.0),
        closing_stock_value=float(row[12] or 0.0),
        sell_through_pct=float(row[13] or 0.0),
        woc=float(row[14] or 0.0),
        moi=float(row[15] or 0.0),
        velocity_status=row[16] or "UNKNOWN",
    )

@router.get("/skus", response_model=StandardResponse[SkuVelocityResponse])
def get_sku_velocity_list(
    velocity_status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort_by: str = Query("net_revenue"),
    order: str = Query("desc"),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns paginated list of SKU inventory velocity performance metrics with filtering and sorting.
    """
    conditions = []
    params = []

    if velocity_status and velocity_status.upper() != "ALL":
        conditions.append("velocity_status = ?")
        params.append(velocity_status.upper().strip())

    if department and department.lower() != "all":
        conditions.append("UPPER(department) LIKE ?")
        params.append(f"%{department.strip().upper()}%")

    if vendor and vendor.lower() != "all":
        conditions.append("UPPER(vendor) LIKE ?")
        params.append(f"%{vendor.strip().upper()}%")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Validate sort field & direction
    sort_column = ALLOWED_SORT_FIELDS.get(sort_by.lower(), "net_revenue")
    sort_order = "ASC" if order.lower() == "asc" else "DESC"

    # Total count query
    count_query = f"SELECT COUNT(*) FROM v_sku_velocity_summary {where_clause}"
    total_records = db.execute(count_query, params).fetchone()[0]

    # Data query with pagination
    offset = (page - 1) * page_size
    data_query = f"""
    SELECT
        barcode, description, division, section, department, vendor,
        mrp, cost_rate, net_revenue, sales_units, gross_profit,
        closing_stock_units, closing_stock_value, sell_through_pct,
        woc, moi, velocity_status
    FROM v_sku_velocity_summary
    {where_clause}
    ORDER BY {sort_column} {sort_order}
    LIMIT {page_size} OFFSET {offset}
    """

    rows = db.execute(data_query, params).fetchall()
    items = [map_sku_row(r) for r in rows]

    response_data = SkuVelocityResponse(
        total_records=total_records,
        page=page,
        page_size=page_size,
        items=items,
    )

    meta = FilterMeta(total_records=total_records)
    return StandardResponse(success=True, data=response_data, meta=meta)


@router.get("/dead-stock", response_model=StandardResponse[DeadStockSummary])
def get_dead_stock_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns summary and paginated list of 90-day Dead Stock liquidation candidates.
    """
    # Total stats query
    stats_query = "SELECT COUNT(*), COALESCE(SUM(closing_stock_value), 0.0) FROM v_dead_stock_candidates"
    total_dead_skus, total_locked_capital = db.execute(stats_query).fetchone()

    # Data query
    offset = (page - 1) * page_size
    data_query = f"""
    SELECT
        barcode, description, division, section, department, vendor,
        mrp, cost_rate, net_revenue, sales_units, gross_profit,
        closing_stock_units, closing_stock_value, sell_through_pct,
        woc, moi, velocity_status
    FROM v_dead_stock_candidates
    ORDER BY closing_stock_value DESC
    LIMIT {page_size} OFFSET {offset}
    """

    rows = db.execute(data_query).fetchall()
    items = [map_sku_row(r) for r in rows]

    summary = DeadStockSummary(
        total_dead_skus=total_dead_skus,
        total_locked_capital=float(total_locked_capital),
        items=items,
    )

    meta = FilterMeta(total_records=total_dead_skus)
    return StandardResponse(success=True, data=summary, meta=meta)


@router.get("/velocity-breakdown", response_model=StandardResponse[List[VelocityBreakdownItem]])
def get_velocity_breakdown(
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns velocity status breakdown (SKU counts and total closing stock values) for donut/pie charts.
    """
    query = """
    SELECT 
        velocity_status,
        COUNT(*) AS sku_count,
        COALESCE(SUM(closing_stock_value), 0.0) AS closing_stock_value
    FROM v_sku_velocity_summary
    GROUP BY velocity_status
    ORDER BY sku_count DESC;
    """
    rows = db.execute(query).fetchall()
    breakdown = [
        VelocityBreakdownItem(
            velocity_status=row[0],
            sku_count=row[1],
            closing_stock_value=float(row[2]),
        )
        for row in rows
    ]

    return StandardResponse(success=True, data=breakdown)
