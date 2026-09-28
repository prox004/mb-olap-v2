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
        COALESCE(SUM(v.NET_SALE_AMOUNT), 0.0) AS total_revenue,
        COALESCE(SUM(v.NET_SALE_QUANTITY), 0.0) AS total_sales_units,
        COALESCE(SUM(v.GP_AMOUNT), 0.0) AS total_gross_profit,
        CASE 
            WHEN SUM(v.NET_SALE_AMOUNT) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2)
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
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        inv_conditions = []
        inv_params = []
        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            inv_conditions.append(f"admsite_code IN ({placeholders})")
            inv_params.extend(store_ids)
        if division and division.lower() != "all":
            inv_conditions.append("UPPER(division) LIKE ?")
            inv_params.append(f"%{division.strip().upper()}%")
        if department and department.lower() != "all":
            inv_conditions.append("UPPER(department) LIKE ?")
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
                inv_conditions.append(f"toYear(period_start_date) = {list(years)[0]}")
            elif len(years) > 1:
                yr_list = ", ".join(str(y) for y in sorted(years))
                inv_conditions.append(f"toYear(period_start_date) IN ({yr_list})")
        else:
            inv_conditions.append("period_start_date >= '2025-04-01' AND period_end_date <= '2026-09-15'")
        inv_where_clause = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        inv_query = f"""
        SELECT
            COALESCE(SUM(closing_amt), 0.0) AS total_inventory_value,
            COALESCE(SUM(closing_qty), 0.0) AS total_inventory_units,
            CASE
                WHEN SUM(opening_qty + purchase_net_qty + transfer_in_qty) > 0
                THEN ROUND((SUM(final_sale_qty) / SUM(opening_qty + purchase_net_qty + transfer_in_qty)) * 100.0, 2)
                ELSE 0.0
            END AS sell_through_pct,
            CASE
                WHEN (SUM(final_sale_qty) / 24.0) > 0
                THEN ROUND(SUM(closing_qty) / (SUM(final_sale_qty) / 24.0), 2)
                ELSE 999.0
            END AS average_woc
        FROM v_fact_inventory_enriched
        {inv_where_clause};
        """
        inv_row = db.execute(inv_query, inv_params).fetchone()

        kpi_data = ExecutiveKPIs(
            total_revenue=float(row[0]),
            total_sales_units=float(row[1]),
            total_gross_profit=float(row[2]),
            gross_margin_pct=float(row[3]),
            total_inventory_value=float(inv_row[0]) if inv_row else 0.0,
            total_inventory_units=float(inv_row[1]) if inv_row else 0.0,
            sell_through_pct=float(inv_row[2]) if inv_row else 0.0,
            average_woc=float(inv_row[3]) if inv_row else 999.0,
            inventory_metrics_available=True,
        )
    else:
        kpi_data = ExecutiveKPIs(
            total_revenue=float(row[0]),
            total_sales_units=float(row[1]),
            total_gross_profit=float(row[2]),
            gross_margin_pct=float(row[3]),
            total_inventory_value=float(row[4]),
            total_inventory_units=float(row[5]),
            sell_through_pct=float(row[6]),
            average_woc=float(row[7]),
            inventory_metrics_available=True,
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
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    column_map = {
        "revenue": "store_revenue",
        "margin": "store_margin_pct",
        "woc": "store_woc",
        "stock_value": "store_stock_value",
    }
    sort_col = column_map.get(sort_by, "store_revenue")
    sort_dir = "DESC" if order.lower() == "desc" else "ASC"

    if is_clickhouse:
        where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")
        inv_conditions = []
        inv_params = []
        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            inv_conditions.append(f"admsite_code IN ({placeholders})")
            inv_params.extend(store_ids)
        if months:
            years = set()
            for m in months:
                if "-" in m:
                    try:
                        years.add(int(m.split("-")[0]))
                    except ValueError:
                        pass
            if len(years) == 1:
                inv_conditions.append(f"toYear(period_start_date) = {list(years)[0]}")
            elif len(years) > 1:
                yr_list = ", ".join(str(y) for y in sorted(years))
                inv_conditions.append(f"toYear(period_start_date) IN ({yr_list})")
        else:
            inv_conditions.append("period_start_date >= '2025-04-01' AND period_end_date <= '2026-09-15'")
        inv_where_clause = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        query = f"""
        WITH sales AS (
            SELECT
                v.ADMSITE_CODE AS admsite_code,
                COALESCE(MAX(v.STORE_NAME), concat('Store ', toString(v.ADMSITE_CODE))) AS store_name,
                SUM(v.NET_SALE_AMOUNT) AS store_revenue,
                SUM(v.NET_SALE_QUANTITY) AS store_sales_units,
                SUM(v.GP_AMOUNT) AS store_gross_profit,
                CASE 
                    WHEN SUM(v.NET_SALE_AMOUNT) > 0 
                    THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2)
                    ELSE 0.0 
                END AS store_margin_pct
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY v.ADMSITE_CODE
        ),
        inv AS (
            SELECT
                admsite_code,
                SUM(closing_amt) AS store_stock_value,
                SUM(closing_qty) AS store_stock_units,
                SUM(final_sale_qty) AS store_final_sale_qty,
                CASE
                    WHEN (SUM(final_sale_qty) / 24.0) > 0
                    THEN ROUND(SUM(closing_qty) / (SUM(final_sale_qty) / 24.0), 2)
                    ELSE 999.0
                END AS store_woc
            FROM v_fact_inventory_enriched
            {inv_where_clause}
            GROUP BY admsite_code
        )
        SELECT
            s.admsite_code,
            s.store_name,
            s.store_revenue,
            s.store_sales_units,
            s.store_gross_profit,
            s.store_margin_pct,
            COALESCE(i.store_stock_value, 0.0) AS store_stock_value,
            COALESCE(i.store_stock_units, 0.0) AS store_stock_units,
            COALESCE(i.store_woc, 999.0) AS store_woc
        FROM sales s
        LEFT JOIN inv i ON s.admsite_code = i.admsite_code
        ORDER BY {sort_col} {sort_dir};
        """
        all_params = params + inv_params
        rows = db.execute(query, all_params).fetchall()
    else:
        where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")
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
                WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0) > 0 
                THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0), 1)
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
            store_stock_value=float(row[6]) if row[6] is not None else 0.0,
            store_stock_units=float(row[7]) if row[7] is not None else 0.0,
            store_woc=float(row[8]) if row[8] is not None else 999.0,
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
    db = Depends(get_db),
):
    """
    Returns top N revenue generating SKUs and bottom N slow-moving / low-revenue SKUs.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")
        inv_conditions = []
        inv_params = []
        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            inv_conditions.append(f"admsite_code IN ({placeholders})")
            inv_params.extend(store_ids)
        if months:
            years = set()
            for m in months:
                if "-" in m:
                    try:
                        years.add(int(m.split("-")[0]))
                    except ValueError:
                        pass
            if len(years) == 1:
                inv_conditions.append(f"toYear(period_start_date) = {list(years)[0]}")
            elif len(years) > 1:
                yr_list = ", ".join(str(y) for y in sorted(years))
                inv_conditions.append(f"toYear(period_start_date) IN ({yr_list})")
        else:
            inv_conditions.append("period_start_date >= '2025-04-01' AND period_end_date <= '2026-09-15'")
        inv_where_clause = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        query_top = f"""
        WITH sales AS (
            SELECT
                v.BARCODE AS barcode,
                COALESCE(MAX(v.ARTICLE_NAME), v.BARCODE) AS item_description,
                COALESCE(MAX(v.Division), 'UNKNOWN') AS division,
                COALESCE(MAX(v.Department), 'UNKNOWN') AS department,
                SUM(v.NET_SALE_AMOUNT) AS sku_revenue,
                SUM(v.NET_SALE_QUANTITY) AS sku_sales_units,
                SUM(v.GP_AMOUNT) AS sku_gross_profit
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY v.BARCODE
        ),
        inv AS (
            SELECT
                item_code,
                SUM(closing_qty) AS current_stock_units
            FROM v_fact_inventory_enriched
            {inv_where_clause}
            GROUP BY item_code
        )
        SELECT
            s.barcode,
            s.item_description,
            s.division,
            s.department,
            s.sku_revenue,
            s.sku_sales_units,
            s.sku_gross_profit,
            COALESCE(i.current_stock_units, 0) AS current_stock_units
        FROM sales s
        LEFT JOIN inv i ON s.barcode = i.item_code
        ORDER BY s.sku_revenue DESC
        LIMIT {limit};
        """

        query_bottom = f"""
        WITH sales AS (
            SELECT
                v.BARCODE AS barcode,
                COALESCE(MAX(v.ARTICLE_NAME), v.BARCODE) AS item_description,
                COALESCE(MAX(v.Division), 'UNKNOWN') AS division,
                COALESCE(MAX(v.Department), 'UNKNOWN') AS department,
                SUM(v.NET_SALE_AMOUNT) AS sku_revenue,
                SUM(v.NET_SALE_QUANTITY) AS sku_sales_units,
                SUM(v.GP_AMOUNT) AS sku_gross_profit
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY v.BARCODE
        ),
        inv AS (
            SELECT
                item_code,
                SUM(closing_qty) AS current_stock_units
            FROM v_fact_inventory_enriched
            {inv_where_clause}
            GROUP BY item_code
        )
        SELECT
            s.barcode,
            s.item_description,
            s.division,
            s.department,
            s.sku_revenue,
            s.sku_sales_units,
            s.sku_gross_profit,
            COALESCE(i.current_stock_units, 0) AS current_stock_units
        FROM sales s
        LEFT JOIN inv i ON s.barcode = i.item_code
        WHERE COALESCE(i.current_stock_units, 0) > 0
        ORDER BY s.sku_revenue ASC
        LIMIT {limit};
        """
        all_params = params + inv_params
        top_rows = db.execute(query_top, all_params).fetchall()
        bottom_rows = db.execute(query_bottom, all_params).fetchall()
    else:
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
            current_stock_units=float(row[7]) if row[7] is not None else 0.0,
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
    db = Depends(get_db),
):
    """
    Returns monthly revenue, profit, gross margin %, and inventory trends across operational months.
    """
    where_clause, params = build_where_clause(store_ids=store_ids, division=division, department=department, table_prefix="v")
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

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
            inventory_value=None if is_clickhouse else float(row[4]),
        )
        for row in rows
    ]

    return StandardResponse(success=True, data=trends)
