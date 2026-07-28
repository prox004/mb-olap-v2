import os
import time
import duckdb

def run_merchandise_buying_etl():
    start_time = time.time()
    print("=== STARTING MERCHANDISE BUYING & SKU VELOCITY ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. SQL View - SKU Velocity & Stock Cover
    print("1. Creating view v_sku_velocity_summary...")
    con.execute("""
    CREATE OR REPLACE VIEW v_sku_velocity_summary AS
    WITH period_meta AS (
        SELECT COUNT(DISTINCT strftime(START_DATE, '%Y-%m')) AS num_months
        FROM fact_cube_monthly
    )
    SELECT
        f.BARCODE AS barcode,
        i.DESC1 AS description,
        i.Division AS division,
        i.Section AS section,
        i.Department AS department,
        i.PARTYNAME AS vendor,
        i.MRP AS mrp,
        i.RATE AS cost_rate,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
        SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
        SUM(f.GP_AMOUNT) AS gross_profit,
        SUM(GREATEST(0.0, f.CLOSING_STOCK_QUANTITY)) AS closing_stock_units,
        SUM(GREATEST(0.0, f.CLOSING_STOCK_AMOUNT)) AS closing_stock_value,
        -- Sell-through %
        CASE 
            WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
            THEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100.0
            ELSE 0.0 
        END AS sell_through_pct,
        -- Weeks of Cover (WOC) = Closing Stock / Weekly Sales Rate
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33)) > 0 
            THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33))
            ELSE 999.0 
        END AS woc,
        -- Months of Inventory (MOI) = Closing Stock / Monthly Sales Rate
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / MAX(pm.num_months)) > 0 
            THEN SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / MAX(pm.num_months))
            ELSE 999.0 
        END AS moi,
        -- Velocity Classification Tag
        CASE
            WHEN SUM(ABS(f.NET_SALE_QUANTITY)) = 0 AND SUM(f.CLOSING_STOCK_QUANTITY) > 0 THEN 'DEAD_STOCK'
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33)) > 0 
                 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33))) < 4.0 THEN 'FAST_MOVER'
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33)) > 0 
                 AND (SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / (MAX(pm.num_months) * 4.33))) BETWEEN 4.0 AND 12.0 THEN 'MEDIUM_MOVER'
            ELSE 'SLOW_MOVER'
        END AS velocity_status
    FROM fact_cube_monthly f
    CROSS JOIN period_meta pm
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY f.BARCODE, i.DESC1, i.Division, i.Section, i.Department, i.PARTYNAME, i.MRP, i.RATE;
    """)

    # 2. SQL View - 90-Day Dead Stock Liquidation Candidates
    print("2. Creating view v_dead_stock_candidates...")
    con.execute("""
    CREATE OR REPLACE VIEW v_dead_stock_candidates AS
    SELECT *
    FROM v_sku_velocity_summary
    WHERE velocity_status = 'DEAD_STOCK'
    ORDER BY closing_stock_value DESC;
    """)

    # 3. Print Verification Statistics
    print("\n=== MERCHANDISE BUYING ETL VERIFICATION ===")
    velocity_dist = con.execute("""
        SELECT velocity_status, count(*) AS sku_count, sum(closing_stock_value) AS total_closing_stock_value 
        FROM v_sku_velocity_summary 
        GROUP BY velocity_status
        ORDER BY sku_count DESC
    """).df()
    print("\nVelocity Distribution:")
    print(velocity_dist)

    dead_stock_cap = con.execute("SELECT COALESCE(SUM(closing_stock_value), 0) FROM v_dead_stock_candidates").fetchone()[0]
    print(f"\nDead Stock Capital Locked: RS {dead_stock_cap:,.2f}")

    con.close()
    elapsed = time.time() - start_time
    print(f"=== MERCHANDISE BUYING ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_merchandise_buying_etl()
