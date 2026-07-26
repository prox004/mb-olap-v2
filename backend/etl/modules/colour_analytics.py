import os
import time
import duckdb

def run_colour_analytics_etl():
    start_time = time.time()
    print("=== STARTING COLOUR ANALYTICS ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. View - Colour Extraction Engine (Parsing solely from DESC1)
    print("1. Creating view v_dim_item_colour...")
    con.execute("""
    CREATE OR REPLACE VIEW v_dim_item_colour AS
    SELECT
        *,
        CASE
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'BLACK') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'BLK') THEN 'BLACK'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'WHITE') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'WHT') THEN 'WHITE'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'NAVY') THEN 'NAVY'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'BLUE') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'BLU') THEN 'BLUE'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'RED') THEN 'RED'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'GREEN') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'GRN') THEN 'GREEN'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'YELLOW') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'YEL') THEN 'YELLOW'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'PINK') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'PNK') THEN 'PINK'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'BEIGE') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'CREAM') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'BGE') THEN 'BEIGE'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'GREY') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'GRAY') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'GRY') THEN 'GREY'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'MAROON') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'WINE') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'MRN') THEN 'MAROON'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'OLIVE') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'OLV') THEN 'OLIVE'
            WHEN CONTAINS(UPPER(COALESCE(DESC1, '')), 'MULTI') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'PRINTED') OR CONTAINS(UPPER(COALESCE(DESC1, '')), 'PRINT') THEN 'MULTICOLOR'
            ELSE 'OTHER'
        END AS extracted_colour
    FROM dim_item;
    """)

    # 2. View - Colour Performance Summary
    print("2. Creating view v_colour_performance_summary...")
    con.execute("""
    CREATE OR REPLACE VIEW v_colour_performance_summary AS
    SELECT
        i.extracted_colour,
        COALESCE(i.Division, 'UNKNOWN') AS division,
        COALESCE(i.Department, 'UNKNOWN') AS department,
        COUNT(DISTINCT f.BARCODE) AS total_skus,
        SUM(f.NET_SALE_QUANTITY) AS sales_units,
        SUM(f.NET_SALE_AMOUNT) AS net_revenue,
        SUM(f.GP_AMOUNT) AS gross_profit,
        CASE WHEN SUM(f.NET_SALE_AMOUNT) > 0 THEN (SUM(f.GP_AMOUNT) / SUM(f.NET_SALE_AMOUNT)) * 100 ELSE 0.0 END AS margin_pct,
        SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
        SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
        -- Sell-through %
        CASE 
            WHEN (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY)) > 0 
            THEN (SUM(f.NET_SALE_QUANTITY) / (SUM(f.OPENING_QUANTITY) + SUM(f.GOODS_RECEIVE_QUANTITY) + SUM(f.SITE_TRANSFER_IN_QUANTITY))) * 100 
            ELSE 0.0 
        END AS sell_through_pct
    FROM fact_cube_monthly f
    LEFT JOIN v_dim_item_colour i ON f.BARCODE = i.ICODE
    GROUP BY i.extracted_colour, i.Division, i.Department;
    """)

    # 3. Print Verification Statistics
    print("\n=== COLOUR ANALYTICS ETL VERIFICATION ===")
    colour_breakdown = con.execute("""
        SELECT 
            extracted_colour, 
            SUM(net_revenue) AS net_revenue, 
            SUM(sales_units) AS sales_units 
        FROM v_colour_performance_summary 
        GROUP BY extracted_colour 
        ORDER BY net_revenue DESC
    """).df()
    print("\nColour Sales Breakdown (Parsing DESC1 only):")
    print(colour_breakdown)

    con.close()
    elapsed = time.time() - start_time
    print(f"=== COLOUR ANALYTICS ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_colour_analytics_etl()
