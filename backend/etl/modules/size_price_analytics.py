import os
import time
import duckdb

def run_size_price_analytics_etl():
    start_time = time.time()
    print("=== STARTING SIZE CURVE & PRICE LADDER ANALYTICS ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. SQL View - Size Curve Sales Distribution
    print("1. Creating view v_size_curve_distribution...")
    con.execute("""
    CREATE OR REPLACE VIEW v_size_curve_distribution AS
    WITH size_sales AS (
        SELECT
            COALESCE(i.Division, 'UNKNOWN') AS division,
            COALESCE(i.Department, 'UNKNOWN') AS department,
            COALESCE(NULLIF(TRIM(i.CNAME5), ''), 'FREE_SIZE') AS size_code,
            SUM(f.GOODS_RECEIVE_QUANTITY) AS total_bought_units,
            SUM(f.NET_SALE_QUANTITY) AS total_sold_units,
            SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
            SUM(f.NET_SALE_AMOUNT) AS net_revenue
        FROM fact_cube_monthly f
        LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
        GROUP BY i.Division, i.Department, i.CNAME5
    ),
    dept_totals AS (
        SELECT 
            department, 
            SUM(total_sold_units) AS dept_sold_units
        FROM size_sales
        GROUP BY department
    )
    SELECT
        s.division,
        s.department,
        s.size_code,
        s.total_bought_units,
        s.total_sold_units,
        s.current_stock_units,
        s.net_revenue,
        -- Empirical Size Sales Contribution Ratio %
        CASE 
            WHEN d.dept_sold_units > 0 
            THEN ROUND((s.total_sold_units / d.dept_sold_units) * 100.0, 2)
            ELSE 0.0 
        END AS size_contribution_pct
    FROM size_sales s
    LEFT JOIN dept_totals d ON s.department = d.department;
    """)

    # 2. SQL View - Price Ladder Performance Buckets
    print("2. Creating view v_price_ladder_performance...")
    con.execute("""
    CREATE OR REPLACE VIEW v_price_ladder_performance AS
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
            f.NET_SALE_QUANTITY,
            f.NET_SALE_AMOUNT,
            f.GP_AMOUNT,
            f.CLOSING_STOCK_QUANTITY
        FROM fact_cube_monthly f
        LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
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
    GROUP BY price_band, department;
    """)

    # 3. Print Verification Statistics
    print("\n=== SIZE & PRICE ANALYTICS ETL VERIFICATION ===")
    size_sample = con.execute("SELECT * FROM v_size_curve_distribution LIMIT 5").df()
    print("\nSize Curve Distribution Sample:")
    print(size_sample)

    price_summary = con.execute("""
        SELECT price_band, SUM(total_revenue) AS total_revenue, SUM(total_sales_units) AS total_sales_units 
        FROM v_price_ladder_performance 
        GROUP BY price_band 
        ORDER BY total_revenue DESC
    """).df()
    print("\nPrice Ladder Summary:")
    print(price_summary)

    con.close()
    elapsed = time.time() - start_time
    print(f"=== SIZE & PRICE ANALYTICS ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_size_price_analytics_etl()
