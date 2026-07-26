from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.colour import ColourPerformanceItem, ColourSummaryResponse, TopColoursResponse
from backend.app.utils.query_builder import build_where_clause

router = APIRouter()

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
    """
    if store_ids or months:
        where_clause, params = build_where_clause(
            store_ids=store_ids,
            months=months,
            division=division,
            department=department,
            table_prefix="f"
        )
        query = f"""
        SELECT
            i.extracted_colour,
            'ALL' AS division,
            'ALL' AS department,
            COUNT(DISTINCT f.BARCODE) AS total_skus,
            SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
            SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
            SUM(f.GP_AMOUNT) AS gross_profit,
            CASE WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 THEN ROUND((SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100.0, 2) ELSE 0.0 END AS margin_pct,
            SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
            SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
            CASE 
                WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
                THEN ROUND((SUM(ABS(f.NET_SALE_QUANTITY)) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                ELSE 0.0 
            END AS sell_through_pct
        FROM fact_cube_monthly f
        LEFT JOIN v_dim_item_colour i ON f.BARCODE = i.ICODE
        {where_clause}
        GROUP BY i.extracted_colour
        ORDER BY net_revenue DESC;
        """
    else:
        conditions = []
        params = []
        if division and division.lower() != "all":
            conditions.append("UPPER(division) LIKE ?")
            params.append(f"%{division.strip().upper()}%")
        if department and department.lower() != "all":
            conditions.append("UPPER(department) LIKE ?")
            params.append(f"%{department.strip().upper()}%")

        where_str = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        query = f"""
        SELECT
            extracted_colour,
            'ALL' AS division,
            'ALL' AS department,
            SUM(total_skus) AS total_skus,
            SUM(ABS(sales_units)) AS sales_units,
            SUM(ABS(net_revenue)) AS net_revenue,
            SUM(gross_profit) AS gross_profit,
            CASE WHEN SUM(ABS(net_revenue)) > 0 THEN ROUND((SUM(gross_profit) / SUM(ABS(net_revenue))) * 100.0, 2) ELSE 0.0 END AS margin_pct,
            SUM(current_stock_units) AS current_stock_units,
            SUM(current_stock_value) AS current_stock_value,
            ROUND(AVG(sell_through_pct), 2) AS sell_through_pct
        FROM v_colour_performance_summary
        {where_str}
        GROUP BY extracted_colour
        ORDER BY net_revenue DESC;
        """

    rows = db.execute(query, params).fetchall()

    items = [
        ColourPerformanceItem(
            extracted_colour=row[0] or "OTHER",
            division=row[1],
            department=row[2],
            total_skus=int(row[3]),
            sales_units=float(row[4]),
            net_revenue=float(row[5]),
            gross_profit=float(row[6]),
            margin_pct=float(row[7]),
            current_stock_units=float(row[8]),
            current_stock_value=float(row[9]),
            sell_through_pct=float(row[10]),
        )
        for row in rows
    ]

    top_colour = items[0].extracted_colour if items else "NONE"
    response_data = ColourSummaryResponse(
        total_colours=len(items),
        top_colour_by_revenue=top_colour,
        items=items
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=response_data, meta=meta)


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
    """
    if store_ids or months:
        where_clause, params = build_where_clause(
            store_ids=store_ids,
            months=months,
            division=division,
            department=department,
            table_prefix="f"
        )
        query = f"""
        SELECT
            i.extracted_colour,
            COALESCE(i.Division, 'UNKNOWN') AS division,
            COALESCE(i.Department, 'UNKNOWN') AS department,
            COUNT(DISTINCT f.BARCODE) AS total_skus,
            SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
            SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
            SUM(f.GP_AMOUNT) AS gross_profit,
            CASE WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 THEN ROUND((SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100.0, 2) ELSE 0.0 END AS margin_pct,
            SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
            SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
            CASE 
                WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
                THEN ROUND((SUM(ABS(f.NET_SALE_QUANTITY)) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                ELSE 0.0 
            END AS sell_through_pct
        FROM fact_cube_monthly f
        LEFT JOIN v_dim_item_colour i ON f.BARCODE = i.ICODE
        {where_clause}
        GROUP BY i.extracted_colour, i.Division, i.Department
        ORDER BY net_revenue DESC;
        """
    else:
        conditions = []
        params = []
        if division and division.lower() != "all":
            conditions.append("UPPER(division) LIKE ?")
            params.append(f"%{division.strip().upper()}%")
        if department and department.lower() != "all":
            conditions.append("UPPER(department) LIKE ?")
            params.append(f"%{department.strip().upper()}%")

        where_str = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        query = f"SELECT * FROM v_colour_performance_summary {where_str} ORDER BY net_revenue DESC;"

    rows = db.execute(query, params).fetchall()

    items = [
        ColourPerformanceItem(
            extracted_colour=row[0] or "OTHER",
            division=row[1] or "UNKNOWN",
            department=row[2] or "UNKNOWN",
            total_skus=int(row[3]),
            sales_units=float(row[4]),
            net_revenue=float(row[5]),
            gross_profit=float(row[6]),
            margin_pct=float(row[7]),
            current_stock_units=float(row[8]),
            current_stock_value=float(row[9]),
            sell_through_pct=float(row[10]),
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/top-colours", response_model=StandardResponse[TopColoursResponse])
def get_top_colours(
    limit: int = Query(5, ge=1, le=20),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns top N performing colours by revenue and bottom N underperforming colours by sell-through %.
    """
    if store_ids or months:
        where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="f")
        base_query = f"""
        SELECT
            i.extracted_colour,
            'ALL' AS division,
            'ALL' AS department,
            COUNT(DISTINCT f.BARCODE) AS total_skus,
            SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
            SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
            SUM(f.GP_AMOUNT) AS gross_profit,
            CASE WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 THEN ROUND((SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100.0, 2) ELSE 0.0 END AS margin_pct,
            SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
            SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
            CASE 
                WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
                THEN ROUND((SUM(ABS(f.NET_SALE_QUANTITY)) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                ELSE 0.0 
            END AS sell_through_pct
        FROM fact_cube_monthly f
        LEFT JOIN v_dim_item_colour i ON f.BARCODE = i.ICODE
        {where_clause}
        GROUP BY i.extracted_colour
        """
        top_query = f"{base_query} ORDER BY net_revenue DESC LIMIT {limit};"
        slow_query = f"{base_query} HAVING current_stock_units > 0 ORDER BY sell_through_pct ASC LIMIT {limit};"
        top_rows = db.execute(top_query, params).fetchall()
        slow_rows = db.execute(slow_query, params).fetchall()
    else:
        top_query = f"""
        SELECT
            extracted_colour, 'ALL' AS division, 'ALL' AS department,
            SUM(total_skus), SUM(ABS(sales_units)), SUM(ABS(net_revenue)), SUM(gross_profit),
            CASE WHEN SUM(ABS(net_revenue)) > 0 THEN ROUND((SUM(gross_profit) / SUM(ABS(net_revenue))) * 100.0, 2) ELSE 0.0 END,
            SUM(current_stock_units), SUM(current_stock_value), ROUND(AVG(sell_through_pct), 2)
        FROM v_colour_performance_summary
        GROUP BY extracted_colour
        ORDER BY SUM(ABS(net_revenue)) DESC
        LIMIT {limit};
        """
        slow_query = f"""
        SELECT
            extracted_colour, 'ALL' AS division, 'ALL' AS department,
            SUM(total_skus), SUM(ABS(sales_units)), SUM(ABS(net_revenue)), SUM(gross_profit),
            CASE WHEN SUM(ABS(net_revenue)) > 0 THEN ROUND((SUM(gross_profit) / SUM(ABS(net_revenue))) * 100.0, 2) ELSE 0.0 END,
            SUM(current_stock_units), SUM(current_stock_value), ROUND(AVG(sell_through_pct), 2)
        FROM v_colour_performance_summary
        GROUP BY extracted_colour
        HAVING SUM(current_stock_units) > 0
        ORDER BY AVG(sell_through_pct) ASC
        LIMIT {limit};
        """
        top_rows = db.execute(top_query).fetchall()
        slow_rows = db.execute(slow_query).fetchall()

    def map_item(row):
        return ColourPerformanceItem(
            extracted_colour=row[0] or "OTHER",
            division=row[1],
            department=row[2],
            total_skus=int(row[3]),
            sales_units=float(row[4]),
            net_revenue=float(row[5]),
            gross_profit=float(row[6]),
            margin_pct=float(row[7]),
            current_stock_units=float(row[8]),
            current_stock_value=float(row[9]),
            sell_through_pct=float(row[10]),
        )

    data = TopColoursResponse(
        top_performers=[map_item(r) for r in top_rows],
        underperformers=[map_item(r) for r in slow_rows],
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(top_rows) + len(slow_rows))
    return StandardResponse(success=True, data=data, meta=meta)
