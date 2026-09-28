from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.colour import ColourPerformanceItem, ColourSummaryResponse, TopColoursResponse
from backend.app.utils.query_builder import build_where_clause

router = APIRouter()


def _map_colour_item(row) -> ColourPerformanceItem:
    return ColourPerformanceItem(
        extracted_colour=row[0] or "OTHER",
        division=row[1] or "ALL",
        department=row[2] or "ALL",
        total_skus=int(row[3]) if row[3] is not None else 0,
        sales_units=float(row[4]) if row[4] is not None else 0.0,
        net_revenue=float(row[5]) if row[5] is not None else 0.0,
        gross_profit=float(row[6]) if row[6] is not None else 0.0,
        margin_pct=float(row[7]) if row[7] is not None else 0.0,
        current_stock_units=None,
        current_stock_value=None,
        sell_through_pct=None,
    )


@router.get("/performance", response_model=StandardResponse[ColourSummaryResponse])
def get_colour_performance(
    department: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns colour sales performance aggregated by extracted_colour with optional store, month, division, and department filters.
    Uses canonical star-schema v_fact_item_location_monthly with signed metrics.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
        table_prefix="v"
    )

    query = f"""
    SELECT
        COALESCE(NULLIF(v.DESC1, ''), 'OTHER') AS extracted_colour,
        'ALL' AS division,
        'ALL' AS department,
        COUNT(DISTINCT v.BARCODE) AS total_skus,
        SUM(v.NET_SALE_QUANTITY) AS sales_units,
        SUM(v.NET_SALE_AMOUNT) AS net_revenue,
        SUM(v.GP_AMOUNT) AS gross_profit,
        CASE 
            WHEN SUM(v.NET_SALE_AMOUNT) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2) 
            ELSE 0.0 
        END AS margin_pct
    FROM v_fact_item_location_monthly v
    {where_clause}
    GROUP BY extracted_colour
    ORDER BY net_revenue DESC;
    """

    rows = db.execute(query, params).fetchall()

    items = [_map_colour_item(row) for row in rows]
    top_colour = items[0].extracted_colour if items else "NONE"

    response_data = ColourSummaryResponse(
        total_colours=len(items),
        top_colour_by_revenue=top_colour,
        items=items
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=response_data, meta=meta, supported=True)


@router.get("/department-breakdown", response_model=StandardResponse[List[ColourPerformanceItem]])
def get_department_colour_breakdown(
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns department and colour granular matrix breakdown for heatmaps and cross-tab analysis.
    Uses canonical star-schema v_fact_item_location_monthly with signed metrics.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
        table_prefix="v"
    )

    query = f"""
    SELECT
        COALESCE(NULLIF(v.DESC1, ''), 'OTHER') AS extracted_colour,
        COALESCE(v.Division, 'UNKNOWN') AS division,
        COALESCE(v.Department, 'UNKNOWN') AS department,
        COUNT(DISTINCT v.BARCODE) AS total_skus,
        SUM(v.NET_SALE_QUANTITY) AS sales_units,
        SUM(v.NET_SALE_AMOUNT) AS net_revenue,
        SUM(v.GP_AMOUNT) AS gross_profit,
        CASE 
            WHEN SUM(v.NET_SALE_AMOUNT) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2) 
            ELSE 0.0 
        END AS margin_pct
    FROM v_fact_item_location_monthly v
    {where_clause}
    GROUP BY extracted_colour, division, department
    ORDER BY net_revenue DESC;
    """

    rows = db.execute(query, params).fetchall()

    items = [_map_colour_item(row) for row in rows]

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta, supported=True)


@router.get("/top-colours", response_model=StandardResponse[TopColoursResponse])
def get_top_colours(
    limit: int = Query(5, ge=1, le=20),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns top N performing colours by revenue and bottom N underperforming colours by revenue.
    Uses canonical star-schema v_fact_item_location_monthly with signed metrics.
    """
    where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")

    base_query = f"""
    SELECT
        COALESCE(NULLIF(v.DESC1, ''), 'OTHER') AS extracted_colour,
        'ALL' AS division,
        'ALL' AS department,
        COUNT(DISTINCT v.BARCODE) AS total_skus,
        SUM(v.NET_SALE_QUANTITY) AS sales_units,
        SUM(v.NET_SALE_AMOUNT) AS net_revenue,
        SUM(v.GP_AMOUNT) AS gross_profit,
        CASE 
            WHEN SUM(v.NET_SALE_AMOUNT) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2) 
            ELSE 0.0 
        END AS margin_pct
    FROM v_fact_item_location_monthly v
    {where_clause}
    GROUP BY extracted_colour
    """

    top_query = f"{base_query} ORDER BY net_revenue DESC LIMIT {limit};"
    slow_query = f"{base_query} ORDER BY net_revenue ASC LIMIT {limit};"

    top_rows = db.execute(top_query, params).fetchall()
    slow_rows = db.execute(slow_query, params).fetchall()

    data = TopColoursResponse(
        top_performers=[_map_colour_item(r) for r in top_rows],
        underperformers=[_map_colour_item(r) for r in slow_rows],
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(top_rows) + len(slow_rows))
    return StandardResponse(success=True, data=data, meta=meta, supported=True)
