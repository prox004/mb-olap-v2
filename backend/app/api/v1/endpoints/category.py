from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.category import (
    CategoryHierarchyItem,
    CategoryMatrixItem,
    TopMoversResponse,
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
    db: DuckDBPyConnection = Depends(get_db),
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
            closing_stock_value=float(row[8]),
            closing_stock_units=float(row[9]),
            sell_through_pct=float(row[10]),
            woc=float(row[11]),
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
    db: DuckDBPyConnection = Depends(get_db),
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
                WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0) > 0 
                THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0), 1)
                ELSE 999.0 
            END AS woc
        FROM v_fact_item_location_monthly v
        {where_clause}
        GROUP BY v.Department
    ),
    benchmarks AS (
        SELECT 
            AVG(margin_pct) AS avg_margin,
            AVG(sell_through_pct) AS avg_sell_through
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
            WHEN d.margin_pct >= b.avg_margin AND d.sell_through_pct >= b.avg_sell_through THEN 'WINNER'
            WHEN d.margin_pct < b.avg_margin AND d.sell_through_pct >= b.avg_sell_through THEN 'VOLUME_DRIVER'
            WHEN d.margin_pct >= b.avg_margin AND d.sell_through_pct < b.avg_sell_through THEN 'HIGH_MARGIN_SLOW'
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
            closing_stock_value=float(row[6]),
            closing_stock_units=float(row[7]),
            sell_through_pct=float(row[8]),
            woc=float(row[9]),
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
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns top N fastest moving categories by sell-through % and bottom N underperformers by high WOC (>16 weeks).
    """
    where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="v")

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
        CASE WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0) > 0 THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0), 1) ELSE 999.0 END AS woc,
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
        CASE WHEN (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0) > 0 THEN ROUND(SUM(v.CLOSING_STOCK_QUANTITY) / (SUM(ABS(v.NET_SALE_QUANTITY)) / 12.0), 1) ELSE 999.0 END AS woc,
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
            closing_stock_value=float(row[6]),
            closing_stock_units=float(row[7]),
            sell_through_pct=float(row[8]),
            woc=float(row[9]),
            performance_quadrant=row[10],
        )

    data = TopMoversResponse(
        fastest_movers=[map_item(r) for r in fast_rows],
        underperformers=[map_item(r) for r in slow_rows],
    )

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(fast_rows) + len(slow_rows))
    return StandardResponse(success=True, data=data, meta=meta)
