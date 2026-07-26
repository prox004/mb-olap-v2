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

@router.get("/gmroi", response_model=StandardResponse[List[GmroiItem]])
def get_gmroi_analysis(
    group_by: str = Query("store", enum=["store", "department", "vendor", "sku"]),
    store_ids: Optional[List[int]] = Query(None),
    department: Optional[str] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns GMROI metrics grouped by Store, Category (Department), Vendor, or SKU.
    """
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

    # Determine group columns and aggregation logic
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
            THEN ROUND(4.0 * SUM(total_gross_profit) / SUM(avg_inventory_value), 2)
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

    return StandardResponse(success=True, data=result)

@router.get("/buying-accuracy", response_model=StandardResponse[List[BuyingAccuracyItem]])
def get_buying_accuracy(
    department: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns bought vs sold vs unsold units and discount impact metrics.
    """
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

@router.get("/markdown-summary", response_model=StandardResponse[MarkdownSummaryItem])
def get_markdown_summary(
    department: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Returns overall total markdown/discount summary metrics.
    """
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
