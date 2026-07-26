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
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns vendor performance scorecard items with dynamic search, filtering by min_score, store_ids, and sorting.
    """
    if store_ids or months:
        # Dynamic calculation joining fact table for store/month filtering
        where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="f")
        
        having_conditions = []
        if min_score is not None:
            having_conditions.append("GREATEST(0.0, LEAST((LEAST(sell_through_pct, 100.0) * 0.40) + (margin_pct * 0.40) + (GREATEST(0.0, (100.0 - return_rate_pct * 5.0)) * 0.20), 100.0)) >= ?")
            params.append(min_score)

        if search_name and search_name.strip():
            having_conditions.append("UPPER(vendor_name) LIKE ?")
            params.append(f"%{search_name.strip().upper()}%")

        having_clause = ("HAVING " + " AND ".join(having_conditions)) if having_conditions else ""

        query_base = f"""
        WITH vendor_agg AS (
            SELECT
                COALESCE(i.PARTYNAME, 'UNKNOWN_VENDOR') AS vendor_name,
                COUNT(DISTINCT f.BARCODE) AS total_skus_supplied,
                
                -- Warehouse (1070) receipts & returns
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) AS receive_units,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_AMOUNT ELSE 0 END) AS receive_value,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_QUANTITY) ELSE 0 END) AS return_units,
                SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_AMOUNT) ELSE 0 END) AS return_value,
                
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
                    THEN ROUND((SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_QUANTITY) ELSE 0 END) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100.0, 2)
                    ELSE 0.0 
                END AS return_rate_pct
            FROM fact_cube_monthly f
            LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
            {where_clause}
            GROUP BY i.PARTYNAME
            {having_clause}
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
    if store_ids or months:
        where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="f")
        params.append(min_return_rate)
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
    if store_ids or months:
        where_clause, params = build_where_clause(store_ids=store_ids, months=months, table_prefix="f")
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
