import os
import time
import duckdb

def run_ceo_dashboard_etl():
    start_time = time.time()
    print("=== STARTING CEO DASHBOARD ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. View - Executive Summary KPIs
    print("1. Creating view v_ceo_kpis...")
    con.execute("""
    CREATE OR REPLACE VIEW v_ceo_kpis AS
    SELECT
        SUM(ABS(NET_SALE_AMOUNT)) AS total_revenue,
        SUM(ABS(NET_SALE_QUANTITY)) AS total_sales_units,
        SUM(GP_AMOUNT) AS total_gross_profit,
        CASE 
            WHEN SUM(ABS(NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(GP_AMOUNT) / SUM(ABS(NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS gross_margin_pct,
        SUM(CLOSING_STOCK_AMOUNT) AS total_inventory_value,
        SUM(CLOSING_STOCK_QUANTITY) AS total_inventory_units,
        -- Sell-through % = ABS(NET_SALE_QUANTITY) / (GREATEST(0, OPENING_QUANTITY) + GOODS_RECEIVE_QUANTITY + SITE_TRANSFER_IN_QUANTITY)
        CASE 
            WHEN (GREATEST(0.0, SUM(OPENING_QUANTITY)) + SUM(GOODS_RECEIVE_QUANTITY) + SUM(SITE_TRANSFER_IN_QUANTITY)) > 0 
            THEN ROUND((SUM(ABS(NET_SALE_QUANTITY)) / (GREATEST(0.0, SUM(OPENING_QUANTITY)) + SUM(GOODS_RECEIVE_QUANTITY) + SUM(SITE_TRANSFER_IN_QUANTITY))) * 100.0, 2)
            ELSE 0.0 
        END AS sell_through_pct,
        -- Average WOC = Total Closing Stock Units (floored at 0) / (Total Sales Units / 12.0)
        CASE 
            WHEN (SUM(ABS(NET_SALE_QUANTITY)) / 12.0) > 0 
            THEN ROUND(GREATEST(0.0, SUM(CLOSING_STOCK_QUANTITY)) / (SUM(ABS(NET_SALE_QUANTITY)) / 12.0), 1)
            ELSE 999.0 
        END AS average_woc
    FROM fact_cube_monthly;
    """)

    # 2. View - Store Rankings with Site Type Designation (1070 = CENTRAL_WAREHOUSE)
    print("2. Creating view v_ceo_store_rankings...")
    con.execute("""
    CREATE OR REPLACE VIEW v_ceo_store_rankings AS
    SELECT
        f.ADMSITE_CODE AS admsite_code,
        COALESCE(l.Name, 'Store ' || CAST(f.ADMSITE_CODE AS VARCHAR)) AS store_name,
        COALESCE(l.SITE_TYPE, CASE WHEN f.ADMSITE_CODE = 1070 THEN 'CENTRAL_WAREHOUSE' ELSE 'RETAIL_STORE' END) AS site_type,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS store_revenue,
        SUM(ABS(f.NET_SALE_QUANTITY)) AS store_sales_units,
        SUM(f.GP_AMOUNT) AS store_gross_profit,
        CASE 
            WHEN SUM(ABS(f.NET_SALE_AMOUNT)) > 0 
            THEN ROUND((SUM(f.GP_AMOUNT) / SUM(ABS(f.NET_SALE_AMOUNT))) * 100.0, 2)
            ELSE 0.0 
        END AS store_margin_pct,
        SUM(f.CLOSING_STOCK_AMOUNT) AS store_stock_value,
        SUM(f.CLOSING_STOCK_QUANTITY) AS store_stock_units,
        CASE 
            WHEN (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0) > 0 
            THEN ROUND(SUM(f.CLOSING_STOCK_QUANTITY) / (SUM(ABS(f.NET_SALE_QUANTITY)) / 12.0), 1)
            ELSE 999.0 
        END AS store_woc
    FROM fact_cube_monthly f
    LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
    GROUP BY f.ADMSITE_CODE, l.Name, l.SITE_TYPE;
    """)

    # 3. View - SKU Rankings
    print("3. Creating view v_ceo_sku_rankings...")
    con.execute("""
    CREATE OR REPLACE VIEW v_ceo_sku_rankings AS
    SELECT
        f.BARCODE AS barcode,
        COALESCE(i.DESC1, f.BARCODE) AS item_description,
        COALESCE(i.Division, 'UNKNOWN') AS division,
        COALESCE(i.Department, 'UNKNOWN') AS department,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS sku_revenue,
        SUM(ABS(f.NET_SALE_QUANTITY)) AS sku_sales_units,
        SUM(f.GP_AMOUNT) AS sku_gross_profit,
        SUM(f.CLOSING_STOCK_QUANTITY) AS current_stock_units
    FROM fact_cube_monthly f
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY f.BARCODE, i.DESC1, i.Division, i.Department;
    """)

    # 4. Print Summary Verification Statistics
    print("\n=== CEO DASHBOARD ETL VERIFICATION ===")
    kpi = con.execute("SELECT * FROM v_ceo_kpis").df()
    print("Executive KPIs Summary:")
    print(kpi.T)

    stores = con.execute("SELECT * FROM v_ceo_store_rankings ORDER BY store_revenue DESC").df()
    print("\nStore Rankings Summary:")
    print(stores[['admsite_code', 'store_name', 'site_type', 'store_revenue', 'store_margin_pct', 'store_woc']])

    con.close()
    elapsed = time.time() - start_time
    print(f"=== CEO DASHBOARD ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_ceo_dashboard_etl()
