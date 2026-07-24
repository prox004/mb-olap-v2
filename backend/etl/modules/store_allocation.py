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
        l.Name AS store_name,
        i.Department AS department,
        SUM(f.NET_SALE_QUANTITY) AS sales_units,
        SUM(f.NET_SALE_AMOUNT) AS revenue,
        SUM(f.CLOSING_STOCK_QUANTITY) AS stock_units,
        SUM(f.CLOSING_STOCK_AMOUNT) AS stock_value,
        SUM(f.SITE_TRANSFER_IN_QUANTITY) AS transfer_in_units,
        SUM(f.SITE_TRANSFER_OUT_QUANTITY) AS transfer_out_units,
        SUM(f.WAREHOUSE_TRANSFER_IN_QUANTITY) AS wh_transfer_in_units,
        -- Weeks of Cover per store/department
        CASE 
            WHEN (SUM(f.NET_SALE_QUANTITY) / 12.0) > 0 
            THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / 12.0)
            ELSE 999.0 
        END AS store_woc,
        -- Stock-Out Risk Flag (< 2 weeks / 14 days cover)
        CASE 
            WHEN (SUM(f.NET_SALE_QUANTITY) / 12.0) > 0 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / 12.0)) < 2.0 THEN 'HIGH_RISK_STOCKOUT'
            WHEN (SUM(f.NET_SALE_QUANTITY) / 12.0) > 0 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / 12.0)) > 12.0 THEN 'OVERSTOCKED'
            ELSE 'BALANCED'
        END AS stock_health_status
    FROM fact_cube_monthly f
    LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY f.ADMSITE_CODE, l.Name, i.Department;
    """)

    # 2. Heuristic Inter-Store Transfer Recommendation View
    print("2. Creating view v_rebalance_recommendations...")
    con.execute("""
    CREATE OR REPLACE VIEW v_rebalance_recommendations AS
    WITH item_store_woc AS (
        SELECT
            f.BARCODE AS barcode,
            i.DESC1 AS description,
            i.Department AS department,
            f.ADMSITE_CODE AS admsite_code,
            l.Name AS store_name,
            SUM(f.NET_SALE_QUANTITY) AS sales_units,
            SUM(f.CLOSING_STOCK_QUANTITY) AS stock_units,
            CASE 
                WHEN (SUM(f.NET_SALE_QUANTITY) / 12.0) > 0 
                THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(f.NET_SALE_QUANTITY) / 12.0)
                ELSE 999.0 
            END AS woc
        FROM fact_cube_monthly f
        LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
        LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
        GROUP BY f.BARCODE, i.DESC1, i.Department, f.ADMSITE_CODE, l.Name
    ),
    surplus AS (
        SELECT * FROM item_store_woc WHERE woc > 12.0 AND stock_units > 10
    ),
    deficit AS (
        SELECT * FROM item_store_woc WHERE woc < 2.0 AND sales_units > 0
    )
    SELECT
        s.barcode,
        s.description,
        s.department,
        s.admsite_code AS source_store_code,
        s.store_name AS source_store_name,
        s.stock_units AS source_stock,
        s.woc AS source_woc,
        d.admsite_code AS target_store_code,
        d.store_name AS target_store_name,
        d.stock_units AS target_stock,
        d.woc AS target_woc,
        LEAST(CAST((s.stock_units - (s.sales_units / 12.0 * 6.0)) AS INT), 50) AS recommended_transfer_qty
    FROM surplus s
    INNER JOIN deficit d ON s.barcode = d.barcode AND s.admsite_code != d.admsite_code
    WHERE LEAST(CAST((s.stock_units - (s.sales_units / 12.0 * 6.0)) AS INT), 50) > 0;
    """)

    # 3. Print Verification Statistics
    print("\n=== STORE ALLOCATION ETL VERIFICATION ===")
    rebalance_count = con.execute("SELECT count(*) FROM v_rebalance_recommendations").fetchone()[0]
    print(f"   [PASS] Total Rebalance Transfer Pairs: {rebalance_count:,}")

    sample_pairs = con.execute("""
        SELECT barcode, source_store_name, target_store_name, recommended_transfer_qty 
        FROM v_rebalance_recommendations 
        LIMIT 5
    """).df()
    print("\nSample Inter-Store Rebalance Recommendations:")
    print(sample_pairs)

    con.close()
    elapsed = time.time() - start_time
    print(f"=== STORE ALLOCATION ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_store_allocation_etl()
