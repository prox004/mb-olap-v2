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
from backend.app.utils.query_builder import build_where_clause

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


def _build_sku_base_query(where_clause: str) -> str:
    return f"""
    WITH filtered_fact AS (
        SELECT 
            f.BARCODE,
            f.ADMSITE_CODE,
            f.START_DATE,
            f.NET_SALE_AMOUNT,
            f.NET_SALE_QUANTITY,
            f.GP_AMOUNT,
            f.CLOSING_STOCK_QUANTITY,
            f.CLOSING_STOCK_AMOUNT,
            f.OPENING_QUANTITY,
            f.GOODS_RECEIVE_QUANTITY,
            f.SITE_TRANSFER_IN_QUANTITY
        FROM fact_cube_monthly f
        {where_clause}
    ),
    period_meta AS (
        SELECT COUNT(DISTINCT strftime(START_DATE, '%Y-%m')) AS num_months
        FROM filtered_fact
    )
    SELECT
        f.BARCODE AS barcode,
        i.DESC1 AS description,
        i.Division AS division,
        i.Section AS section,
        i.Department AS department,
        i.PARTYNAME AS vendor,
        i.MRP AS mrp,
        i.RATE AS cost_rate,
        SUM(f.NET_SALE_AMOUNT) AS net_revenue,
        SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
        SUM(f.GP_AMOUNT) AS gross_profit,
        SUM(f.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
        SUM(f.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
        CASE 
            WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
            THEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100.0
            ELSE 0.0 
        END AS sell_through_pct,
        -- Weeks of Cover (WOC) = Closing Stock / Weekly Sales Rate
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33)) > 0 
            THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33))
            ELSE 999.0 
        END AS woc,
        -- Months of Inventory (MOI) = Closing Stock / Monthly Sales Rate
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / MAX(pm.num_months)) > 0 
            THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / MAX(pm.num_months))
            ELSE 999.0 
        END AS moi,
        CASE
            WHEN SUM(ABS(f.NET_SALE_QUANTITY)) = 0 AND SUM(f.CLOSING_STOCK_QUANTITY) > 0 THEN 'DEAD_STOCK'
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33)) > 0 
                 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33))) < 4.0 THEN 'FAST_MOVER'
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33)) > 0 
                 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33))) BETWEEN 4.0 AND 12.0 THEN 'MEDIUM_MOVER'
            ELSE 'SLOW_MOVER'
        END AS velocity_status
    FROM filtered_fact f
    CROSS JOIN period_meta pm
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY f.BARCODE, i.DESC1, i.Division, i.Section, i.Department, i.PARTYNAME, i.MRP, i.RATE
    """


@router.get("/skus", response_model=StandardResponse[SkuVelocityResponse])
def get_sku_velocity_list(
    velocity_status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    division: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort_by: str = Query("net_revenue"),
    order: str = Query("desc"),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns paginated list of SKU inventory velocity performance metrics with dynamic slice and dice filters.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
        table_prefix="f"
    )

    base_query = _build_sku_base_query(where_clause)

    # Post-filtering for velocity_status, vendor, & search
    post_conditions = []
    if velocity_status and velocity_status.upper() != "ALL":
        post_conditions.append("velocity_status = ?")
        params.append(velocity_status.upper().strip())

    if vendor and vendor.lower() != "all":
        post_conditions.append("UPPER(vendor) LIKE ?")
        params.append(f"%{vendor.strip().upper()}%")

    if search and search.strip():
        term = f"%{search.strip().upper()}%"
        post_conditions.append("(UPPER(description) LIKE ? OR UPPER(barcode) LIKE ? OR UPPER(department) LIKE ? OR UPPER(vendor) LIKE ?)")
        params.extend([term, term, term, term])

    having_clause = f"HAVING {' AND '.join(post_conditions)}" if post_conditions else ""

    # Sort & pagination
    sort_column = ALLOWED_SORT_FIELDS.get(sort_by.lower(), "net_revenue")
    sort_order = "ASC" if order.lower() == "asc" else "DESC"

    # Count query
    count_query = f"SELECT COUNT(*) FROM ({base_query} {having_clause}) sub"
    total_records = db.execute(count_query, params).fetchone()[0]

    # Data query
    offset = (page - 1) * page_size
    data_query = f"""
    SELECT
        barcode, description, division, section, department, vendor,
        mrp, cost_rate, net_revenue, sales_units, gross_profit,
        closing_stock_units, closing_stock_value, sell_through_pct,
        woc, moi, velocity_status
    FROM ({base_query} {having_clause}) sub
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
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns summary and paginated list of 90-day Dead Stock liquidation candidates matching slice and dice filters.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
        table_prefix="f"
    )

    base_query = _build_sku_base_query(where_clause)
    dead_query = f"SELECT * FROM ({base_query} HAVING velocity_status = 'DEAD_STOCK') sub"

    # Total stats query
    stats_query = f"SELECT COUNT(*), COALESCE(SUM(closing_stock_value), 0.0) FROM ({dead_query}) ds"
    stats_res = db.execute(stats_query, params).fetchone()
    total_dead_skus = stats_res[0] if stats_res else 0
    total_locked_capital = float(stats_res[1]) if stats_res else 0.0

    # Data query
    offset = (page - 1) * page_size
    data_query = f"""
    SELECT
        barcode, description, division, section, department, vendor,
        mrp, cost_rate, net_revenue, sales_units, gross_profit,
        closing_stock_units, closing_stock_value, sell_through_pct,
        woc, moi, velocity_status
    FROM ({dead_query}) ds
    ORDER BY closing_stock_value DESC
    LIMIT {page_size} OFFSET {offset}
    """

    rows = db.execute(data_query, params).fetchall()
    items = [map_sku_row(r) for r in rows]

    summary = DeadStockSummary(
        total_dead_skus=total_dead_skus,
        total_locked_capital=total_locked_capital,
        items=items,
    )

    meta = FilterMeta(total_records=total_dead_skus)
    return StandardResponse(success=True, data=summary, meta=meta)


@router.get("/velocity-breakdown", response_model=StandardResponse[List[VelocityBreakdownItem]])
def get_velocity_breakdown(
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns velocity status breakdown for slice and dice filter selections.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
        table_prefix="f"
    )

    base_query = _build_sku_base_query(where_clause)
    query = f"""
    SELECT 
        velocity_status,
        COUNT(*) AS sku_count,
        COALESCE(SUM(closing_stock_value), 0.0) AS closing_stock_value
    FROM ({base_query}) sub
    GROUP BY velocity_status
    ORDER BY sku_count DESC;
    """
    rows = db.execute(query, params).fetchall()
    breakdown = [
        VelocityBreakdownItem(
            velocity_status=row[0],
            sku_count=row[1],
            closing_stock_value=float(row[2]),
        )
        for row in rows
    ]

    return StandardResponse(success=True, data=breakdown)
