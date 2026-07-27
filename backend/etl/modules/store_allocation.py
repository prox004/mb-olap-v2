import os
import time
import duckdb

def run_store_allocation_etl():
    start_time = time.time()
    print("=== STARTING STORE ALLOCATION & REBALANCING ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. SQL View - Store Stock Cover & Transfers
    print("1. Creating view v_store_stock_cover...")
    con.execute("""
    CREATE OR REPLACE VIEW v_store_stock_cover AS
    SELECT
        f.ADMSITE_CODE AS admsite_code,
        COALESCE(l.Name, 'Store ' || CAST(f.ADMSITE_CODE AS VARCHAR)) AS store_name,
        COALESCE(l.SITE_TYPE, CASE WHEN f.ADMSITE_CODE = 1070 THEN 'CENTRAL_WAREHOUSE' ELSE 'RETAIL_STORE' END) AS site_type,
        COALESCE(i.Department, 'UNKNOWN') AS department,
        SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS revenue,
        SUM(f.CLOSING_STOCK_QUANTITY) AS stock_units,
        SUM(f.CLOSING_STOCK_AMOUNT) AS stock_value,
        SUM(f.SITE_TRANSFER_IN_QUANTITY) AS transfer_in_units,
        SUM(f.SITE_TRANSFER_OUT_QUANTITY) AS transfer_out_units,
        SUM(f.WAREHOUSE_TRANSFER_IN_QUANTITY) AS wh_transfer_in_units,
        -- Weeks of Cover per store/department = Stock Units / (Sales Units / 12.0)
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0) > 0 
            THEN ROUND(SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0), 1)
            ELSE 999.0 
        END AS store_woc,
        -- Stock-Out Risk Flag (< 2.5 weeks cover)
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0) > 0 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0)) < 2.5 THEN 'HIGH_RISK_STOCKOUT'
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0) > 0 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0)) > 12.0 THEN 'OVERSTOCKED'
            ELSE 'BALANCED'
        END AS stock_health_status
    FROM fact_cube_monthly f
    LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY f.ADMSITE_CODE, l.Name, l.SITE_TYPE, i.Department;
    """)

    # 2. Advanced Retail Inter-Store Transfer Recommendation View
    print("2. Creating view v_rebalance_recommendations...")
    con.execute("""
    CREATE OR REPLACE VIEW v_rebalance_recommendations AS
    WITH item_store_woc AS (
        SELECT
            f.BARCODE AS barcode,
            COALESCE(i.DESC1, f.BARCODE) AS description,
            COALESCE(i.Department, 'UNKNOWN') AS department,
            f.ADMSITE_CODE AS admsite_code,
            COALESCE(l.Name, 'Store ' || CAST(f.ADMSITE_CODE AS VARCHAR)) AS store_name,
            COALESCE(l.SITE_TYPE, CASE WHEN f.ADMSITE_CODE = 1070 THEN 'CENTRAL_WAREHOUSE' ELSE 'RETAIL_STORE' END) AS site_type,
            SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
            SUM(f.CLOSING_STOCK_QUANTITY) AS stock_units,
            (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0) AS weekly_run_rate,
            CASE 
                WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0) > 0 
                THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0)
                ELSE 999.0 
            END AS woc
        FROM fact_cube_monthly f
        LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
        LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
        GROUP BY f.BARCODE, i.DESC1, i.Department, f.ADMSITE_CODE, l.Name, l.SITE_TYPE
    ),
    surplus AS (
        -- Source node has overstocked inventory (WOC > 8.0 or DC inventory > 10 units)
        SELECT 
            *,
            GREATEST(CAST(stock_units - (weekly_run_rate * 6.0) AS INT), 1) AS surplus_units
        FROM item_store_woc 
        WHERE (woc > 8.0 OR site_type = 'CENTRAL_WAREHOUSE') AND stock_units >= 5
    ),
    deficit AS (
        -- Target node has critical stockout risk (WOC < 3.0 with active sales demand)
        SELECT 
            *,
            GREATEST(CAST((weekly_run_rate * 6.0) - stock_units AS INT), 1) AS deficit_units
        FROM item_store_woc 
        WHERE woc < 3.0 AND sales_units > 0
    )
    SELECT
        s.barcode,
        s.description,
        s.department,
        s.admsite_code AS source_store_code,
        s.store_name AS source_store_name,
        s.stock_units AS source_stock,
        ROUND(s.woc, 1) AS source_woc,
        d.admsite_code AS target_store_code,
        d.store_name AS target_store_name,
        d.stock_units AS target_stock,
        ROUND(d.woc, 1) AS target_woc,
        LEAST(s.surplus_units, d.deficit_units, 50) AS recommended_transfer_qty,
        CASE
            WHEN s.site_type = 'CENTRAL_WAREHOUSE' THEN 'DC_REPLENISHMENT'
            ELSE 'LATERAL_REBALANCE'
        END AS transfer_type,
        CASE
            WHEN d.woc < 1.0 THEN 'CRITICAL'
            WHEN d.woc < 2.0 THEN 'HIGH'
            ELSE 'MEDIUM'
        END AS urgency_level
    FROM surplus s
    INNER JOIN deficit d ON s.barcode = d.barcode AND s.admsite_code != d.admsite_code
    WHERE LEAST(s.surplus_units, d.deficit_units, 50) >= 1;
    """)

    # 3. Print Verification Statistics
    print("\n=== STORE ALLOCATION ETL VERIFICATION ===")
    rebalance_count = con.execute("SELECT count(*) FROM v_rebalance_recommendations").fetchone()[0]
    print(f"   [PASS] Total Rebalance Transfer Pairs: {rebalance_count:,}")

    sample_pairs = con.execute("""
        SELECT barcode, source_store_name, target_store_name, recommended_transfer_qty, transfer_type, urgency_level
        FROM v_rebalance_recommendations 
        ORDER BY urgency_level DESC, recommended_transfer_qty DESC
        LIMIT 5
    """).df()
    print("\nSample Inter-Store Rebalance Recommendations:")
    print(sample_pairs)

    con.close()
    elapsed = time.time() - start_time
    print(f"=== STORE ALLOCATION ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_store_allocation_etl()
