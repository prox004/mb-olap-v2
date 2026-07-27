from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.executive import (
    ExecutiveKPIs,
    StoreRankingItem,
    SKURankingItem,
    TopBottomSkusResponse,
    MonthlyTrendItem,
)
from backend.app.utils.query_builder import build_where_clause

router = APIRouter()

@router.get("/kpis", response_model=StandardResponse[ExecutiveKPIs])
def get_executive_kpis(
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns executive summary KPIs (Total Revenue, Gross Profit %, Total Inventory Value, Sell-Through %, Average WOC)
    with dynamic store/month/division/department filter support.
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
        COALESCE(SUM(ABS(v.NET_SALE_AMOUNT)), 0.0) AS total_revenue,
        COALESCE(SUM(ABS(v.NET_SALE_QUANTITY)), 0.0) AS total_sales_units,
        COALESCE(SUM(v.GP_AMOUNT), 0.0) AS total_gross_profit,
        CASE 
            WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS gross_margin_pct,
        COALESCE(SUM(v.CLOSING_STOCK_AMOUNT), 0.0) AS total_inventory_value,
        COALESCE(SUM(v.CLOSING_STOCK_QUANTITY), 0.0) AS total_inventory_units,
        CASE 
            WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0 
            THEN ROUND((SUM(ABS(v.NET_SALE_QUANTITY)) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
            ELSE 0.0 
        END AS sell_through_pct,
        CASE 
            WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0) > 0 
            THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0), 1)
            ELSE 999.0 
        END AS average_woc
    FROM v_fact_item_location_monthly v
    {where_clause};
    """

    row = db.execute(query, params).fetchone()
    kpi_data = ExecutiveKPIs(
        total_revenue=float(row[0]),
        total_sales_units=float(row[1]),
        total_gross_profit=float(row[2]),
        gross_margin_pct=float(row[3]),
        total_inventory_value=float(row[4]),
        total_inventory_units=float(row[5]),
        sell_through_pct=float(row[6]),
        average_woc=float(row[7]),
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=1)
    return StandardResponse(success=True, data=kpi_data, meta=meta)


@router.get("/store-rankings", response_model=StandardResponse[List[StoreRankingItem]])
def get_store_rankings(
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    sort_by: str = Query("revenue", enum=["revenue", "margin", "woc", "stock_value"]),
    order: str = Query("desc", enum=["asc", "desc"]),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns store rankings performance table filtered by selected stores and operational period.
    """
    where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")

    column_map = {
        "revenue": "store_revenue",
        "margin": "store_margin_pct",
        "woc": "store_woc",
        "stock_value": "store_stock_value",
    }
    sort_col = column_map.get(sort_by, "store_revenue")
    sort_dir = "DESC" if order.lower() == "desc" else "ASC"

    query = f"""
    SELECT
        v.ADMSITE_CODE AS admsite_code,
        COALESCE(MAX(v.STORE_NAME), 'Store ' || CAST(v.ADMSITE_CODE AS VARCHAR)) AS store_name,
        SUM(ABS(v.NET_SALE_AMOUNT)) AS store_revenue,
        SUM(ABS(v.NET_SALE_QUANTITY)) AS store_sales_units,
        SUM(v.GP_AMOUNT) AS store_gross_profit,
        CASE 
            WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS store_margin_pct,
        SUM(v.CLOSING_STOCK_AMOUNT) AS store_stock_value,
        SUM(v.CLOSING_STOCK_QUANTITY) AS store_stock_units,
        CASE 
            WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0) > 0 
            THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0), 1)
            ELSE 999.0 
        END AS store_woc
    FROM v_fact_item_location_monthly v
    {where_clause}
    GROUP BY v.ADMSITE_CODE
    ORDER BY {sort_col} {sort_dir};
    """

    rows = db.execute(query, params).fetchall()
    items = [
        StoreRankingItem(
            admsite_code=row[0],
            store_name=row[1],
            store_revenue=float(row[2]),
            store_sales_units=float(row[3]),
            store_gross_profit=float(row[4]),
            store_margin_pct=float(row[5]),
            store_stock_value=float(row[6]),
            store_stock_units=float(row[7]),
            store_woc=float(row[8]),
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/top-bottom-skus", response_model=StandardResponse[TopBottomSkusResponse])
def get_top_bottom_skus(
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns top N revenue generating SKUs and bottom N slow-moving / dead stock SKUs.
    """
    where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")

    query_top = f"""
    SELECT
        v.BARCODE AS barcode,
        COALESCE(MAX(v.DESC1), v.BARCODE) AS item_description,
        COALESCE(MAX(v.Division), 'UNKNOWN') AS division,
        COALESCE(MAX(v.Department), 'UNKNOWN') AS department,
        SUM(ABS(v.NET_SALE_AMOUNT)) AS sku_revenue,
        SUM(ABS(v.NET_SALE_QUANTITY)) AS sku_sales_units,
        SUM(v.GP_AMOUNT) AS sku_gross_profit,
        SUM(v.CLOSING_STOCK_QUANTITY) AS current_stock_units
    FROM v_fact_item_location_monthly v
    {where_clause}
    GROUP BY v.BARCODE
    ORDER BY sku_revenue DESC
    LIMIT {limit};
    """

    query_bottom = f"""
    SELECT
        v.BARCODE AS barcode,
        COALESCE(MAX(v.DESC1), v.BARCODE) AS item_description,
        COALESCE(MAX(v.Division), 'UNKNOWN') AS division,
        COALESCE(MAX(v.Department), 'UNKNOWN') AS department,
        SUM(ABS(v.NET_SALE_AMOUNT)) AS sku_revenue,
        SUM(ABS(v.NET_SALE_QUANTITY)) AS sku_sales_units,
        SUM(v.GP_AMOUNT) AS sku_gross_profit,
        SUM(v.CLOSING_STOCK_QUANTITY) AS current_stock_units
    FROM v_fact_item_location_monthly v
    {where_clause}
    GROUP BY v.BARCODE
    HAVING SUM(v.CLOSING_STOCK_QUANTITY) > 0
    ORDER BY sku_revenue ASC
    LIMIT {limit};
    """

    top_rows = db.execute(query_top, params).fetchall()
    bottom_rows = db.execute(query_bottom, params).fetchall()

    def map_sku(row):
        return SKURankingItem(
            barcode=row[0],
            item_description=row[1],
            division=row[2],
            department=row[3],
            sku_revenue=float(row[4]),
            sku_sales_units=float(row[5]),
            sku_gross_profit=float(row[6]),
            current_stock_units=float(row[7]),
        )

    response_data = TopBottomSkusResponse(
        top_skus=[map_sku(r) for r in top_rows],
        bottom_skus=[map_sku(r) for r in bottom_rows],
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(top_rows) + len(bottom_rows))
    return StandardResponse(success=True, data=response_data, meta=meta)


@router.get("/monthly-trends", response_model=StandardResponse[List[MonthlyTrendItem]])
def get_monthly_trends(
    store_ids: Optional[List[int]] = Query(None),
    division: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns monthly revenue, profit, gross margin %, and inventory trends across operational months.
    """
    where_clause, params = build_where_clause(store_ids=store_ids, division=division, department=department, table_prefix="v")

    query = f"""
    SELECT
        strftime(v.START_DATE, '%Y-%m') AS month_name,
        SUM(ABS(v.NET_SALE_AMOUNT)) AS revenue,
        SUM(v.GP_AMOUNT) AS gross_profit,
        CASE 
            WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS gross_margin_pct,
        SUM(v.CLOSING_STOCK_AMOUNT) AS inventory_value
    FROM v_fact_item_location_monthly v
    {where_clause}
    {"WHERE v.START_DATE IS NOT NULL" if not where_clause else "AND v.START_DATE IS NOT NULL"}
    GROUP BY month_name
    ORDER BY month_name ASC;
    """

    rows = db.execute(query, params).fetchall()
    trends = [
        MonthlyTrendItem(
            month_name=row[0],
            revenue=float(row[1]),
            gross_profit=float(row[2]),
            gross_margin_pct=float(row[3]),
            inventory_value=float(row[4]),
        )
        for row in rows
    ]

    return StandardResponse(success=True, data=trends)
