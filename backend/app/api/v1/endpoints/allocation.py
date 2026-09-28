from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from backend.app.api.deps import get_db
from backend.app.config import settings
from backend.app.schemas.response import StandardResponse, FilterMeta
from backend.app.schemas.allocation import (
    StoreStockCoverItem,
    RebalanceRecommendationItem,
    TransferHistoryItem,
)
from backend.app.utils.query_builder import build_where_clause

router = APIRouter()

@router.get("/store-cover", response_model=StandardResponse[Optional[List[StoreStockCoverItem]]])
def get_store_stock_cover(
    store_ids: Optional[List[int]] = Query(None),
    department: Optional[str] = Query(None),
    health_status: Optional[str] = Query(None, enum=["HIGH_RISK_STOCKOUT", "OVERSTOCKED", "BALANCED", "NEGATIVE_TRANSFER_LAG"]),
    db = Depends(get_db),
):
    """
    Returns store stock cover levels, inventory health status, and transfer balances per outlet and department.
    """
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        inv_conds = []
        sales_conds = []
        params_inv = []
        params_sales = []

        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            inv_conds.append(f"l.admsite_code IN ({placeholders})")
            sales_conds.append(f"l.admsite_code IN ({placeholders})")
            params_inv.extend(store_ids)
            params_sales.extend(store_ids)

        if department and department.lower() != "all":
            inv_conds.append("UPPER(p.department) LIKE ?")
            sales_conds.append("UPPER(p.department) LIKE ?")
            dept_param = f"%{department.strip().upper()}%"
            params_inv.append(dept_param)
            params_sales.append(dept_param)

        where_inv = f"WHERE {' AND '.join(inv_conds)}" if inv_conds else ""
        where_sales = f"WHERE {' AND '.join(sales_conds)}" if sales_conds else ""

        outer_conds = []
        outer_params = []
        if health_status:
            outer_conds.append("stock_health_status = ?")
            outer_params.append(health_status)

        where_health = f"WHERE {' AND '.join(outer_conds)}" if outer_conds else ""

        query = f"""
        WITH sales_dept AS (
            SELECT
                f.store_code AS store_code,
                COALESCE(p.department, 'UNKNOWN') AS department,
                sum(f.bill_qty) AS sales_units,
                round(sum(f.net_amount), 2) AS revenue
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            {where_sales}
            GROUP BY f.store_code, COALESCE(p.department, 'UNKNOWN')
        ),
        inv_dept AS (
            SELECT
                i.store_code AS store_code,
                COALESCE(p.department, 'UNKNOWN') AS department,
                sum(i.closing_qty) AS stock_units,
                round(sum(i.closing_amt), 2) AS stock_value,
                sum(i.transfer_in_qty) AS transfer_in_units,
                sum(abs(i.transfer_out_qty)) AS transfer_out_units,
                sum(i.final_sale_qty) AS final_sale_qty
            FROM fact_inventory i
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            {where_inv}
            GROUP BY i.store_code, COALESCE(p.department, 'UNKNOWN')
        ),
        combined AS (
            SELECT
                l.admsite_code AS admsite_code,
                l.store_name AS store_name,
                l.site_type AS site_type,
                inv.department AS department,
                COALESCE(s.sales_units, 0.0) AS sales_units,
                COALESCE(s.revenue, 0.0) AS revenue,
                inv.stock_units AS stock_units,
                inv.stock_value AS stock_value,
                inv.transfer_in_units AS transfer_in_units,
                inv.transfer_out_units AS transfer_out_units,
                0.0 AS wh_transfer_in_units,
                CASE 
                    WHEN (inv.final_sale_qty / 24.0) > 0 
                    THEN round(greatest(0, inv.stock_units) / (inv.final_sale_qty / 24.0), 1)
                    ELSE 999.0 
                END AS store_woc,
                CASE
                    WHEN inv.stock_units < 0 AND (inv.final_sale_qty / 24.0) > 0 THEN 'NEGATIVE_TRANSFER_LAG'
                    WHEN (inv.final_sale_qty / 24.0) > 0 AND (greatest(0, inv.stock_units) / (inv.final_sale_qty / 24.0)) < 2.5 THEN 'HIGH_RISK_STOCKOUT'
                    WHEN (inv.final_sale_qty / 24.0) > 0 AND (inv.stock_units / (inv.final_sale_qty / 24.0)) > 12.0 THEN 'OVERSTOCKED'
                    ELSE 'BALANCED'
                END AS stock_health_status
            FROM inv_dept inv
            LEFT JOIN sales_dept s ON inv.store_code = s.store_code AND inv.department = s.department
            LEFT JOIN dim_location l ON inv.store_code = l.store_code
        )
        SELECT * FROM combined
        {where_health}
        ORDER BY sales_units DESC;
        """
        all_params = params_sales + params_inv + outer_params
        rows = db.execute(query, all_params).fetchall()
        items = [
            StoreStockCoverItem(
                admsite_code=int(row[0]),
                store_name=row[1] or f"Store {row[0]}",
                site_type=row[2] or "RETAIL_STORE",
                department=row[3] or "UNKNOWN",
                sales_units=float(row[4]),
                revenue=float(row[5]),
                stock_units=float(row[6]),
                stock_value=float(row[7]),
                transfer_in_units=float(row[8]),
                transfer_out_units=float(row[9]),
                wh_transfer_in_units=float(row[10]),
                store_woc=float(row[11]),
                stock_health_status=row[12],
            )
            for row in rows
        ]
        meta = FilterMeta(applied_stores=store_ids, total_records=len(items))
        return StandardResponse(success=True, data=items, meta=meta, supported=True)

    where_clause, params = build_where_clause(
        store_ids=store_ids,
        department=department,
        table_prefix="v"
    )

    if health_status:
        prefix = "WHERE " if not where_clause else f"{where_clause} AND "
        where_clause = f"{prefix}v.stock_health_status = ?"
        params.append(health_status)

    query = f"""
    SELECT
        v.admsite_code,
        v.store_name,
        v.site_type,
        v.department,
        v.sales_units,
        v.revenue,
        v.stock_units,
        v.stock_value,
        v.transfer_in_units,
        v.transfer_out_units,
        v.wh_transfer_in_units,
        v.store_woc,
        v.stock_health_status
    FROM v_store_stock_cover v
    {where_clause}
    ORDER BY v.sales_units DESC;
    """

    rows = db.execute(query, params).fetchall()
    items = [
        StoreStockCoverItem(
            admsite_code=row[0],
            store_name=row[1] or f"Store {row[0]}",
            site_type=row[2] or "RETAIL_STORE",
            department=row[3] or "UNKNOWN",
            sales_units=float(row[4]),
            revenue=float(row[5]),
            stock_units=float(row[6]),
            stock_value=float(row[7]),
            transfer_in_units=float(row[8]),
            transfer_out_units=float(row[9]),
            wh_transfer_in_units=float(row[10]),
            store_woc=float(row[11]),
            stock_health_status=row[12],
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta, supported=True)


@router.get("/rebalance-recommendations", response_model=StandardResponse[Optional[List[RebalanceRecommendationItem]]])
def get_rebalance_recommendations(
    source_store_code: Optional[int] = Query(None),
    target_store_code: Optional[int] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    department: Optional[str] = Query(None),
    transfer_type: Optional[str] = Query(None, enum=["DC_REPLENISHMENT", "LATERAL_REBALANCE"]),
    urgency_level: Optional[str] = Query(None, enum=["CRITICAL", "HIGH", "MEDIUM"]),
    min_transfer_qty: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db = Depends(get_db),
):
    """
    Returns actionable lateral inter-store transfer recommendations generated via real-life Min-Max WOC algorithm.
    """
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        if transfer_type == "DC_REPLENISHMENT":
            meta = FilterMeta(total_records=0)
            return StandardResponse(success=True, data=[], meta=meta, supported=True)

        woc_conds = []
        woc_params = []
        if department and department.lower() != "all":
            woc_conds.append("UPPER(p.department) LIKE ?")
            woc_params.append(f"%{department.strip().upper()}%")

        where_woc = f"WHERE {' AND '.join(woc_conds)}" if woc_conds else ""

        rec_conds = []
        rec_params = []

        if source_store_code:
            rec_conds.append("source_store_code = ?")
            rec_params.append(source_store_code)

        if target_store_code:
            rec_conds.append("target_store_code = ?")
            rec_params.append(target_store_code)

        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            rec_conds.append(f"(source_store_code IN ({placeholders}) OR target_store_code IN ({placeholders}))")
            rec_params.extend(store_ids)
            rec_params.extend(store_ids)

        if urgency_level:
            rec_conds.append("urgency_level = ?")
            rec_params.append(urgency_level)

        if min_transfer_qty > 1:
            rec_conds.append("recommended_transfer_qty >= ?")
            rec_params.append(min_transfer_qty)

        where_rec = f"WHERE {' AND '.join(rec_conds)}" if rec_conds else ""

        query = f"""
        WITH item_store_woc AS (
            SELECT
                i.item_code AS barcode,
                COALESCE(p.article_name, i.item_code) AS description,
                COALESCE(p.department, 'UNKNOWN') AS department,
                l.admsite_code AS admsite_code,
                l.store_name AS store_name,
                l.site_type AS site_type,
                i.final_sale_qty AS sales_units,
                i.closing_qty AS stock_units,
                (i.final_sale_qty / 24.0) AS weekly_run_rate,
                CASE
                    WHEN (i.final_sale_qty / 24.0) > 0
                    THEN round(greatest(0, i.closing_qty) / (i.final_sale_qty / 24.0), 1)
                    ELSE 999.0
                END AS woc
            FROM fact_inventory i
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            {where_woc}
        ),
        surplus AS (
            SELECT
                *,
                greatest(toInt32(stock_units - (weekly_run_rate * 6.0)), 1) AS surplus_units
            FROM item_store_woc
            WHERE (woc > 12.0) AND stock_units >= 5
        ),
        deficit AS (
            SELECT
                *,
                greatest(toInt32((weekly_run_rate * 6.0) - stock_units), 1) AS deficit_units
            FROM item_store_woc
            WHERE (woc < 3.0 OR stock_units < 0) AND (sales_units > 0 OR stock_units < 0)
        ),
        recommendations AS (
            SELECT
                s.barcode AS barcode,
                s.description AS description,
                s.department AS department,
                s.admsite_code AS source_store_code,
                s.store_name AS source_store_name,
                toFloat64(s.stock_units) AS source_stock,
                toFloat64(s.woc) AS source_woc,
                d.admsite_code AS target_store_code,
                d.store_name AS target_store_name,
                toFloat64(d.stock_units) AS target_stock,
                toFloat64(d.woc) AS target_woc,
                least(s.surplus_units, d.deficit_units, 50) AS recommended_transfer_qty,
                'LATERAL_REBALANCE' AS transfer_type,
                CASE
                    WHEN d.stock_units < 0 THEN 'CRITICAL'
                    WHEN d.woc < 1.0 THEN 'CRITICAL'
                    WHEN d.woc < 2.0 THEN 'HIGH'
                    ELSE 'MEDIUM'
                END AS urgency_level
            FROM surplus s
            INNER JOIN deficit d ON s.barcode = d.barcode AND s.admsite_code != d.admsite_code
            WHERE least(s.surplus_units, d.deficit_units, 50) >= 1
        )
        SELECT * FROM recommendations
        {where_rec}
        ORDER BY 
            CASE urgency_level WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END ASC,
            recommended_transfer_qty DESC
        LIMIT {limit};
        """
        all_params = woc_params + rec_params
        rows = db.execute(query, all_params).fetchall()
        items = [
            RebalanceRecommendationItem(
                barcode=str(row[0]),
                description=str(row[1]) if row[1] else str(row[0]),
                department=str(row[2]) if row[2] else "UNKNOWN",
                source_store_code=int(row[3]),
                source_store_name=str(row[4]),
                source_stock=float(row[5]),
                source_woc=float(row[6]),
                target_store_code=int(row[7]),
                target_store_name=str(row[8]),
                target_stock=float(row[9]),
                target_woc=float(row[10]),
                recommended_transfer_qty=int(row[11]),
                transfer_type=str(row[12]),
                urgency_level=str(row[13]),
            )
            for row in rows
        ]
        meta = FilterMeta(total_records=len(items))
        return StandardResponse(success=True, data=items, meta=meta, supported=True)

    conditions = []
    params = []

    if source_store_code:
        conditions.append("v.source_store_code = ?")
        params.append(source_store_code)

    if target_store_code:
        conditions.append("v.target_store_code = ?")
        params.append(target_store_code)

    if department and department.lower() != "all":
        conditions.append("UPPER(v.department) LIKE ?")
        params.append(f"%{department.strip().upper()}%")

    if transfer_type:
        conditions.append("v.transfer_type = ?")
        params.append(transfer_type)

    if urgency_level:
        conditions.append("v.urgency_level = ?")
        params.append(urgency_level)

    if min_transfer_qty > 1:
        conditions.append("v.recommended_transfer_qty >= ?")
        params.append(min_transfer_qty)

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    query = f"""
    SELECT
        v.barcode,
        v.description,
        v.department,
        v.source_store_code,
        v.source_store_name,
        v.source_stock,
        v.source_woc,
        v.target_store_code,
        v.target_store_name,
        v.target_stock,
        v.target_woc,
        v.recommended_transfer_qty,
        v.transfer_type,
        v.urgency_level
    FROM v_rebalance_recommendations v
    {where_clause}
    ORDER BY 
        CASE v.urgency_level WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END ASC,
        v.recommended_transfer_qty DESC
    LIMIT {limit};
    """

    rows = db.execute(query, params).fetchall()
    items = [
        RebalanceRecommendationItem(
            barcode=row[0],
            description=row[1] or row[0],
            department=row[2] or "UNKNOWN",
            source_store_code=row[3],
            source_store_name=row[4],
            source_stock=float(row[5]),
            source_woc=float(row[6]),
            target_store_code=row[7],
            target_store_name=row[8],
            target_stock=float(row[9]),
            target_woc=float(row[10]),
            recommended_transfer_qty=int(row[11]),
            transfer_type=row[12],
            urgency_level=row[13],
        )
        for row in rows
    ]

    meta = FilterMeta(total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta, supported=True)


@router.get("/transfer-history", response_model=StandardResponse[Optional[List[TransferHistoryItem]]])
def get_transfer_history(
    store_ids: Optional[List[int]] = Query(None),
    db = Depends(get_db),
):
    """
    Returns store location transfer movement history and net inventory flow across outlets.
    """
    is_clickhouse = settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse"

    if is_clickhouse:
        conditions = []
        params = []
        if store_ids:
            placeholders = ", ".join(["?"] * len(store_ids))
            conditions.append(f"l.admsite_code IN ({placeholders})")
            params.extend(store_ids)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        query = f"""
        SELECT
            l.admsite_code AS admsite_code,
            l.store_name AS store_name,
            l.site_type AS site_type,
            toFloat64(sum(i.transfer_in_qty)) AS transfer_in_units,
            toFloat64(sum(abs(i.transfer_out_qty))) AS transfer_out_units,
            0.0 AS wh_transfer_in_units,
            toFloat64(sum(i.transfer_in_qty) - sum(abs(i.transfer_out_qty))) AS net_transfer_flow
        FROM fact_inventory i
        LEFT JOIN dim_location l ON i.store_code = l.store_code
        {where_clause}
        GROUP BY l.admsite_code, l.store_name, l.site_type
        ORDER BY l.admsite_code ASC;
        """
        rows = db.execute(query, params).fetchall()
        items = [
            TransferHistoryItem(
                admsite_code=int(row[0]),
                store_name=str(row[1]),
                site_type=str(row[2]),
                transfer_in_units=float(row[3]),
                transfer_out_units=float(row[4]),
                wh_transfer_in_units=float(row[5]),
                net_transfer_flow=float(row[6]),
            )
            for row in rows
        ]
        meta = FilterMeta(applied_stores=store_ids, total_records=len(items))
        return StandardResponse(success=True, data=items, meta=meta, supported=True)

    where_clause, params = build_where_clause(store_ids=store_ids, table_prefix="f")

    query = f"""
    SELECT
        f.ADMSITE_CODE AS admsite_code,
        COALESCE(l.Name, 'Store ' || CAST(f.ADMSITE_CODE AS VARCHAR)) AS store_name,
        COALESCE(l.SITE_TYPE, CASE WHEN f.ADMSITE_CODE = 1070 THEN 'CENTRAL_WAREHOUSE' ELSE 'RETAIL_STORE' END) AS site_type,
        COALESCE(SUM(f.SITE_TRANSFER_IN_QUANTITY), 0.0) AS transfer_in_units,
        COALESCE(SUM(f.SITE_TRANSFER_OUT_QUANTITY), 0.0) AS transfer_out_units,
        COALESCE(SUM(f.WAREHOUSE_TRANSFER_IN_QUANTITY), 0.0) AS wh_transfer_in_units,
        COALESCE(SUM(f.SITE_TRANSFER_IN_QUANTITY) + SUM(f.WAREHOUSE_TRANSFER_IN_QUANTITY) - SUM(f.SITE_TRANSFER_OUT_QUANTITY), 0.0) AS net_transfer_flow
    FROM fact_cube_monthly f
    LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
    {where_clause}
    GROUP BY f.ADMSITE_CODE, l.Name, l.SITE_TYPE
    ORDER BY f.ADMSITE_CODE ASC;
    """

    rows = db.execute(query, params).fetchall()
    items = [
        TransferHistoryItem(
            admsite_code=row[0],
            store_name=row[1],
            site_type=row[2],
            transfer_in_units=float(row[3]),
            transfer_out_units=float(row[4]),
            wh_transfer_in_units=float(row[5]),
            net_transfer_flow=float(row[6]),
        )
        for row in rows
    ]

    meta = FilterMeta(applied_stores=store_ids, total_records=len(items))
    return StandardResponse(success=True, data=items, meta=meta, supported=True)

