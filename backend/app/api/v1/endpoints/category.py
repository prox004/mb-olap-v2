from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.category import (
    CategoryHierarchyItem,
    CategoryMatrixItem,
    TopMoversResponse,
    CategoryGrowthItem,
)
from backend.app.utils.query_builder import build_where_clause

router = APIRouter()

@router.get("/hierarchy", response_model=StandardResponse[List[CategoryHierarchyItem]])
def get_category_hierarchy(
    division: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    group_level: str = Query("department", enum=["division", "section", "department"]),
    db = Depends(get_db),
):
    """
    Returns multi-tier hierarchy rollup aggregated dynamically by Division, Section, or Department.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        table_prefix="v"
    )

    # Handle section condition if present
    if section and section.lower() != "all":
        prefix = "WHERE " if not where_clause else f"{where_clause} AND "
        where_clause = f"{prefix}v.Section = ?"
        params.append(section.strip())

    if group_level == "division":
        group_by = "v.Division"
        select_cols = "v.Division AS division, 'ALL' AS section, 'ALL' AS department, 'ALL' AS department_alias"
    elif group_level == "section":
        group_by = "v.Division, v.Section"
        select_cols = "v.Division AS division, v.Section AS section, 'ALL' AS department, 'ALL' AS department_alias"
    else:
        group_by = "v.Division, v.Section, v.Department, v.\"Department Allias\""
        select_cols = "v.Division AS division, v.Section AS section, v.Department AS department, COALESCE(v.\"Department Allias\", 'ALL') AS department_alias"

    query = f"""
    SELECT
        {select_cols},
        SUM(ABS(v.NET_SALE_AMOUNT)) AS net_revenue,
        SUM(ABS(v.NET_SALE_QUANTITY)) AS sales_units,
        SUM(v.GP_AMOUNT) AS gross_profit,
        CASE 
            WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS margin_pct,
        SUM(v.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
        SUM(v.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
        CASE 
            WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0 
            THEN ROUND((SUM(ABS(v.NET_SALE_QUANTITY)) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
            ELSE 0.0 
        END AS sell_through_pct,
        CASE 
            WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0) > 0 
            THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0), 1)
            ELSE 999.0 
        END AS woc
    FROM v_fact_item_location_monthly v
    {where_clause}
    GROUP BY {group_by}
    ORDER BY net_revenue DESC;
    """

    rows = db.execute(query, params).fetchall()
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
        if section and section.lower() != "all":
            inv_conditions.append("Section = ?")
            inv_params.append(section.strip())
        inv_where_clause = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        if group_level == "division":
            inv_group_by = "division"
            inv_select_cols = "division, 'ALL' AS section, 'ALL' AS department, 'ALL' AS department_alias"
            join_cond = "s.division = i.division"
        elif group_level == "section":
            inv_group_by = "division, section"
            inv_select_cols = "division, section, 'ALL' AS department, 'ALL' AS department_alias"
            join_cond = "s.division = i.division AND s.section = i.section"
        else:
            inv_group_by = "division, section, department, group_alias"
            inv_select_cols = "division, section, department, COALESCE(group_alias, 'ALL') AS department_alias"
            join_cond = "s.division = i.division AND s.section = i.section AND s.department = i.department"

        query = f"""
        WITH sales AS (
            SELECT
                {select_cols},
                SUM(v.NET_SALE_AMOUNT) AS net_revenue,
                SUM(v.NET_SALE_QUANTITY) AS sales_units,
                SUM(v.GP_AMOUNT) AS gross_profit,
                CASE 
                    WHEN SUM(v.NET_SALE_AMOUNT) > 0 
                    THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2)
                    ELSE 0.0 
                END AS margin_pct
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY {group_by}
        ),
        inv AS (
            SELECT
                {inv_select_cols},
                SUM(closing_amt) AS closing_stock_value,
                SUM(closing_qty) AS closing_stock_units,
                CASE 
                    WHEN SUM(opening_qty + purchase_net_qty + transfer_in_qty) > 0 
                    THEN ROUND((SUM(final_sale_qty) / SUM(opening_qty + purchase_net_qty + transfer_in_qty)) * 100.0, 2)
                    ELSE 0.0 
                END AS sell_through_pct,
                CASE 
                    WHEN (SUM(final_sale_qty) / 24.0) > 0 
                    THEN ROUND(SUM(closing_qty) / (SUM(final_sale_qty) / 24.0), 1)
                    ELSE 999.0 
                END AS woc
            FROM v_fact_inventory_enriched
            {inv_where_clause}
            GROUP BY {inv_group_by}
        )
        SELECT
            s.division,
            s.section,
            s.department,
            s.department_alias,
            s.net_revenue,
            s.sales_units,
            s.gross_profit,
            s.margin_pct,
            COALESCE(i.closing_stock_value, 0.0) AS closing_stock_value,
            COALESCE(i.closing_stock_units, 0) AS closing_stock_units,
            COALESCE(i.sell_through_pct, 0.0) AS sell_through_pct,
            COALESCE(i.woc, 999.0) AS woc
        FROM sales s
        LEFT JOIN inv i ON {join_cond}
        ORDER BY s.net_revenue DESC;
        """
        all_params = params + inv_params
        rows = db.execute(query, all_params).fetchall()
    else:
        query = f"""
        SELECT
            {select_cols},
            SUM(ABS(v.NET_SALE_AMOUNT)) AS net_revenue,
            SUM(ABS(v.NET_SALE_QUANTITY)) AS sales_units,
            SUM(v.GP_AMOUNT) AS gross_profit,
            CASE 
                WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 
                THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2)
                ELSE 0.0 
            END AS margin_pct,
            SUM(v.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
            SUM(v.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
            CASE 
                WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0 
                THEN ROUND((SUM(ABS(v.NET_SALE_QUANTITY)) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                ELSE 0.0 
            END AS sell_through_pct,
            CASE 
                WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0) > 0 
                THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0), 1)
                ELSE 999.0 
            END AS woc
        FROM v_fact_item_location_monthly v
        {where_clause}
        GROUP BY {group_by}
        ORDER BY net_revenue DESC;
        """
        rows = db.execute(query, params).fetchall()

    items = [
        CategoryHierarchyItem(
            division=row[0] or "UNKNOWN",
            section=row[1] or "ALL",
            department=row[2] or "ALL",
            department_alias=row[3] or "ALL",
            net_revenue=float(row[4]),
            sales_units=float(row[5]),
            gross_profit=float(row[6]),
            margin_pct=float(row[7]),
            closing_stock_value=float(row[8]) if row[8] is not None else 0.0,
            closing_stock_units=float(row[9]) if row[9] is not None else 0.0,
            sell_through_pct=float(row[10]) if row[10] is not None else 0.0,
            woc=float(row[11]) if row[11] is not None else 999.0,
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/matrix", response_model=StandardResponse[List[CategoryMatrixItem]])
def get_category_matrix(
    division: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db = Depends(get_db),
):
    """
    Returns Category Performance Matrix categorizing departments into WINNER, VOLUME_DRIVER, HIGH_MARGIN_SLOW, OVERSTOCKED_UNDERPERFORMER.
    """
    where_clause, params = build_where_clause(
        store_ids=store_ids,
        months=months,
        division=division,
        table_prefix="v"
    )
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
        inv_where_clause = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        query = f"""
        WITH dept_sales AS (
            SELECT
                v.Department AS department,
                MAX(v.Division) AS division,
                SUM(v.NET_SALE_AMOUNT) AS net_revenue,
                SUM(v.NET_SALE_QUANTITY) AS sales_units,
                SUM(v.GP_AMOUNT) AS gross_profit,
                CASE 
                    WHEN SUM(v.NET_SALE_AMOUNT) > 0 
                    THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2)
                    ELSE 0.0 
                END AS margin_pct
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY v.Department
            HAVING SUM(v.NET_SALE_AMOUNT) > 1000 AND margin_pct > 0
        ),
        dept_inv AS (
            SELECT
                department,
                SUM(closing_amt) AS closing_stock_value,
                SUM(closing_qty) AS closing_stock_units,
                SUM(opening_qty + purchase_net_qty + transfer_in_qty) AS available_units,
                SUM(final_sale_qty) AS sum_final_sale_qty,
                CASE
                    WHEN SUM(opening_qty + purchase_net_qty + transfer_in_qty) > 0
                    THEN ROUND((SUM(final_sale_qty) / SUM(opening_qty + purchase_net_qty + transfer_in_qty)) * 100.0, 2)
                    ELSE 0.0
                END AS sell_through_pct,
                CASE
                    WHEN (SUM(final_sale_qty) / 24.0) > 0
                    THEN ROUND(SUM(closing_qty) / (SUM(final_sale_qty) / 24.0), 2)
                    ELSE 999.0
                END AS woc
            FROM v_fact_inventory_enriched
            {inv_where_clause}
            GROUP BY department
        ),
        combined AS (
            SELECT
                s.department AS department,
                s.division AS division,
                s.net_revenue AS net_revenue,
                s.sales_units AS sales_units,
                s.gross_profit AS gross_profit,
                s.margin_pct AS margin_pct,
                COALESCE(i.closing_stock_value, 0.0) AS closing_stock_value,
                COALESCE(i.closing_stock_units, 0) AS closing_stock_units,
                COALESCE(i.sell_through_pct, 0.0) AS sell_through_pct,
                COALESCE(i.woc, 999.0) AS woc
            FROM dept_sales s
            LEFT JOIN dept_inv i ON s.department = i.department
        ),
        benchmarks AS (
            SELECT 
                median(margin_pct) AS med_margin,
                median(sell_through_pct) AS med_sell_through
            FROM combined
        )
        SELECT
            d.department,
            d.division,
            d.net_revenue,
            d.sales_units,
            d.gross_profit,
            d.margin_pct,
            d.closing_stock_value,
            d.closing_stock_units,
            d.sell_through_pct,
            d.woc,
            CASE
                WHEN d.margin_pct >= b.med_margin AND d.sell_through_pct >= b.med_sell_through THEN 'WINNER'
                WHEN d.margin_pct < b.med_margin AND d.sell_through_pct >= b.med_sell_through THEN 'VOLUME_DRIVER'
                WHEN d.margin_pct >= b.med_margin AND d.sell_through_pct < b.med_sell_through THEN 'HIGH_MARGIN_SLOW'
                ELSE 'OVERSTOCKED_UNDERPERFORMER'
            END AS performance_quadrant
        FROM combined d, benchmarks b
        ORDER BY d.net_revenue DESC;
        """
        all_params = params + inv_params
        rows = db.execute(query, all_params).fetchall()
    else:
        query = f"""
        WITH dept_aggregates AS (
            SELECT
                v.Department AS department,
                MAX(v.Division) AS division,
                SUM(ABS(v.NET_SALE_AMOUNT)) AS net_revenue,
                SUM(ABS(v.NET_SALE_QUANTITY)) AS sales_units,
                SUM(v.GP_AMOUNT) AS gross_profit,
                CASE 
                    WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 
                    THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2)
                    ELSE 0.0 
                END AS margin_pct,
                SUM(v.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
                SUM(v.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
                CASE 
                    WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0 
                    THEN ROUND((SUM(ABS(v.NET_SALE_QUANTITY)) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
                    ELSE 0.0 
                END AS sell_through_pct,
                CASE 
                    WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0) > 0 
                    THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0), 1)
                    ELSE 999.0 
                END AS woc
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY v.Department
            HAVING SUM(ABS(v.NET_SALE_AMOUNT)) > 1000 AND margin_pct > 0
        ),
        benchmarks AS (
            SELECT 
                median(margin_pct) AS med_margin,
                median(sell_through_pct) AS med_sell_through
            FROM dept_aggregates
        )
        SELECT
            d.department,
            d.division,
            d.net_revenue,
            d.sales_units,
            d.gross_profit,
            d.margin_pct,
            d.closing_stock_value,
            d.closing_stock_units,
            d.sell_through_pct,
            d.woc,
            CASE
                WHEN d.margin_pct >= b.med_margin AND d.sell_through_pct >= b.med_sell_through THEN 'WINNER'
                WHEN d.margin_pct < b.med_margin AND d.sell_through_pct >= b.med_sell_through THEN 'VOLUME_DRIVER'
                WHEN d.margin_pct >= b.med_margin AND d.sell_through_pct < b.med_sell_through THEN 'HIGH_MARGIN_SLOW'
                ELSE 'OVERSTOCKED_UNDERPERFORMER'
            END AS performance_quadrant
        FROM dept_aggregates d, benchmarks b
        ORDER BY d.net_revenue DESC;
        """
        rows = db.execute(query, params).fetchall()

    items = [
        CategoryMatrixItem(
            department=row[0] or "UNKNOWN",
            division=row[1] or "UNKNOWN",
            net_revenue=float(row[2]),
            sales_units=float(row[3]),
            gross_profit=float(row[4]),
            margin_pct=float(row[5]),
            closing_stock_value=float(row[6]) if row[6] is not None else 0.0,
            closing_stock_units=float(row[7]) if row[7] is not None else 0.0,
            sell_through_pct=float(row[8]) if row[8] is not None else 0.0,
            woc=float(row[9]) if row[9] is not None else 999.0,
            performance_quadrant=row[10],
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/top-movers", response_model=StandardResponse[TopMoversResponse])
def get_top_movers(
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    limit: int = Query(5, ge=1, le=20),
    db = Depends(get_db),
):
    """
    Returns top N fastest moving categories and bottom N underperformers.
    """
    where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        inv_conditions = []
        inv_params = []
        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            inv_conditions.append(f"admsite_code IN ({placeholders})")
            inv_params.extend(store_ids)
        inv_where_clause = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        query_fast = f"""
        WITH dept_sales AS (
            SELECT
                v.Department AS department,
                MAX(v.Division) AS division,
                SUM(v.NET_SALE_AMOUNT) AS net_revenue,
                SUM(v.NET_SALE_QUANTITY) AS sales_units,
                SUM(v.GP_AMOUNT) AS gross_profit,
                CASE WHEN SUM(v.NET_SALE_AMOUNT) > 0 THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2) ELSE 0.0 END AS margin_pct
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY v.Department
            HAVING SUM(v.NET_SALE_AMOUNT) > 1000
        ),
        dept_inv AS (
            SELECT
                department,
                SUM(closing_amt) AS closing_stock_value,
                SUM(closing_qty) AS closing_stock_units,
                SUM(opening_qty + purchase_net_qty + transfer_in_qty) AS available_units,
                SUM(final_sale_qty) AS sum_final_sale_qty,
                CASE WHEN SUM(opening_qty + purchase_net_qty + transfer_in_qty) > 0 THEN ROUND((SUM(final_sale_qty) / SUM(opening_qty + purchase_net_qty + transfer_in_qty)) * 100.0, 2) ELSE 0.0 END AS sell_through_pct,
                CASE WHEN (SUM(final_sale_qty) / 24.0) > 0 THEN ROUND(SUM(closing_qty) / (SUM(final_sale_qty) / 24.0), 2) ELSE 999.0 END AS woc
            FROM v_fact_inventory_enriched
            {inv_where_clause}
            GROUP BY department
        ),
        combined AS (
            SELECT
                s.department AS department,
                s.division AS division,
                s.net_revenue AS net_revenue,
                s.sales_units AS sales_units,
                s.gross_profit AS gross_profit,
                s.margin_pct AS margin_pct,
                COALESCE(i.closing_stock_value, 0.0) AS closing_stock_value,
                COALESCE(i.closing_stock_units, 0) AS closing_stock_units,
                COALESCE(i.sell_through_pct, 0.0) AS sell_through_pct,
                COALESCE(i.woc, 999.0) AS woc
            FROM dept_sales s
            LEFT JOIN dept_inv i ON s.department = i.department
        )
        SELECT
            department,
            division,
            net_revenue,
            sales_units,
            gross_profit,
            margin_pct,
            closing_stock_value,
            closing_stock_units,
            sell_through_pct,
            woc,
            'WINNER' AS performance_quadrant
        FROM combined
        ORDER BY sell_through_pct DESC
        LIMIT {limit};
        """

        query_slow = f"""
        WITH dept_sales AS (
            SELECT
                v.Department AS department,
                MAX(v.Division) AS division,
                SUM(v.NET_SALE_AMOUNT) AS net_revenue,
                SUM(v.NET_SALE_QUANTITY) AS sales_units,
                SUM(v.GP_AMOUNT) AS gross_profit,
                CASE WHEN SUM(v.NET_SALE_AMOUNT) > 0 THEN ROUND((SUM(v.GP_AMOUNT) / SUM(v.NET_SALE_AMOUNT)) * 100.0, 2) ELSE 0.0 END AS margin_pct
            FROM v_fact_item_location_monthly v
            {where_clause}
            GROUP BY v.Department
            HAVING SUM(v.NET_SALE_AMOUNT) > 1000
        ),
        dept_inv AS (
            SELECT
                department,
                SUM(closing_amt) AS closing_stock_value,
                SUM(closing_qty) AS closing_stock_units,
                SUM(opening_qty + purchase_net_qty + transfer_in_qty) AS available_units,
                SUM(final_sale_qty) AS sum_final_sale_qty,
                CASE WHEN SUM(opening_qty + purchase_net_qty + transfer_in_qty) > 0 THEN ROUND((SUM(final_sale_qty) / SUM(opening_qty + purchase_net_qty + transfer_in_qty)) * 100.0, 2) ELSE 0.0 END AS sell_through_pct,
                CASE WHEN (SUM(final_sale_qty) / 24.0) > 0 THEN ROUND(SUM(closing_qty) / (SUM(final_sale_qty) / 24.0), 2) ELSE 999.0 END AS woc
            FROM v_fact_inventory_enriched
            {inv_where_clause}
            GROUP BY department
        ),
        combined AS (
            SELECT
                s.department AS department,
                s.division AS division,
                s.net_revenue AS net_revenue,
                s.sales_units AS sales_units,
                s.gross_profit AS gross_profit,
                s.margin_pct AS margin_pct,
                COALESCE(i.closing_stock_value, 0.0) AS closing_stock_value,
                COALESCE(i.closing_stock_units, 0) AS closing_stock_units,
                COALESCE(i.sell_through_pct, 0.0) AS sell_through_pct,
                COALESCE(i.woc, 999.0) AS woc
            FROM dept_sales s
            LEFT JOIN dept_inv i ON s.department = i.department
        )
        SELECT
            department,
            division,
            net_revenue,
            sales_units,
            gross_profit,
            margin_pct,
            closing_stock_value,
            closing_stock_units,
            sell_through_pct,
            woc,
            'OVERSTOCKED_UNDERPERFORMER' AS performance_quadrant
        FROM combined
        WHERE closing_stock_units > 0
        ORDER BY woc DESC
        LIMIT {limit};
        """
        all_params = params + inv_params
        fast_rows = db.execute(query_fast, all_params).fetchall()
        slow_rows = db.execute(query_slow, all_params).fetchall()
    else:
        query_fast = f"""
        SELECT
            v.Department AS department,
            MAX(v.Division) AS division,
            SUM(ABS(v.NET_SALE_AMOUNT)) AS net_revenue,
            SUM(ABS(v.NET_SALE_QUANTITY)) AS sales_units,
            SUM(v.GP_AMOUNT) AS gross_profit,
            CASE WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2) ELSE 0.0 END AS margin_pct,
            SUM(v.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
            SUM(v.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
            CASE WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0 THEN ROUND((SUM(ABS(v.NET_SALE_QUANTITY)) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2) ELSE 0.0 END AS sell_through_pct,
            CASE WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0) > 0 THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0), 1) ELSE 999.0 END AS woc,
            'WINNER' AS performance_quadrant
        FROM v_fact_item_location_monthly v
        {where_clause}
        GROUP BY v.Department
        ORDER BY sell_through_pct DESC
        LIMIT {limit};
        """

        query_slow = f"""
        SELECT
            v.Department AS department,
            MAX(v.Division) AS division,
            SUM(ABS(v.NET_SALE_AMOUNT)) AS net_revenue,
            SUM(ABS(v.NET_SALE_QUANTITY)) AS sales_units,
            SUM(v.GP_AMOUNT) AS gross_profit,
            CASE WHEN SUM(ABS(v.NET_SALE_AMOUNT)) > 0 THEN ROUND((SUM(v.GP_AMOUNT) / SUM(ABS(v.NET_SALE_AMOUNT))) * 100.0, 2) ELSE 0.0 END AS margin_pct,
            SUM(v.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
            SUM(v.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
            CASE WHEN (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY)) > 0 THEN ROUND((SUM(ABS(v.NET_SALE_QUANTITY)) / (SUM(v.OPENING_QUANTITY) + SUM(v.GOODS_RECEIVE_QUANTITY) + SUM(v.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2) ELSE 0.0 END AS sell_through_pct,
            CASE WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0) > 0 THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 24.0), 1) ELSE 999.0 END AS woc,
            'OVERSTOCKED_UNDERPERFORMER' AS performance_quadrant
        FROM v_fact_item_location_monthly v
        {where_clause}
        GROUP BY v.Department
        HAVING SUM(v.CLOSING_STOCK_QUANTITY) > 0
        ORDER BY woc DESC
        LIMIT {limit};
        """
        fast_rows = db.execute(query_fast, params).fetchall()
        slow_rows = db.execute(query_slow, params).fetchall()

    def map_item(row):
        return CategoryMatrixItem(
            department=row[0] or "UNKNOWN",
            division=row[1] or "UNKNOWN",
            net_revenue=float(row[2]),
            sales_units=float(row[3]),
            gross_profit=float(row[4]),
            margin_pct=float(row[5]),
            closing_stock_value=float(row[6]) if row[6] is not None else 0.0,
            closing_stock_units=float(row[7]) if row[7] is not None else 0.0,
            sell_through_pct=float(row[8]) if row[8] is not None else 0.0,
            woc=float(row[9]) if row[9] is not None else 999.0,
            performance_quadrant=row[10],
        )

    data = TopMoversResponse(
        fastest_movers=[map_item(r) for r in fast_rows],
        underperformers=[map_item(r) for r in slow_rows],
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(fast_rows) + len(slow_rows))
    return StandardResponse(success=True, data=data, meta=meta)


@router.get("/growth", response_model=StandardResponse[List[CategoryGrowthItem]])
def get_category_growth(
    division: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format. If omitted, uses latest available month."),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db),
):
    """
    Returns period-over-period category revenue and volume growth rates.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    # 1. Discover available months to validate user input
    month_sql = (
        "SELECT DISTINCT formatDateTime(period_start_date, '%Y-%m') AS ym FROM fact_sales_monthly ORDER BY ym"
        if is_clickhouse
        else "SELECT DISTINCT strftime(period_start_date, '%Y-%m') AS ym FROM fact_sales_monthly ORDER BY ym"
    )
    avail_rows = db.execute(month_sql).fetchall()
    available_months = [r[0] for r in avail_rows]

    if month:
        target_month = month.strip()[:7]
        if target_month not in available_months:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid month '{month}'. Available months are: {', '.join(available_months)}"
            )
    else:
        target_month = available_months[-1] if available_months else "2025-09"

    # 2. Build filters
    conditions = []
    params = []

    if store_ids:
        placeholders = ", ".join(["?"] * len(store_ids))
        conditions.append(f"l.admsite_code IN ({placeholders})")
        params.extend(store_ids)

    if division and division.strip().upper() != "ALL":
        conditions.append("UPPER(p.division) = ?")
        params.append(division.strip().upper())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # 3. Windowed Month-over-Month calculation partitioned by department AND division
    if is_clickhouse:
        query = f"""
        WITH monthly_dept AS (
            SELECT
                COALESCE(p.department, 'UNKNOWN') AS department,
                COALESCE(p.division, 'UNKNOWN') AS division,
                f.period_start_date AS month_date,
                SUM(f.net_amount) AS revenue,
                SUM(f.bill_qty) AS units
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            {where_clause}
            GROUP BY COALESCE(p.department, 'UNKNOWN'), COALESCE(p.division, 'UNKNOWN'), f.period_start_date
        ),
        ranked AS (
            SELECT
                department,
                division,
                month_date,
                revenue AS current_revenue,
                units AS current_units,
                lagInFrame(toNullable(revenue)) OVER (PARTITION BY department, division ORDER BY month_date) AS prior_revenue,
                lagInFrame(toNullable(units)) OVER (PARTITION BY department, division ORDER BY month_date) AS prior_units
            FROM monthly_dept
        )
        SELECT
            department,
            division,
            formatDateTime(month_date, '%Y-%m') AS month,
            current_revenue,
            prior_revenue,
            CASE
                WHEN prior_revenue IS NOT NULL AND prior_revenue > 0
                THEN round(((toFloat64(current_revenue) - toFloat64(prior_revenue)) / toFloat64(prior_revenue)) * 100.0, 2)
                ELSE NULL
            END AS revenue_growth_pct,
            current_units,
            prior_units,
            CASE
                WHEN prior_units IS NOT NULL AND prior_units > 0
                THEN round(((toFloat64(current_units) - toFloat64(prior_units)) / toFloat64(prior_units)) * 100.0, 2)
                ELSE NULL
            END AS units_growth_pct
        FROM ranked
        WHERE formatDateTime(month_date, '%Y-%m') = ?
        ORDER BY current_revenue DESC
        LIMIT {limit};
        """
    else:
        query = f"""
        WITH monthly_dept AS (
            SELECT
                COALESCE(p.department, 'UNKNOWN') AS department,
                COALESCE(p.division, 'UNKNOWN') AS division,
                f.period_start_date AS month_date,
                SUM(f.net_amount) AS revenue,
                SUM(f.bill_qty) AS units
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            {where_clause}
            GROUP BY COALESCE(p.department, 'UNKNOWN'), COALESCE(p.division, 'UNKNOWN'), f.period_start_date
        ),
        ranked AS (
            SELECT
                department,
                division,
                month_date,
                revenue AS current_revenue,
                units AS current_units,
                lag(revenue) OVER (PARTITION BY department, division ORDER BY month_date) AS prior_revenue,
                lag(units) OVER (PARTITION BY department, division ORDER BY month_date) AS prior_units
            FROM monthly_dept
        )
        SELECT
            department,
            division,
            strftime(month_date, '%Y-%m') AS month,
            current_revenue,
            prior_revenue,
            CASE
                WHEN prior_revenue IS NOT NULL AND prior_revenue > 0
                THEN round(((CAST(current_revenue AS DOUBLE) - CAST(prior_revenue AS DOUBLE)) / CAST(prior_revenue AS DOUBLE)) * 100.0, 2)
                ELSE NULL
            END AS revenue_growth_pct,
            current_units,
            prior_units,
            CASE
                WHEN prior_units IS NOT NULL AND prior_units > 0
                THEN round(((CAST(current_units AS DOUBLE) - CAST(prior_units AS DOUBLE)) / CAST(prior_units AS DOUBLE)) * 100.0, 2)
                ELSE NULL
            END AS units_growth_pct
        FROM ranked
        WHERE strftime(month_date, '%Y-%m') = ?
        ORDER BY current_revenue DESC
        LIMIT {limit};
        """

    all_params = params + [target_month]
    rows = db.execute(query, all_params).fetchall()
    items = [
        CategoryGrowthItem(
            department=row[0] or "UNKNOWN",
            division=row[1] or "UNKNOWN",
            month=row[2],
            current_revenue=float(row[3]) if row[3] is not None else 0.0,
            prior_revenue=float(row[4]) if row[4] is not None else None,
            revenue_growth_pct=float(row[5]) if row[5] is not None else None,
            current_units=float(row[6]) if row[6] is not None else 0.0,
            prior_units=float(row[7]) if row[7] is not None else None,
            units_growth_pct=float(row[8]) if row[8] is not None else None,
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, applied_months=[target_month], total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)

