from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse
from backend.app.schemas.financial import (
    GmroiItem,
    BuyingAccuracyItem,
    MarkdownSummaryItem,
)

router = APIRouter()

@router.get("/gmroi", response_model=StandardResponse[Optional[List[GmroiItem]]])
def get_gmroi_analysis(
    group_by: str = Query("store", enum=["store", "department", "vendor", "sku"]),
    store_ids: Optional[List[int]] = Query(None),
    department: Optional[str] = Query(None),
    db = Depends(get_db),
):
    """
    Returns GMROI metrics grouped by Store, Category (Department), Vendor, or SKU.
    """
    from backend.app.config import settings
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        sales_conds = []
        inv_conds = []
        params = []
        inv_params = []

        if department and department.upper() != "ALL":
            sales_conds.append("UPPER(p.department) LIKE ?")
            inv_conds.append("UPPER(p.department) LIKE ?")
            param_dept = f"%{department.strip().upper()}%"
            params.append(param_dept)
            inv_params.append(param_dept)

        if store_ids:
            store_placeholders = ", ".join(["?"] * len(store_ids))
            sales_conds.append(f"l.admsite_code IN ({store_placeholders})")
            inv_conds.append(f"l.admsite_code IN ({store_placeholders})")
            params.extend(store_ids)
            inv_params.extend(store_ids)

        sales_where = f"WHERE {' AND '.join(sales_conds)}" if sales_conds else ""
        inv_where = f"WHERE {' AND '.join(inv_conds)}" if inv_conds else ""

        if group_by == "store":
            sales_cte = f"""
                SELECT
                    l.admsite_code AS admsite_code,
                    COALESCE(l.store_name, concat('Store ', toString(l.admsite_code))) AS store_name,
                    SUM(f.net_amount) AS total_revenue,
                    SUM(f.gross_profit) AS total_gross_profit
                FROM fact_sales_monthly f
                LEFT JOIN dim_location l ON f.store_code = l.store_code
                LEFT JOIN dim_product p ON f.item_code = p.item_code
                {sales_where}
                GROUP BY l.admsite_code, l.store_name
            """
            inv_cte = f"""
                SELECT
                    l.admsite_code AS admsite_code,
                    COALESCE(l.store_name, concat('Store ', toString(l.admsite_code))) AS store_name,
                    (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
                FROM fact_inventory i
                LEFT JOIN dim_location l ON i.store_code = l.store_code
                LEFT JOIN dim_product p ON i.item_code = p.item_code
                {inv_where}
                GROUP BY l.admsite_code, l.store_name
            """
            keys_cte = "SELECT admsite_code FROM sales UNION DISTINCT SELECT admsite_code FROM inv"
            select_cols = "k.admsite_code, COALESCE(s.store_name, i.store_name, concat('Store ', toString(k.admsite_code))) AS store_name, 'ALL' AS division, 'ALL' AS department, 'ALL' AS vendor_name, NULL AS barcode, 'ALL' AS item_name"
            join_clause = "k.admsite_code = s.admsite_code LEFT JOIN inv i ON k.admsite_code = i.admsite_code"

        elif group_by == "department":
            sales_cte = f"""
                SELECT
                    COALESCE(p.department, 'UNKNOWN') AS department,
                    COALESCE(MAX(p.division), 'UNKNOWN') AS division,
                    SUM(f.net_amount) AS total_revenue,
                    SUM(f.gross_profit) AS total_gross_profit
                FROM fact_sales_monthly f
                LEFT JOIN dim_product p ON f.item_code = p.item_code
                LEFT JOIN dim_location l ON f.store_code = l.store_code
                {sales_where}
                GROUP BY COALESCE(p.department, 'UNKNOWN')
            """
            inv_cte = f"""
                SELECT
                    COALESCE(p.department, 'UNKNOWN') AS department,
                    (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
                FROM fact_inventory i
                LEFT JOIN dim_product p ON i.item_code = p.item_code
                LEFT JOIN dim_location l ON i.store_code = l.store_code
                {inv_where}
                GROUP BY COALESCE(p.department, 'UNKNOWN')
            """
            keys_cte = "SELECT department FROM sales UNION DISTINCT SELECT department FROM inv"
            select_cols = "NULL AS admsite_code, 'ALL' AS store_name, COALESCE(s.division, 'UNKNOWN') AS division, k.department AS department, 'ALL' AS vendor_name, NULL AS barcode, 'ALL' AS item_name"
            join_clause = "k.department = s.department LEFT JOIN inv i ON k.department = i.department"

        elif group_by == "vendor":
            sales_cte = f"""
                SELECT
                    COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                    SUM(f.net_amount) AS total_revenue,
                    SUM(f.gross_profit) AS total_gross_profit
                FROM fact_sales_monthly f
                LEFT JOIN dim_product p ON f.item_code = p.item_code
                LEFT JOIN dim_location l ON f.store_code = l.store_code
                {sales_where}
                GROUP BY COALESCE(p.vendor_name, 'UNKNOWN_VENDOR')
            """
            inv_cte = f"""
                SELECT
                    COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                    (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
                FROM fact_inventory i
                LEFT JOIN dim_product p ON i.item_code = p.item_code
                LEFT JOIN dim_location l ON i.store_code = l.store_code
                {inv_where}
                GROUP BY COALESCE(p.vendor_name, 'UNKNOWN_VENDOR')
            """
            keys_cte = "SELECT vendor_name FROM sales UNION DISTINCT SELECT vendor_name FROM inv"
            select_cols = "NULL AS admsite_code, 'ALL' AS store_name, 'ALL' AS division, 'ALL' AS department, k.vendor_name AS vendor_name, NULL AS barcode, 'ALL' AS item_name"
            join_clause = "k.vendor_name = s.vendor_name LEFT JOIN inv i ON k.vendor_name = i.vendor_name"

        else: # sku
            sales_cte = f"""
                SELECT
                    f.item_code AS item_code,
                    COALESCE(MAX(p.article_name), f.item_code) AS item_name,
                    COALESCE(MAX(p.division), 'UNKNOWN') AS division,
                    COALESCE(MAX(p.department), 'UNKNOWN') AS department,
                    COALESCE(MAX(p.vendor_name), 'UNKNOWN') AS vendor_name,
                    SUM(f.net_amount) AS total_revenue,
                    SUM(f.gross_profit) AS total_gross_profit
                FROM fact_sales_monthly f
                LEFT JOIN dim_product p ON f.item_code = p.item_code
                LEFT JOIN dim_location l ON f.store_code = l.store_code
                {sales_where}
                GROUP BY f.item_code
            """
            inv_cte = f"""
                SELECT
                    i.item_code AS item_code,
                    (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
                FROM fact_inventory i
                LEFT JOIN dim_location l ON i.store_code = l.store_code
                LEFT JOIN dim_product p ON i.item_code = p.item_code
                {inv_where}
                GROUP BY i.item_code
            """
            keys_cte = "SELECT item_code FROM sales UNION DISTINCT SELECT item_code FROM inv"
            select_cols = "NULL AS admsite_code, 'ALL' AS store_name, COALESCE(s.division, 'UNKNOWN') AS division, COALESCE(s.department, 'UNKNOWN') AS department, COALESCE(s.vendor_name, 'UNKNOWN') AS vendor_name, k.item_code AS barcode, COALESCE(s.item_name, k.item_code) AS item_name"
            join_clause = "k.item_code = s.item_code LEFT JOIN inv i ON k.item_code = i.item_code"

        query = f"""
        WITH sales AS ({sales_cte}),
        inv AS ({inv_cte}),
        all_keys AS ({keys_cte})
        SELECT
            {select_cols},
            COALESCE(s.total_revenue, 0.0) AS total_revenue,
            COALESCE(s.total_gross_profit, 0.0) AS total_gross_profit,
            COALESCE(i.avg_inventory_value, 0.0) AS avg_inventory_value,
            CASE 
                WHEN COALESCE(i.avg_inventory_value, 0.0) > 0 
                THEN ROUND(COALESCE(s.total_gross_profit, 0.0) / i.avg_inventory_value, 2)
                ELSE 0.0 
            END AS gmroi_ratio
        FROM all_keys k
        LEFT JOIN sales s ON {join_clause}
        ORDER BY gmroi_ratio DESC
        """
        all_params = params + inv_params
        rows = db.execute(query, all_params).fetchall()
    else:
        conditions = []
        params = []

        if department and department.upper() != "ALL":
            conditions.append("UPPER(department) = ?")
            params.append(department.strip().upper())

        if store_ids:
            store_placeholders = ", ".join(["?"] * len(store_ids))
            conditions.append(f"admsite_code IN ({store_placeholders})")
            params.extend(store_ids)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        if group_by == "store":
            select_cols = "admsite_code, store_name, 'ALL' AS division, 'ALL' AS department, 'ALL' AS vendor_name, NULL AS barcode, 'ALL' AS item_name"
            group_cols = "admsite_code, store_name"
        elif group_by == "department":
            select_cols = "NULL AS admsite_code, 'ALL' AS store_name, 'ALL' AS division, department, 'ALL' AS vendor_name, NULL AS barcode, 'ALL' AS item_name"
            group_cols = "department"
        elif group_by == "vendor":
            select_cols = "NULL AS admsite_code, 'ALL' AS store_name, 'ALL' AS division, 'ALL' AS department, vendor_name, NULL AS barcode, 'ALL' AS item_name"
            group_cols = "vendor_name"
        else:  # sku
            select_cols = "NULL AS admsite_code, 'ALL' AS store_name, 'ALL' AS division, 'ALL' AS department, 'ALL' AS vendor_name, barcode, item_name"
            group_cols = "barcode, item_name"

        query = f"""
        SELECT
            {select_cols},
            SUM(total_revenue) AS total_revenue,
            SUM(total_gross_profit) AS total_gross_profit,
            SUM(avg_inventory_value) AS avg_inventory_value,
            CASE 
                WHEN SUM(avg_inventory_value) > 0 
                THEN ROUND(SUM(total_gross_profit) / SUM(avg_inventory_value), 2)
                ELSE 0.0 
            END AS gmroi_ratio
        FROM v_gmroi_analysis
        {where_clause}
        GROUP BY {group_cols}
        ORDER BY gmroi_ratio DESC
        """
        rows = db.execute(query, params).fetchall()

    result = [
        GmroiItem(
            admsite_code=r[0],
            store_name=r[1],
            division=r[2],
            department=r[3],
            vendor_name=r[4],
            barcode=r[5],
            item_name=r[6],
            total_revenue=float(r[7] or 0.0),
            total_gross_profit=float(r[8] or 0.0),
            avg_inventory_value=float(r[9] or 0.0),
            gmroi_ratio=float(r[10] or 0.0),
        )
        for r in rows
    ]

    return StandardResponse(success=True, supported=True, message="Period GMROI calculated from two-point average inventory [(Opening + Closing) / 2]", data=result)

@router.get("/buying-accuracy", response_model=StandardResponse[Optional[List[BuyingAccuracyItem]]])
def get_buying_accuracy(
    department: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db = Depends(get_db),
):
    """
    Returns bought vs sold vs unsold units and discount impact metrics.
    """
    from backend.app.config import settings
    if settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse":
        ch_conds = []
        ch_params = []
        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            ch_conds.append(f"l.admsite_code IN ({placeholders})")
            ch_params.extend(store_ids)
        if department and department.upper() != "ALL":
            ch_conds.append("UPPER(p.department) LIKE ?")
            ch_params.append(f"%{department.strip().upper()}%")

        where_ch = f"WHERE {' AND '.join(ch_conds)}" if ch_conds else ""
        ch_query = f"""
        SELECT
            COALESCE(p.department, 'UNKNOWN') AS department,
            SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty) AS total_bought_units,
            ROUND(SUM(i.opening_amt + i.purchase_net_amt + i.transfer_in_amt), 2) AS total_bought_value,
            SUM(i.final_sale_qty) AS total_sold_units,
            ROUND(SUM(i.final_sale_qty * p.rsp), 2) AS total_sold_value,
            SUM(i.closing_qty) AS unsold_units,
            ROUND(SUM(i.closing_amt), 2) AS unsold_value,
            0.0 AS total_discount_amount,
            0.0 AS total_promo_amount,
            CASE
                WHEN SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty) > 0
                THEN ROUND((SUM(i.final_sale_qty) / SUM(i.opening_qty + i.purchase_net_qty + i.transfer_in_qty)) * 100.0, 2)
                ELSE 0.0
            END AS buying_accuracy_pct
        FROM fact_inventory i
        LEFT JOIN dim_product p ON i.item_code = p.item_code
        LEFT JOIN dim_location l ON i.store_code = l.store_code
        {where_ch}
        GROUP BY COALESCE(p.department, 'UNKNOWN')
        HAVING total_sold_units > 0 OR unsold_units > 0
        ORDER BY total_sold_units DESC
        LIMIT 50
        """
        rows = db.execute(ch_query, ch_params).fetchall()
        result = [
            BuyingAccuracyItem(
                department=str(r[0]),
                total_bought_units=float(r[1] or 0),
                total_bought_value=float(r[2] or 0),
                total_sold_units=float(r[3] or 0),
                total_sold_value=float(r[4] or 0),
                unsold_units=float(r[5] or 0),
                unsold_value=float(r[6] or 0),
                total_discount_amount=float(r[7] or 0),
                total_promo_amount=float(r[8] or 0),
                buying_accuracy_pct=float(r[9] or 0),
            )
            for r in rows
        ]
        return StandardResponse(success=True, supported=True, message="Success", data=result)

    conditions = []
    params = []

    if department and department.upper() != "ALL":
        conditions.append("UPPER(i.Department) = ?")
        params.append(department.strip().upper())

    if store_ids:
        store_placeholders = ", ".join(["?"] * len(store_ids))
        conditions.append(f"f.ADMSITE_CODE IN ({store_placeholders})")
        params.extend(store_ids)

        # Aggregate dynamically from raw tables to support store filters
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"""
        SELECT
            COALESCE(i.Department, 'UNKNOWN') AS department,
            SUM(f.GOODS_RECEIVE_QUANTITY) AS total_bought_units,
            SUM(f.GOODS_RECEIVE_AMOUNT) AS total_bought_value,
            SUM(ABS(f.NET_SALE_QUANTITY)) AS total_sold_units,
            SUM(ABS(f.NET_SALE_AMOUNT)) AS total_sold_value,
            SUM(f.CLOSING_STOCK_QUANTITY) AS unsold_units,
            SUM(f.CLOSING_STOCK_AMOUNT) AS unsold_value,
            SUM(f.SALE_DISCOUNT_AMOUNT) AS total_discount_amount,
            SUM(f.SALE_PROMO_AMOUNT) AS total_promo_amount,
            CASE 
                WHEN SUM(f.GOODS_RECEIVE_QUANTITY) > 0 
                THEN ROUND((SUM(ABS(f.NET_SALE_QUANTITY)) / SUM(f.GOODS_RECEIVE_QUANTITY)) * 100.0, 2)
                ELSE 0.0 
            END AS buying_accuracy_pct
        FROM fact_cube_monthly f
        LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
        {where_clause}
        GROUP BY i.Department
        ORDER BY buying_accuracy_pct DESC
        """
    else:
        # Standard query from v_buying_accuracy_summary
        # Adapt WHERE clause prefix to department from view
        view_conditions = []
        view_params = []
        if department and department.upper() != "ALL":
            view_conditions.append("UPPER(department) = ?")
            view_params.append(department.strip().upper())

        where_clause = f"WHERE {' AND '.join(view_conditions)}" if view_conditions else ""
        query = f"""
        SELECT
            department,
            total_bought_units,
            total_bought_value,
            total_sold_units,
            total_sold_value,
            unsold_units,
            unsold_value,
            total_discount_amount,
            total_promo_amount,
            buying_accuracy_pct
        FROM v_buying_accuracy_summary
        {where_clause}
        ORDER BY buying_accuracy_pct DESC
        """
        params = view_params

    rows = db.execute(query, params).fetchall()
    result = [
        BuyingAccuracyItem(
            department=r[0],
            total_bought_units=float(r[1] or 0.0),
            total_bought_value=float(r[2] or 0.0),
            total_sold_units=float(r[3] or 0.0),
            total_sold_value=float(r[4] or 0.0),
            unsold_units=float(r[5] or 0.0),
            unsold_value=float(r[6] or 0.0),
            total_discount_amount=float(r[7] or 0.0),
            total_promo_amount=float(r[8] or 0.0),
            buying_accuracy_pct=float(r[9] or 0.0),
        )
        for r in rows
    ]

    return StandardResponse(success=True, data=result)

@router.get("/markdown-summary", response_model=StandardResponse[Optional[MarkdownSummaryItem]])
def get_markdown_summary(
    department: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db = Depends(get_db),
):
    """
    Returns overall total markdown/discount summary metrics.
    """
    from backend.app.config import settings
    if settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse":
        return StandardResponse(
            success=False,
            supported=False,
            message="Markdown and promo discount allocations are unavailable in the 2025 POS sales ledger dataset.",
            data=None
        )
    conditions = []
    params = []

    if department and department.upper() != "ALL":
        conditions.append("UPPER(i.Department) = ?")
        params.append(department.strip().upper())

    if store_ids:
        store_placeholders = ", ".join(["?"] * len(store_ids))
        conditions.append(f"f.ADMSITE_CODE IN ({store_placeholders})")
        params.extend(store_ids)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
    SELECT
        COALESCE(SUM(f.SALE_DISCOUNT_AMOUNT), 0.0) AS total_discount_amount,
        COALESCE(SUM(f.SALE_PROMO_AMOUNT), 0.0) AS total_promo_amount,
        COALESCE(SUM(f.GP_AMOUNT), 0.0) AS total_gross_profit,
        COALESCE(SUM(f.ADJUSTED_GP_AMOUNT), 0.0) AS total_adjusted_gross_profit
    FROM fact_cube_monthly f
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    {where_clause}
    """

    row = db.execute(query, params).fetchone()
    result = MarkdownSummaryItem(
        total_discount_amount=float(row[0]),
        total_promo_amount=float(row[1]),
        total_gross_profit=float(row[2]),
        total_adjusted_gross_profit=float(row[3]),
    )

    return StandardResponse(success=True, data=result)
