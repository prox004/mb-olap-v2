import os
import time
import duckdb

def run_category_performance_etl():
    start_time = time.time()
    print("=== STARTING CATEGORY PERFORMANCE ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. View - Multi-Tier Category Hierarchy Summary
    print("1. Creating view v_category_hierarchy_summary...")
    con.execute("""
    CREATE OR REPLACE VIEW v_category_hierarchy_summary AS
    SELECT
        COALESCE(i.Division, 'UNKNOWN') AS division,
        COALESCE(i.Section, 'UNKNOWN') AS section,
        COALESCE(i.Department, 'UNKNOWN') AS department,
        COALESCE(i."Department Allias", 'UNKNOWN') AS department_alias,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
        SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
        SUM(f.GP_AMOUNT) AS gross_profit,
        CASE 
            WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS margin_pct,
        SUM(f.CLOSING_STOCK_AMOUNT) AS closing_stock_value,
        SUM(f.CLOSING_STOCK_QUANTITY) AS closing_stock_units,
        -- Sell-through % = ABS(NET_SALE_QUANTITY) / (OPENING + RECEIVE + TRANSFER_IN)
        CASE 
            WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
            THEN ROUND((SUM(ABS(f.NET_SALE_QUANTITY)) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
            ELSE 0.0 
        END AS sell_through_pct,
        -- Weeks of Cover (WOC)
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0) > 0 
            THEN ROUND(SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0), 1)
            ELSE 999.0 
        END AS woc
    FROM fact_cube_monthly f
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY i.Division, i.Section, i.Department, i."Department Allias";
    """)

    # 2. View - Category Performance Matrix Classification
    print("2. Creating view v_category_matrix...")
    con.execute("""
    CREATE OR REPLACE VIEW v_category_matrix AS
    WITH dept_aggregates AS (
        SELECT
            department,
            MAX(division) AS division,
            SUM(net_revenue) AS net_revenue,
            SUM(sales_units) AS sales_units,
            SUM(gross_profit) AS gross_profit,
            CASE 
                WHEN SUM(net_revenue) > 0 
                THEN ROUND((SUM(gross_profit) / SUM(net_revenue)) * 100.0, 2)
                ELSE 0.0 
            END AS margin_pct,
            SUM(closing_stock_value) AS closing_stock_value,
            SUM(closing_stock_units) AS closing_stock_units,
            AVG(sell_through_pct) AS sell_through_pct,
            AVG(woc) AS woc
        FROM v_category_hierarchy_summary
        GROUP BY department
    ),
    benchmarks AS (
        SELECT 
            AVG(margin_pct) AS avg_margin,
            AVG(sell_through_pct) AS avg_sell_through
        FROM dept_aggregates
    )
    SELECT
        d.department,
        d.division,
        d.net_revenue,
        d.sales_units,
        d.gross_profit,
        d.margin_pct,
        d.closing_stock_value,
        d.closing_stock_units,
        ROUND(d.sell_through_pct, 2) AS sell_through_pct,
        ROUND(d.woc, 1) AS woc,
        CASE
            WHEN d.margin_pct >= b.avg_margin AND d.sell_through_pct >= b.avg_sell_through THEN 'WINNER'
            WHEN d.margin_pct < b.avg_margin AND d.sell_through_pct >= b.avg_sell_through THEN 'VOLUME_DRIVER'
            WHEN d.margin_pct >= b.avg_margin AND d.sell_through_pct < b.avg_sell_through THEN 'HIGH_MARGIN_SLOW'
            ELSE 'OVERSTOCKED_UNDERPERFORMER'
        END AS performance_quadrant
    FROM dept_aggregates d, benchmarks b;
    """)

    # 3. Print Verification Statistics
    print("\n=== CATEGORY PERFORMANCE ETL VERIFICATION ===")
    dept_count = con.execute("SELECT count(distinct department) FROM v_category_hierarchy_summary").fetchone()[0]
    print(f"   [PASS] Distinct Departments Count: {dept_count}")

    matrix_stats = con.execute("""
        SELECT performance_quadrant, count(*) AS count, SUM(net_revenue) AS revenue 
        FROM v_category_matrix 
        GROUP BY performance_quadrant 
        ORDER BY revenue DESC
    """).df()
    print("\nCategory Matrix Quadrant Distribution:")
    print(matrix_stats)

    con.close()
    elapsed = time.time() - start_time
    print(f"=== CATEGORY PERFORMANCE ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_category_performance_etl()
