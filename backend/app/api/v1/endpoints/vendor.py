from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.vendor import VendorScorecardItem, VendorListResponse
from backend.app.utils.query_builder import build_where_clause

router = APIRouter()

ALLOWED_SORT_FIELDS = {
    "vendor_name": "vendor_name",
    "total_skus_supplied": "total_skus_supplied",
    "receive_units": "receive_units",
    "receive_value": "receive_value",
    "return_units": "return_units",
    "return_value": "return_value",
    "sales_units": "sales_units",
    "net_revenue": "net_revenue",
    "gross_profit": "gross_profit",
    "current_stock_units": "current_stock_units",
    "current_stock_value": "current_stock_value",
    "sell_through_pct": "sell_through_pct",
    "margin_pct": "margin_pct",
    "return_rate_pct": "return_rate_pct",
    "vendor_score": "vendor_score",
}

@router.get("/scorecard", response_model=StandardResponse[VendorListResponse])
def get_vendor_scorecard(
    min_score: Optional[float] = Query(None),
    search_name: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    sort_by: str = Query("vendor_score"),
    order: str = Query("desc", enum=["asc", "desc"]),
    limit: int = Query(100, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    db = Depends(get_db),
):
    """
    Returns vendor performance scorecard items with dynamic search, filtering by min_score, store_ids, and sorting.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        conditions = []
        params = []
        inv_conditions = []
        inv_params = []

        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            conditions.append(f"l.admsite_code IN ({placeholders})")
            inv_conditions.append(f"l.admsite_code IN ({placeholders})")
            params.extend(store_ids)
            inv_params.extend(store_ids)

        if months:
            month_conds = []
            for m in months:
                month_conds.append("formatDateTime(f.period_start_date, '%Y-%m') = ?")
                params.append(m)
            if month_conds:
                conditions.append(f"({' OR '.join(month_conds)})")

        where_sales = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        where_inv = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        where_post_conditions = []
        post_params = []
        if min_score is not None:
            where_post_conditions.append("vendor_score >= ?")
            post_params.append(min_score)
        if search_name and search_name.strip():
            where_post_conditions.append("UPPER(vendor_name) LIKE ?")
            post_params.append(f"%{search_name.strip().upper()}%")
        where_post_clause = ("WHERE " + " AND ".join(where_post_conditions)) if where_post_conditions else ""

        query_base = f"""
        WITH sales AS (
            SELECT
                COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                count(DISTINCT f.item_code) AS total_skus_supplied,
                sum(f.bill_qty) AS sales_units,
                round(sum(f.net_amount), 2) AS net_revenue,
                round(sum(f.gross_profit), 2) AS gross_profit,
                CASE WHEN sum(f.net_amount) > 0 THEN round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) ELSE 0.0 END AS margin_pct
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            {where_sales}
            GROUP BY p.vendor_name
        ),
        inv AS (
            SELECT
                COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                SUM(i.closing_qty) AS current_stock_units,
                SUM(i.closing_amt) AS current_stock_value,
                SUM(i.purchase_net_qty + i.transfer_in_qty) AS receive_units,
                SUM(i.purchase_net_amt + i.transfer_in_amt) AS receive_value,
                SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty) AS available_units,
                SUM(i.final_sale_qty) AS sum_final_sale_qty,
                CASE
                    WHEN SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty) > 0
                    THEN ROUND((SUM(i.final_sale_qty) / SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty)) * 100.0, 2)
                    ELSE 0.0
                END AS sell_through_pct
            FROM fact_inventory i
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            {where_inv}
            GROUP BY p.vendor_name
        ),
        vendor_combined AS (
            SELECT
                s.vendor_name AS vendor_name,
                s.total_skus_supplied AS total_skus_supplied,
                COALESCE(i.receive_units, 0.0) AS receive_units,
                COALESCE(i.receive_value, 0.0) AS receive_value,
                0.0 AS return_units,
                0.0 AS return_value,
                s.sales_units AS sales_units,
                s.net_revenue AS net_revenue,
                s.gross_profit AS gross_profit,
                COALESCE(i.current_stock_units, 0.0) AS current_stock_units,
                COALESCE(i.current_stock_value, 0.0) AS current_stock_value,
                COALESCE(i.sell_through_pct, 0.0) AS sell_through_pct,
                s.margin_pct AS margin_pct,
                0.0 AS return_rate_pct
            FROM sales s
            LEFT JOIN inv i ON s.vendor_name = i.vendor_name
        ),
        ranked_vendors AS (
            SELECT
                *,
                PERCENT_RANK() OVER (ORDER BY net_revenue ASC) AS rev_rank,
                PERCENT_RANK() OVER (ORDER BY sell_through_pct ASC) AS st_rank,
                PERCENT_RANK() OVER (ORDER BY margin_pct ASC) AS margin_rank
            FROM vendor_combined
        ),
        vendor_scored AS (
            SELECT
                vendor_name,
                total_skus_supplied,
                receive_units,
                receive_value,
                return_units,
                return_value,
                sales_units,
                net_revenue,
                gross_profit,
                current_stock_units,
                current_stock_value,
                sell_through_pct,
                margin_pct,
                return_rate_pct,
                ROUND(((rev_rank * 0.50) + (st_rank * 0.30) + (margin_rank * 0.20)) * 100.0, 1) AS vendor_score
            FROM ranked_vendors
        )
        SELECT * FROM vendor_scored
        {where_post_clause}
        """
        params = params + inv_params + post_params
    elif store_ids or months:
        # Include Central Warehouse (1070) so vendor receive_units and sell_through_pct calculate correctly
        effective_store_ids = list(store_ids) if store_ids else None
        if effective_store_ids and 1070 not in effective_store_ids:
            effective_store_ids.append(1070)

        where_clause, params = build_where_clause(store_ids=effective_store_ids, months=months, table_prefix="f")
        
        where_post_conditions = []
        if min_score is not None:
            where_post_conditions.append("vendor_score >= ?")
            params.append(min_score)

        if search_name and search_name.strip():
            where_post_conditions.append("UPPER(vendor_name) LIKE ?")
            params.append(f"%{search_name.strip().upper()}%")

        where_post_clause = ("WHERE " + " AND ".join(where_post_conditions)) if where_post_conditions else ""

        query_base = f"""
        WITH vendor_agg AS (
            SELECT
                COALESCE(i.PARTYNAME, 'UNKNOWN_VENDOR') AS vendor_name,
                COUNT(DISTINCT f.BARCODE) AS total_skus_supplied,
                
                -- Warehouse (1070) receipts & returns
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) AS receive_units,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_AMOUNT ELSE 0 END) AS receive_value,
                SUM(ABS(f.GOODS_RETURN_QUANTITY)) AS return_units,
                SUM(ABS(f.GOODS_RETURN_AMOUNT)) AS return_value,
                
                -- Retail sales
                SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
                SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
                SUM(f.GP_AMOUNT) AS gross_profit,
                
                -- Stock
                SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
                SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
                
                CASE 
                    WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
                    THEN (SUM(ABS(f.NET_SALE_QUANTITY)) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100 
                    ELSE 0.0 
                END AS sell_through_pct,
                
                CASE 
                    WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 
                    THEN (SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100 
                    ELSE 0.0 
                END AS margin_pct,
                
                CASE 
                    WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
                    THEN ROUND((SUM(ABS(f.GOODS_RETURN_QUANTITY)) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100.0, 2)
                    ELSE 0.0 
                END AS return_rate_pct
            FROM fact_cube_monthly f
            LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
            {where_clause}
            GROUP BY i.PARTYNAME
        ),
        ranked_vendors AS (
            SELECT
                *,
                PERCENT_RANK() OVER (ORDER BY net_revenue ASC) AS rev_rank,
                PERCENT_RANK() OVER (ORDER BY sell_through_pct ASC) AS st_rank,
                PERCENT_RANK() OVER (ORDER BY margin_pct ASC) AS margin_rank,
                PERCENT_RANK() OVER (ORDER BY return_rate_pct DESC) AS return_rank
            FROM vendor_agg
        ),
        vendor_scored AS (
            SELECT
                vendor_name,
                total_skus_supplied,
                receive_units,
                receive_value,
                return_units,
                return_value,
                sales_units,
                net_revenue,
                gross_profit,
                current_stock_units,
                current_stock_value,
                ROUND(sell_through_pct, 2) AS sell_through_pct,
                ROUND(margin_pct, 2) AS margin_pct,
                return_rate_pct,
                ROUND(
                    (
                        (rev_rank * 0.35) + 
                        (st_rank * 0.35) + 
                        (margin_rank * 0.20) + 
                        (return_rank * 0.10)
                    ) * 100.0, 1
                ) AS vendor_score
            FROM ranked_vendors
        )
        SELECT * FROM vendor_scored
        {where_post_clause}
        """
    else:
        # Query v_vendor_scorecard view directly
        conditions = []
        params = []
        if min_score is not None:
            conditions.append("vendor_score >= ?")
            params.append(min_score)
        if search_name and search_name.strip():
            conditions.append("UPPER(vendor_name) LIKE ?")
            params.append(f"%{search_name.strip().upper()}%")

        where_str = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        query_base = f"SELECT * FROM v_vendor_scorecard {where_str}"

    sort_column = ALLOWED_SORT_FIELDS.get(sort_by, "vendor_score")
    sort_order = "ASC" if order.lower() == "asc" else "DESC"

    count_query = f"SELECT COUNT(*) FROM ({query_base}) sub"
    total_vendors = db.execute(count_query, params).fetchone()[0]

    data_query = f"{query_base} ORDER BY {sort_column} {sort_order} LIMIT {limit} OFFSET {offset}"
    rows = db.execute(data_query, params).fetchall()

    items = [
        VendorScorecardItem(
            vendor_name=row[0] or "UNKNOWN_VENDOR",
            total_skus_supplied=int(row[1]),
            receive_units=float(row[2]),
            receive_value=float(row[3]),
            return_units=float(row[4]),
            return_value=float(row[5]),
            sales_units=float(row[6]),
            net_revenue=float(row[7]),
            gross_profit=float(row[8]),
            current_stock_units=float(row[9]),
            current_stock_value=float(row[10]),
            sell_through_pct=float(row[11]),
            margin_pct=float(row[12]),
            return_rate_pct=float(row[13]),
            vendor_score=float(row[14]),
        )
        for row in rows
    ]

    response_data = VendorListResponse(total_vendors=total_vendors, items=items)
    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=total_vendors)
    return StandardResponse(success=True, data=response_data, meta=meta)


@router.get("/returns", response_model=StandardResponse[List[VendorScorecardItem]])
def get_high_return_vendors(
    min_return_rate: float = Query(5.0, ge=0.0, le=100.0),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns vendors with high return rates (default return_rate_pct > 5.0%), returning total returned units and monetary value.
    """
    from backend.app.config import settings
    if settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse":
        return StandardResponse(
            success=True,
            supported=False,
            message="The current inventory dataset does not contain separate vendor-return transaction records, so return-risk analysis cannot be calculated reliably.",
            data=[]
        )

    if store_ids or months:
        # Note: Vendor receipts & returns are logged at Central Warehouse (1070).
        # We ensure 1070 is included or return metrics are aggregated cleanly.
        effective_store_ids = list(store_ids) if store_ids else None
        if effective_store_ids and 1070 not in effective_store_ids:
            effective_store_ids.append(1070)

        where_clause, params = build_where_clause(store_ids=effective_store_ids, months=months, table_prefix="f")
        params.append(min_return_rate)
        query = f"""
        WITH vendor_agg AS (
            SELECT
                COALESCE(i.PARTYNAME, 'UNKNOWN_VENDOR') AS vendor_name,
                COUNT(DISTINCT f.BARCODE) AS total_skus_supplied,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) AS receive_units,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_AMOUNT ELSE 0 END) AS receive_value,
                SUM(ABS(f.GOODS_RETURN_QUANTITY)) AS return_units,
                SUM(ABS(f.GOODS_RETURN_AMOUNT)) AS return_value,
                SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
                SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
                SUM(f.GP_AMOUNT) AS gross_profit,
                SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
                SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
                CASE 
                    WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
                    THEN (SUM(ABS(f.NET_SALE_QUANTITY)) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100 
                    ELSE 0.0 
                END AS sell_through_pct,
                CASE 
                    WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 
                    THEN (SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100 
                    ELSE 0.0 
                END AS margin_pct,
                CASE 
                    WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
                    THEN ROUND((SUM(ABS(f.GOODS_RETURN_QUANTITY)) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100.0, 2)
                    ELSE 0.0 
                END AS return_rate_pct
            FROM fact_cube_monthly f
            LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
            {where_clause}
            GROUP BY i.PARTYNAME
            HAVING return_rate_pct > ?
        )
        SELECT
            vendor_name,
            total_skus_supplied,
            receive_units,
            receive_value,
            return_units,
            return_value,
            sales_units,
            net_revenue,
            gross_profit,
            current_stock_units,
            current_stock_value,
            ROUND(sell_through_pct, 2) AS sell_through_pct,
            ROUND(margin_pct, 2) AS margin_pct,
            return_rate_pct,
            ROUND(
                GREATEST(0.0, LEAST(
                    (LEAST(sell_through_pct, 100.0) * 0.40) + 
                    (margin_pct * 0.40) + 
                    (GREATEST(0.0, (100.0 - return_rate_pct * 5.0)) * 0.20), 
                    100.0
                )), 1
            ) AS vendor_score
        FROM vendor_agg
        ORDER BY return_value DESC;
        """
    else:
        params = [min_return_rate]
        query = "SELECT * FROM v_vendor_scorecard WHERE return_rate_pct > ? ORDER BY return_value DESC;"

    rows = db.execute(query, params).fetchall()

    items = [
        VendorScorecardItem(
            vendor_name=row[0] or "UNKNOWN_VENDOR",
            total_skus_supplied=int(row[1]),
            receive_units=float(row[2]),
            receive_value=float(row[3]),
            return_units=float(row[4]),
            return_value=float(row[5]),
            sales_units=float(row[6]),
            net_revenue=float(row[7]),
            gross_profit=float(row[8]),
            current_stock_units=float(row[9]),
            current_stock_value=float(row[10]),
            sell_through_pct=float(row[11]),
            margin_pct=float(row[12]),
            return_rate_pct=float(row[13]),
            vendor_score=float(row[14]),
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)


@router.get("/top-contributors", response_model=StandardResponse[List[VendorScorecardItem]])
def get_top_contributor_vendors(
    limit: int = Query(10, ge=1, le=50),
    store_ids: Optional[List[int]] = Query(None),
    months: Optional[List[str]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns top N vendors contributing highest net revenue and gross profit.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        conditions = []
        params = []
        inv_conditions = []
        inv_params = []

        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            conditions.append(f"l.admsite_code IN ({placeholders})")
            inv_conditions.append(f"l.admsite_code IN ({placeholders})")
            params.extend(store_ids)
            inv_params.extend(store_ids)

        if months:
            month_conds = []
            for m in months:
                month_conds.append("formatDateTime(f.period_start_date, '%Y-%m') = ?")
                params.append(m)
            if month_conds:
                conditions.append(f"({' OR '.join(month_conds)})")

        where_sales = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        where_inv = f"WHERE {' AND '.join(inv_conditions)}" if inv_conditions else ""

        query = f"""
        WITH sales AS (
            SELECT
                COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                count(DISTINCT f.item_code) AS total_skus_supplied,
                sum(f.bill_qty) AS sales_units,
                round(sum(f.net_amount), 2) AS net_revenue,
                round(sum(f.gross_profit), 2) AS gross_profit,
                CASE WHEN sum(f.net_amount) > 0 THEN round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) ELSE 0.0 END AS margin_pct
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            {where_sales}
            GROUP BY p.vendor_name
        ),
        inv AS (
            SELECT
                COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                SUM(i.closing_qty) AS current_stock_units,
                SUM(i.closing_amt) AS current_stock_value,
                SUM(i.purchase_net_qty + i.transfer_in_qty) AS receive_units,
                SUM(i.purchase_net_amt + i.transfer_in_amt) AS receive_value,
                SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty) AS available_units,
                SUM(i.final_sale_qty) AS sum_final_sale_qty,
                CASE
                    WHEN SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty) > 0
                    THEN ROUND((SUM(i.final_sale_qty) / SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty)) * 100.0, 2)
                    ELSE 0.0
                END AS sell_through_pct
            FROM fact_inventory i
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            {where_inv}
            GROUP BY p.vendor_name
        ),
        vendor_combined AS (
            SELECT
                s.vendor_name AS vendor_name,
                s.total_skus_supplied AS total_skus_supplied,
                COALESCE(i.receive_units, 0.0) AS receive_units,
                COALESCE(i.receive_value, 0.0) AS receive_value,
                0.0 AS return_units,
                0.0 AS return_value,
                s.sales_units AS sales_units,
                s.net_revenue AS net_revenue,
                s.gross_profit AS gross_profit,
                COALESCE(i.current_stock_units, 0.0) AS current_stock_units,
                COALESCE(i.current_stock_value, 0.0) AS current_stock_value,
                COALESCE(i.sell_through_pct, 0.0) AS sell_through_pct,
                s.margin_pct AS margin_pct,
                0.0 AS return_rate_pct
            FROM sales s
            LEFT JOIN inv i ON s.vendor_name = i.vendor_name
        ),
        ranked_vendors AS (
            SELECT
                *,
                PERCENT_RANK() OVER (ORDER BY net_revenue ASC) AS rev_rank,
                PERCENT_RANK() OVER (ORDER BY sell_through_pct ASC) AS st_rank,
                PERCENT_RANK() OVER (ORDER BY margin_pct ASC) AS margin_rank
            FROM vendor_combined
        )
        SELECT
            vendor_name,
            total_skus_supplied,
            receive_units,
            receive_value,
            return_units,
            return_value,
            sales_units,
            net_revenue,
            gross_profit,
            current_stock_units,
            current_stock_value,
            sell_through_pct,
            margin_pct,
            return_rate_pct,
            ROUND(((rev_rank * 0.50) + (st_rank * 0.30) + (margin_rank * 0.20)) * 100.0, 1) AS vendor_score
        FROM ranked_vendors
        ORDER BY net_revenue DESC, gross_profit DESC
        LIMIT {limit};
        """
        params_list = params + inv_params
    elif store_ids or months:
        effective_store_ids = list(store_ids) if store_ids else None
        if effective_store_ids and 1070 not in effective_store_ids:
            effective_store_ids.append(1070)

        where_clause, params = build_where_clause(store_ids=effective_store_ids, months=months, table_prefix="f")
        query = f"""
        WITH vendor_agg AS (
            SELECT
                COALESCE(i.PARTYNAME, 'UNKNOWN_VENDOR') AS vendor_name,
                COUNT(DISTINCT f.BARCODE) AS total_skus_supplied,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) AS receive_units,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_AMOUNT ELSE 0 END) AS receive_value,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_QUANTITY) ELSE 0 END) AS return_units,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_AMOUNT) ELSE 0 END) AS return_value,
                SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
                SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
                SUM(f.GP_AMOUNT) AS gross_profit,
                SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
                SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
                CASE 
                    WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
                    THEN (SUM(ABS(f.NET_SALE_QUANTITY)) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100 
                    ELSE 0.0 
                END AS sell_through_pct,
                CASE 
                    WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 
                    THEN (SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100 
                    ELSE 0.0 
                END AS margin_pct,
                CASE 
                    WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
                    THEN ROUND((SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_QUANTITY) ELSE 0 END) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100.0, 2)
                    ELSE 0.0 
                END AS return_rate_pct
            FROM fact_cube_monthly f
            LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
            {where_clause}
            GROUP BY i.PARTYNAME
        )
        SELECT
            vendor_name,
            total_skus_supplied,
            receive_units,
            receive_value,
            return_units,
            return_value,
            sales_units,
            net_revenue,
            gross_profit,
            current_stock_units,
            current_stock_value,
            ROUND(sell_through_pct, 2) AS sell_through_pct,
            ROUND(margin_pct, 2) AS margin_pct,
            return_rate_pct,
            ROUND(
                GREATEST(0.0, LEAST(
                    (LEAST(sell_through_pct, 100.0) * 0.40) + 
                    (margin_pct * 0.40) + 
                    (GREATEST(0.0, (100.0 - return_rate_pct * 5.0)) * 0.20), 
                    100.0
                )), 1
            ) AS vendor_score
        FROM vendor_agg
        ORDER BY net_revenue DESC, gross_profit DESC
        LIMIT {limit};
        """
        params_list = params
    else:
        query = f"SELECT * FROM v_vendor_scorecard ORDER BY net_revenue DESC, gross_profit DESC LIMIT {limit};"
        params_list = []

    rows = db.execute(query, params_list).fetchall()

    items = [
        VendorScorecardItem(
            vendor_name=row[0] or "UNKNOWN_VENDOR",
            total_skus_supplied=int(row[1]),
            receive_units=float(row[2]),
            receive_value=float(row[3]),
            return_units=float(row[4]),
            return_value=float(row[5]),
            sales_units=float(row[6]),
            net_revenue=float(row[7]),
            gross_profit=float(row[8]),
            current_stock_units=float(row[9]),
            current_stock_value=float(row[10]),
            sell_through_pct=float(row[11]),
            margin_pct=float(row[12]),
            return_rate_pct=float(row[13]),
            vendor_score=float(row[14]),
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, applied_months=months, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta)
