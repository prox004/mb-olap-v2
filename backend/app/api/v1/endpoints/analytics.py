from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse
from backend.app.schemas.analytics import (
    SizeCurveItem,
    PriceBandItem,
    SizeRecommendationRequest,
    SizeRecommendationResponse,
    SizeRecommendationItem,
)

router = APIRouter()

@router.get("/size-curve", response_model=StandardResponse[List[SizeCurveItem]])
def get_size_curve(
    department: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Exposes size curve sales distribution ratios from v_size_curve_distribution.
    Supports filtering by department and division.
    """
    conditions = []
    params = []

    if department and department.upper() != "ALL":
        conditions.append("UPPER(department) = ?")
        params.append(department.strip().upper())

    if division and division.upper() != "ALL":
        conditions.append("UPPER(division) = ?")
        params.append(division.strip().upper())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
    SELECT
        division,
        department,
        size_code,
        total_bought_units,
        total_sold_units,
        current_stock_units,
        net_revenue,
        size_contribution_pct
    FROM v_size_curve_distribution
    {where_clause}
    ORDER BY division, department, size_contribution_pct DESC
    """

    rows = db.execute(query, params).fetchall()
    result = [
        SizeCurveItem(
            division=r[0],
            department=r[1],
            size_code=r[2],
            total_bought_units=float(r[3] or 0.0),
            total_sold_units=float(r[4] or 0.0),
            current_stock_units=float(r[5] or 0.0),
            net_revenue=float(r[6] or 0.0),
            size_contribution_pct=float(r[7] or 0.0),
        )
        for r in rows
    ]

    return StandardResponse(success=True, data=result)

@router.post("/recommend-size-po", response_model=StandardResponse[SizeRecommendationResponse])
def recommend_size_po(
    request: SizeRecommendationRequest,
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Projects historical size_contribution_pct to calculate recommended purchase order units per size tag.
    Ensures recommended units sum up exactly to the requested target total PO units.
    """
    # Fetch historical size curve distribution for specified department
    query = """
    SELECT size_code, size_contribution_pct
    FROM v_size_curve_distribution
    WHERE UPPER(department) = ? AND total_sold_units > 0
    ORDER BY size_contribution_pct DESC
    """
    rows = db.execute(query, [request.department.strip().upper()]).fetchall()

    if not rows:
        # Fallback to retrieve any sizes for the department, even if no sales
        fallback_query = """
        SELECT DISTINCT size_code, 0.0 AS size_contribution_pct
        FROM v_size_curve_distribution
        WHERE UPPER(department) = ?
        """
        rows = db.execute(fallback_query, [request.department.strip().upper()]).fetchall()
        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"No size code mappings found for department '{request.department}'"
            )

    size_ratios = [(r[0], float(r[1] or 0.0)) for r in rows]
    total_pct = sum(r[1] for r in size_ratios)

    recommended_items = []
    allocated_sum = 0

    for size_code, pct in size_ratios:
        ratio = (pct / total_pct) if total_pct > 0 else (1.0 / len(size_ratios))
        units = int(round(request.target_total_po_units * ratio))
        recommended_items.append(
            SizeRecommendationItem(
                size_code=size_code,
                historical_contribution_pct=pct,
                recommended_units=units,
            )
        )
        allocated_sum += units

    # Adjust difference due to rounding
    diff = request.target_total_po_units - allocated_sum
    if diff != 0 and recommended_items:
        # Add/subtract the diff from the size recommendation with highest contribution percentage
        recommended_items[0].recommended_units += diff

    response_data = SizeRecommendationResponse(
        department=request.department,
        target_total_po_units=request.target_total_po_units,
        recommendations=recommended_items,
    )

    return StandardResponse(success=True, data=response_data)

@router.get("/price-ladder", response_model=StandardResponse[List[PriceBandItem]])
def get_price_ladder(
    department: Optional[str] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    db: DuckDBPyConnection = Depends(get_db),
):
    """
    Exposes price band performance metrics (<300, 300-500, 500-1000, >1000)
    with department and store_ids filter support.
    """
    conditions = []
    params = []

    if department and department.upper() != "ALL":
        conditions.append("UPPER(department) = ?")
        params.append(department.strip().upper())

    # If store_ids filter is provided, we must aggregate directly from raw tables 
    # as the v_price_ladder_performance view is pre-grouped at the department level.
    if store_ids:
        store_placeholders = ", ".join(["?"] * len(store_ids))
        for sid in store_ids:
            params.append(sid)

        where_dept = ""
        if conditions:
            # We already appended department to conditions, but we need it for the subquery
            where_dept = f"WHERE UPPER(i.Department) = ?"
            # We'll append department param after the store ids in the execute block
        
        # Build query
        query = f"""
        WITH price_bucketed AS (
            SELECT
                f.BARCODE,
                i.Department AS department,
                COALESCE(i.MRP, i.RATE, 0.0) AS price_point,
                CASE
                    WHEN COALESCE(i.MRP, i.RATE, 0.0) < 300 THEN '< 300'
                    WHEN COALESCE(i.MRP, i.RATE, 0.0) BETWEEN 300 AND 500 THEN '300 - 500'
                    WHEN COALESCE(i.MRP, i.RATE, 0.0) BETWEEN 500 AND 1000 THEN '500 - 1000'
                    ELSE '> 1000'
                END AS price_band,
                ABS(f.NET_SALE_QUANTITY) AS NET_SALE_QUANTITY,
                ABS(f.NET_SALE_AMOUNT) AS NET_SALE_AMOUNT,
                f.GP_AMOUNT,
                f.CLOSING_STOCK_QUANTITY
            FROM fact_cube_monthly f
            LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
            WHERE f.ADMSITE_CODE IN ({store_placeholders})
        )
        SELECT
            price_band,
            department,
            COUNT(DISTINCT BARCODE) AS total_skus,
            SUM(NET_SALE_QUANTITY) AS total_sales_units,
            SUM(NET_SALE_AMOUNT) AS total_revenue,
            SUM(GP_AMOUNT) AS total_gross_profit,
            CASE WHEN SUM(NET_SALE_AMOUNT) > 0 THEN (SUM(GP_AMOUNT) / SUM(NET_SALE_AMOUNT)) * 100.0 ELSE 0.0 END AS margin_pct,
            SUM(CLOSING_STOCK_QUANTITY) AS stock_units
        FROM price_bucketed
        {where_dept}
        GROUP BY price_band, department
        ORDER BY price_band
        """
        # Execute query
        if where_dept:
            rows = db.execute(query, params + [department.strip().upper()]).fetchall()
        else:
            rows = db.execute(query, params).fetchall()

    else:
        # Standard query from v_price_ladder_performance
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"""
        SELECT
            price_band,
            department,
            total_skus,
            total_sales_units,
            total_revenue,
            total_gross_profit,
            margin_pct,
            stock_units
        FROM v_price_ladder_performance
        {where_clause}
        ORDER BY price_band
        """
        rows = db.execute(query, params).fetchall()

    result = [
        PriceBandItem(
            price_band=r[0],
            department=r[1],
            total_skus=int(r[2] or 0),
            total_sales_units=float(r[3] or 0.0),
            total_revenue=float(r[4] or 0.0),
            total_gross_profit=float(r[5] or 0.0),
            margin_pct=float(r[6] or 0.0),
            stock_units=float(r[7] or 0.0),
        )
        for r in rows
    ]

    return StandardResponse(success=True, data=result)
