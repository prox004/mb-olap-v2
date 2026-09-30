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
        current_stock_units=float(row[8]) if len(row) > 8 and row[8] is not None else None,
        current_stock_value=float(row[9]) if len(row) > 9 and row[9] is not None else None,
        sell_through_pct=float(row[10]) if len(row) > 10 and row[10] is not None else None,
    )


def _build_inv_where(store_ids, division, department, months):
    inv_conditions = []
    inv_params = []
    if store_ids:
        placeholders = ", ".join(["?"] * len(store_ids))
        inv_conditions.append(f"i.admsite_code IN ({placeholders})")
        inv_params.extend(store_ids)
    if division and division.lower() != "all":
        inv_conditions.append("UPPER(i.division) LIKE ?")
        inv_params.append(f"%{division.strip().upper()}%")
    if department and department.lower() != "all":
        inv_conditions.append("UPPER(i.department) LIKE ?")
        inv_params.append(f"%{department.strip().upper()}%")
    if months:
        years = set()
        for m in months:
            if "-" in m:
                try:
                    years.add(int(m.split("-")[0]))
                except ValueError:
                    pass
        if len(years) == 1:
            inv_conditions.append(f"toYear(i.period_start_date) = {list(years)[0]}")
        elif len(years) > 1:
            yr_list = ", ".join(str(y) for y in sorted(years))
            inv_conditions.append(f"toYear(i.period_start_date) IN ({yr_list})")
    inv_where = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""
    return inv_where, inv_params


@router.get("/performance", response_model=StandardResponse[ColourSummaryResponse])
def get_colour_performance(
    department: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db = Depends(get_db),
):
    """
    Returns colour sales performance aggregated by extracted_colour with optional store, month, division, and department filters.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
        table_prefix="v"
    )

    if is_clickhouse:
        inv_where, inv_params = _build_inv_where(store_ids, division, department, months)
        query = f"""
        WITH sales AS (
            SELECT
                COALESCE(NULLIF(v.DESC1, ''), 'OTHER') AS extracted_colour,
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
        ),
        inv AS (
            SELECT
                COALESCE(NULLIF(i.colour, ''), 'OTHER') AS inv_colour,
                SUM(i.closing_qty) AS stock_units,
                SUM(i.closing_amt) AS stock_value,
                SUM(i.opening_qty) AS opening_units,
                SUM(i.purchase_net_qty) AS purchase_units,
                SUM(i.transfer_in_qty) AS transfer_in_units
            FROM v_fact_inventory_enriched i
            {inv_where}
            GROUP BY inv_colour
        )
        SELECT
            s.extracted_colour,
            'ALL' AS division,
            'ALL' AS department,
            s.total_skus,
            s.sales_units,
            s.net_revenue,
            s.gross_profit,
            s.margin_pct,
            COALESCE(i.stock_units, 0) AS current_stock_units,
            COALESCE(i.stock_value, 0.0) AS current_stock_value,
            CASE
                WHEN (COALESCE(i.opening_units, 0) + COALESCE(i.purchase_units, 0) + COALESCE(i.transfer_in_units, 0)) > 0
                THEN ROUND((s.sales_units / (i.opening_units + i.purchase_units + i.transfer_in_units)) * 100.0, 2)
                WHEN (s.sales_units + COALESCE(i.stock_units, 0)) > 0
                THEN ROUND((s.sales_units / (s.sales_units + i.stock_units)) * 100.0, 2)
                ELSE 0.0
            END AS sell_through_pct
        FROM sales s
        LEFT JOIN inv i ON s.extracted_colour = i.inv_colour
        ORDER BY s.net_revenue DESC;
        """
        all_params = params + inv_params
        rows = db.execute(query, all_params).fetchall()
    else:
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
            END AS margin_pct,
            SUM(v.CLOSING_STOCK_QUANTITY) AS current_stock_units,
            SUM(v.CLOSING_STOCK_AMOUNT) AS current_stock_value,
            CASE
                WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0
                THEN ROUND((SUM(v.NET_SALE_QUANTITY) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                ELSE 0.0
            END AS sell_through_pct
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
    db = Depends(get_db),
):
    """
    Returns department and colour granular matrix breakdown for heatmaps and cross-tab analysis.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
        table_prefix="v"
    )

    if is_clickhouse:
        inv_where, inv_params = _build_inv_where(store_ids, division, department, months)
        query = f"""
        WITH sales AS (
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
        ),
        inv AS (
            SELECT
                COALESCE(NULLIF(i.colour, ''), 'OTHER') AS inv_colour,
                COALESCE(i.division, 'UNKNOWN') AS inv_division,
                COALESCE(i.department, 'UNKNOWN') AS inv_department,
                SUM(i.closing_qty) AS stock_units,
                SUM(i.closing_amt) AS stock_value,
                SUM(i.opening_qty) AS opening_units,
                SUM(i.purchase_net_qty) AS purchase_units,
                SUM(i.transfer_in_qty) AS transfer_in_units
            FROM v_fact_inventory_enriched i
            {inv_where}
            GROUP BY inv_colour, inv_division, inv_department
        )
        SELECT
            s.extracted_colour,
            s.division,
            s.department,
            s.total_skus,
            s.sales_units,
            s.net_revenue,
            s.gross_profit,
            s.margin_pct,
            COALESCE(i.stock_units, 0) AS current_stock_units,
            COALESCE(i.stock_value, 0.0) AS current_stock_value,
            CASE
                WHEN (COALESCE(i.opening_units, 0) + COALESCE(i.purchase_units, 0) + COALESCE(i.transfer_in_units, 0)) > 0
                THEN ROUND((s.sales_units / (i.opening_units + i.purchase_units + i.transfer_in_units)) * 100.0, 2)
                WHEN (s.sales_units + COALESCE(i.stock_units, 0)) > 0
                THEN ROUND((s.sales_units / (s.sales_units + i.stock_units)) * 100.0, 2)
                ELSE 0.0
            END AS sell_through_pct
        FROM sales s
        LEFT JOIN inv i ON s.extracted_colour = i.inv_colour AND s.division = i.inv_division AND s.department = i.inv_department
        ORDER BY s.net_revenue DESC;
        """
        all_params = params + inv_params
        rows = db.execute(query, all_params).fetchall()
    else:
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
            END AS margin_pct,
            SUM(v.CLOSING_STOCK_QUANTITY) AS current_stock_units,
            SUM(v.CLOSING_STOCK_AMOUNT) AS current_stock_value,
            CASE
                WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0
                THEN ROUND((SUM(v.NET_SALE_QUANTITY) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                ELSE 0.0
            END AS sell_through_pct
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
    db = Depends(get_db),
):
    """
    Returns top N performing colours by revenue and bottom N underperforming colours by revenue.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")

    if is_clickhouse:
        inv_where, inv_params = _build_inv_where(store_ids, None, None, months)
        base_query = f"""
        WITH sales AS (
            SELECT
                COALESCE(NULLIF(v.DESC1, ''), 'OTHER') AS extracted_colour,
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
        ),
        inv AS (
            SELECT
                COALESCE(NULLIF(i.colour, ''), 'OTHER') AS inv_colour,
                SUM(i.closing_qty) AS stock_units,
                SUM(i.closing_amt) AS stock_value,
                SUM(i.opening_qty) AS opening_units,
                SUM(i.purchase_net_qty) AS purchase_units,
                SUM(i.transfer_in_qty) AS transfer_in_units
            FROM v_fact_inventory_enriched i
            {inv_where}
            GROUP BY inv_colour
        )
        SELECT
            s.extracted_colour,
            'ALL' AS division,
            'ALL' AS department,
            s.total_skus,
            s.sales_units,
            s.net_revenue,
            s.gross_profit,
            s.margin_pct,
            COALESCE(i.stock_units, 0) AS current_stock_units,
            COALESCE(i.stock_value, 0.0) AS current_stock_value,
            CASE
                WHEN (COALESCE(i.opening_units, 0) + COALESCE(i.purchase_units, 0) + COALESCE(i.transfer_in_units, 0)) > 0
                THEN ROUND((s.sales_units / (i.opening_units + i.purchase_units + i.transfer_in_units)) * 100.0, 2)
                WHEN (s.sales_units + COALESCE(i.stock_units, 0)) > 0
                THEN ROUND((s.sales_units / (s.sales_units + i.stock_units)) * 100.0, 2)
                ELSE 0.0
            END AS sell_through_pct
        FROM sales s
        LEFT JOIN inv i ON s.extracted_colour = i.inv_colour
        """
        all_params = params + inv_params
        top_query = f"{base_query} ORDER BY s.net_revenue DESC LIMIT {limit};"
        slow_query = f"{base_query} ORDER BY s.net_revenue ASC LIMIT {limit};"
        top_rows = db.execute(top_query, all_params).fetchall()
        slow_rows = db.execute(slow_query, all_params).fetchall()
    else:
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
            END AS margin_pct,
            SUM(v.CLOSING_STOCK_QUANTITY) AS current_stock_units,
            SUM(v.CLOSING_STOCK_AMOUNT) AS current_stock_value,
            CASE
                WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0
                THEN ROUND((SUM(v.NET_SALE_QUANTITY) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                ELSE 0.0
            END AS sell_through_pct
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
