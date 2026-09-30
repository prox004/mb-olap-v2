from typing import List, Optional, Tuple
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


def _build_sku_base_query(
    store_ids: Optional[List[int]] = None,
    months: Optional[List[str]] = None,
    division: Optional[str] = None,
    department: Optional[str] = None,
) -> Tuple[str, list]:
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        sales_where, sales_params = build_where_clause(
            store_ids=store_ids,
            months=months,
            division=division,
            department=department,
            table_prefix="v"
        )
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
        num_months = float(len(months)) if months and len(months) > 0 else 12.0

        query = f"""
        WITH unified AS (
            SELECT
                v.BARCODE AS barcode,
                any(v.ARTICLE_NAME) AS description,
                any(v.Division) AS division,
                any(v.Section) AS section,
                any(v.Department) AS department,
                any(v.PARTYNAME) AS vendor,
                max(toFloat64(v.MRP)) AS mrp,
                max(toFloat64(v.RATE)) AS cost_rate,
                sum(toFloat64(v.NET_SALE_AMOUNT)) AS net_revenue,
                sum(toFloat64(v.NET_SALE_QUANTITY)) AS sales_units,
                sum(toFloat64(v.GP_AMOUNT)) AS gross_profit,
                0.0 AS opening_units,
                0.0 AS purchase_units,
                0.0 AS transfer_in_units,
                0.0 AS closing_stock_units,
                0.0 AS closing_stock_value
            FROM v_fact_item_location_monthly v
            {sales_where}
            GROUP BY v.BARCODE

            UNION ALL

            SELECT
                i.item_code AS barcode,
                any(i.article_name) AS description,
                any(i.division) AS division,
                any(i.section) AS section,
                any(i.department) AS department,
                any(i.vendor_name) AS vendor,
                max(toFloat64(i.rsp)) AS mrp,
                max(toFloat64(i.rsp)) AS cost_rate,
                0.0 AS net_revenue,
                0.0 AS sales_units,
                0.0 AS gross_profit,
                sum(toFloat64(i.opening_qty)) AS opening_units,
                sum(toFloat64(i.purchase_net_qty)) AS purchase_units,
                sum(toFloat64(i.transfer_in_qty)) AS transfer_in_units,
                sum(toFloat64(i.closing_qty)) AS closing_stock_units,
                sum(toFloat64(i.closing_amt)) AS closing_stock_value
            FROM v_fact_inventory_enriched i
            {inv_where}
            GROUP BY i.item_code
        ),
        sku_agg AS (
            SELECT
                barcode,
                coalesce(nullif(any(description), ''), barcode) AS description,
                coalesce(nullif(any(division), ''), 'UNKNOWN') AS division,
                coalesce(nullif(any(section), ''), 'UNKNOWN') AS section,
                coalesce(nullif(any(department), ''), 'UNKNOWN') AS department,
                coalesce(nullif(any(vendor), ''), 'UNKNOWN') AS vendor,
                max(mrp) AS mrp,
                max(cost_rate) AS cost_rate,
                sum(net_revenue) AS net_revenue,
                sum(sales_units) AS sales_units,
                sum(gross_profit) AS gross_profit,
                sum(opening_units) AS opening_units,
                sum(purchase_units) AS purchase_units,
                sum(transfer_in_units) AS transfer_in_units,
                sum(closing_stock_units) AS closing_stock_units,
                sum(closing_stock_value) AS closing_stock_value
            FROM unified
            GROUP BY barcode
        ),
        sku_summary AS (
            SELECT
                barcode, description, division, section, department, vendor,
                mrp, cost_rate, net_revenue, sales_units, gross_profit,
                closing_stock_units, closing_stock_value,
                CASE
                    WHEN (opening_units + purchase_units + transfer_in_units) > 0
                    THEN (sales_units / (opening_units + purchase_units + transfer_in_units)) * 100.0
                    WHEN (sales_units + closing_stock_units) > 0
                    THEN (sales_units / (sales_units + closing_stock_units)) * 100.0
                    ELSE 0.0
                END AS sell_through_pct,
                CASE
                    WHEN (sales_units / ({num_months} * 4.33)) > 0
                    THEN round(closing_stock_units / (sales_units / ({num_months} * 4.33)), 1)
                    ELSE 999.0
                END AS woc,
                CASE
                    WHEN (sales_units / {num_months}) > 0
                    THEN round(closing_stock_units / (sales_units / {num_months}), 1)
                    ELSE 999.0
                END AS moi,
                CASE
                    WHEN sales_units <= 0 AND closing_stock_units > 0 THEN 'DEAD_STOCK'
                    WHEN (sales_units / ({num_months} * 4.33)) > 0 AND (closing_stock_units / (sales_units / ({num_months} * 4.33))) < 4.0 THEN 'FAST_MOVER'
                    WHEN (sales_units / ({num_months} * 4.33)) > 0 AND (closing_stock_units / (sales_units / ({num_months} * 4.33))) BETWEEN 4.0 AND 12.0 THEN 'MEDIUM_MOVER'
                    ELSE 'SLOW_MOVER'
                END AS velocity_status
            FROM sku_agg
        )
        SELECT * FROM sku_summary
        """
        all_params = sales_params + inv_params
        return query, all_params
    else:
        where_clause, params = build_where_clause(
            store_ids=store_ids,
            months=months,
            division=division,
            department=department,
            table_prefix="v"
        )
        query = f"""
        WITH filtered_fact AS (
            SELECT 
                v.BARCODE,
                v.ADMSITE_CODE,
                v.START_DATE,
                v.NET_SALE_AMOUNT,
                v.NET_SALE_QUANTITY,
                v.GP_AMOUNT,
                v.CLOSING_STOCK_QUANTITY,
                v.CLOSING_STOCK_AMOUNT,
                v.OPENING_QUANTITY,
                v.GOODS_RECEIVE_QUANTITY,
                v.SITE_TRANSFER_IN_QUANTITY,
                v.DESC1 AS description,
                v.Division AS division,
                v.Section AS section,
                v.Department AS department,
                v.PARTYNAME AS vendor,
                v.MRP AS mrp,
                v.RATE AS cost_rate
            FROM v_fact_item_location_monthly v
            {where_clause}
        ),
        period_meta AS (
            SELECT COUNT(DISTINCT strftime(START_DATE, '%Y-%m')) AS num_months
            FROM filtered_fact
        )
        SELECT
            f.BARCODE AS barcode,
            f.description AS description,
            f.division AS division,
            f.section AS section,
            f.department AS department,
            f.vendor AS vendor,
            f.mrp AS mrp,
            f.cost_rate AS cost_rate,
            SUM(f.NET_SALE_AMOUNT) AS net_revenue,
            SUM(f.NET_SALE_QUANTITY) AS sales_units,
            SUM(f.GP_AMOUNT) AS gross_profit,
            SUM(f.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
            SUM(f.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
            CASE 
                WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
                THEN (SUM(f.NET_SALE_QUANTITY) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100.0
                ELSE 0.0 
            END AS sell_through_pct,
            -- Weeks of Cover (WOC) = Closing Stock / Weekly Sales Rate
            CASE 
                WHEN (SUM(f.NET_SALE_QUANTITY) / (MAX(pm.num_months) * 4.33)) > 0 
                THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / (MAX(pm.num_months) * 4.33))
                ELSE 999.0 
            END AS woc,
            -- Months of Inventory (MOI) = Closing Stock / Monthly Sales Rate
            CASE 
                WHEN (SUM(f.NET_SALE_QUANTITY) / MAX(pm.num_months)) > 0 
                THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / MAX(pm.num_months))
                ELSE 999.0 
            END AS moi,
            CASE
                WHEN SUM(f.NET_SALE_QUANTITY) = 0 AND SUM(f.CLOSING_STOCK_QUANTITY) > 0 THEN 'DEAD_STOCK'
                WHEN (SUM(f.NET_SALE_QUANTITY) / (MAX(pm.num_months) * 4.33)) > 0 
                     AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / (MAX(pm.num_months) * 4.33))) < 4.0 THEN 'FAST_MOVER'
                WHEN (SUM(f.NET_SALE_QUANTITY) / (MAX(pm.num_months) * 4.33)) > 0 
                     AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / (MAX(pm.num_months) * 4.33))) BETWEEN 4.0 AND 12.0 THEN 'MEDIUM_MOVER'
                ELSE 'SLOW_MOVER'
            END AS velocity_status
        FROM filtered_fact f
        CROSS JOIN period_meta pm
        GROUP BY f.BARCODE, f.description, f.division, f.section, f.department, f.vendor, f.mrp, f.cost_rate
        """
        return query, params


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
    db = Depends(get_db),
):
    """
    Returns paginated list of SKU inventory velocity performance metrics with dynamic slice and dice filters.
    """
    base_query, base_params = _build_sku_base_query(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
    )
    params = list(base_params)

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

    where_post = f"WHERE {' AND '.join(post_conditions)}" if post_conditions else ""

    # Sort & pagination
    sort_column = ALLOWED_SORT_FIELDS.get(sort_by.lower(), "net_revenue")
    sort_order = "ASC" if order.lower() == "asc" else "DESC"

    # Count query
    count_query = f"SELECT COUNT(*) FROM ({base_query}) sub {where_post}"
    total_records = db.execute(count_query, params).fetchone()[0]

    # Data query
    offset = (page - 1) * page_size
    data_query = f"""
    SELECT
        barcode, description, division, section, department, vendor,
        mrp, cost_rate, net_revenue, sales_units, gross_profit,
        closing_stock_units, closing_stock_value, sell_through_pct,
        woc, moi, velocity_status
    FROM ({base_query}) sub
    {where_post}
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
    db = Depends(get_db),
):
    """
    Returns summary and paginated list of 90-day Dead Stock liquidation candidates matching slice and dice filters.
    """
    base_query, base_params = _build_sku_base_query(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
    )
    params = list(base_params)

    # Total stats query
    stats_query = f"SELECT COUNT(*), COALESCE(SUM(closing_stock_value), 0.0) FROM ({base_query}) sub WHERE velocity_status = 'DEAD_STOCK'"
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
    FROM ({base_query}) sub
    WHERE velocity_status = 'DEAD_STOCK'
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
    db = Depends(get_db),
):
    """
    Returns velocity status breakdown for slice and dice filter selections.
    """
    base_query, params = _build_sku_base_query(
        store_ids=store_ids,
        months=months,
        division=division,
        department=department,
    )

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
