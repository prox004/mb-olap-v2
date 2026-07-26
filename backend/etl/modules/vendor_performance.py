import os
import time
import duckdb

def run_vendor_performance_etl():
    start_time = time.time()
    print("=== STARTING VENDOR PERFORMANCE ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. View - Vendor Commercial Performance
    # NOTE: Store 1070 is the central warehouse (receives vendor purchase orders & executes vendor returns).
    # Retail stores (6, 530, 820) execute sales to end customers.
    print("1. Creating view v_vendor_performance_summary...")
    con.execute("""
    CREATE OR REPLACE VIEW v_vendor_performance_summary AS
    SELECT
        COALESCE(i.PARTYNAME, 'UNKNOWN_VENDOR') AS vendor_name,
        COUNT(DISTINCT f.BARCODE) AS total_skus_supplied,
        
        -- Goods Receive & Return at Central Warehouse (ADMSITE_CODE = 1070)
        SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) AS receive_units,
        SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_AMOUNT ELSE 0 END) AS receive_value,
        SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_QUANTITY) ELSE 0 END) AS return_units,
        SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_AMOUNT) ELSE 0 END) AS return_value,
        
        -- Net Retail Sales across all locations
        SUM(ABS(f.NET_SALE_QUANTITY)) AS sales_units,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS net_revenue,
        SUM(f.GP_AMOUNT) AS gross_profit,
        
        -- Closing Stock across all locations (warehouse + retail stores)
        SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units,
        SUM(f.CLOSING_STOCK_AMOUNT) AS current_stock_value,
        
        -- Vendor Sell-Through % = Retail Sales Units / Warehouse Received Units
        CASE 
            WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
            THEN ROUND((SUM(ABS(f.NET_SALE_QUANTITY)) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100.0, 2)
            ELSE 0.0 
        END AS sell_through_pct,
        
        -- Gross Margin %
        CASE 
            WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS margin_pct,
        
        -- Goods Return Rate % = Warehouse Return Qty / Warehouse Receive Qty
        CASE 
            WHEN SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END) > 0 
            THEN ROUND((SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN ABS(f.GOODS_RETURN_QUANTITY) ELSE 0 END) / SUM(CASE WHEN f.ADMSITE_CODE = 1070 THEN f.GOODS_RECEIVE_QUANTITY ELSE 0 END)) * 100.0, 2)
            ELSE 0.0 
        END AS return_rate_pct
    FROM fact_cube_monthly f
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY i.PARTYNAME;
    """)

    # 2. View - Composite Vendor Scorecard
    print("2. Creating view v_vendor_scorecard...")
    con.execute("""
    CREATE OR REPLACE VIEW v_vendor_scorecard AS
    SELECT
        *,
        ROUND(
            GREATEST(0.0, LEAST(
                (LEAST(sell_through_pct, 100.0) * 0.40) + 
                (margin_pct * 0.40) + 
                (GREATEST(0.0, (100.0 - return_rate_pct * 5.0)) * 0.20), 
                100.0
            )), 1
        ) AS vendor_score
    FROM v_vendor_performance_summary;
    """)

    # 3. Print Verification Statistics
    print("\n=== VENDOR PERFORMANCE ETL VERIFICATION ===")
    vendor_count = con.execute("SELECT count(*) FROM v_vendor_scorecard").fetchone()[0]
    print(f"   [PASS] Vendor Count: {vendor_count}")

    top_vendors = con.execute("""
        SELECT vendor_name, net_revenue, margin_pct, sell_through_pct, return_rate_pct, vendor_score 
        FROM v_vendor_scorecard 
        ORDER BY net_revenue DESC 
        LIMIT 5
    """).df()
    print("\nTop 5 Vendors by Net Revenue:")
    print(top_vendors)

    con.close()
    elapsed = time.time() - start_time
    print(f"=== VENDOR PERFORMANCE ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_vendor_performance_etl()
