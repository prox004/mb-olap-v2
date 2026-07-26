import os
import time
import duckdb

def run_financial_gmroi_etl():
    start_time = time.time()
    print("=== STARTING FINANCIAL HEALTH & GMROI ETL MODULE ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database not found at {db_path}. Please run core pipeline ETL first.")

    con = duckdb.connect(db_path)

    # 1. SQL View - GMROI Engine
    print("1. Creating view v_gmroi_analysis...")
    con.execute("""
    CREATE OR REPLACE VIEW v_gmroi_analysis AS
    SELECT
        f.ADMSITE_CODE AS admsite_code,
        l.Name AS store_name,
        COALESCE(i.Division, 'UNKNOWN') AS division,
        COALESCE(i.Department, 'UNKNOWN') AS department,
        COALESCE(i.PARTYNAME, 'UNKNOWN') AS vendor_name,
        f.BARCODE AS barcode,
        COALESCE(i.DESC1, 'UNKNOWN') AS item_name,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS total_revenue,
        SUM(f.GP_AMOUNT) AS total_gross_profit,
        SUM(f.CLOSING_STOCK_AMOUNT) / 3.0 AS avg_inventory_value,
        -- Annualized GMROI Ratio = 4.0 * (Quarterly GP / Avg Monthly Inventory)
        CASE 
            WHEN (SUM(f.CLOSING_STOCK_AMOUNT) / 3.0) > 0 
            THEN ROUND(4.0 * SUM(f.GP_AMOUNT) / (SUM(f.CLOSING_STOCK_AMOUNT) / 3.0), 2)
            ELSE 0.0 
        END AS gmroi_ratio
    FROM fact_cube_monthly f
    LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY f.ADMSITE_CODE, l.Name, i.Division, i.Department, i.PARTYNAME, f.BARCODE, i.DESC1;
    """)

    # 2. SQL View - Buying Accuracy & Markdown Variance
    print("2. Creating view v_buying_accuracy_summary...")
    con.execute("""
    CREATE OR REPLACE VIEW v_buying_accuracy_summary AS
    SELECT
        COALESCE(i.Department, 'UNKNOWN') AS department,
        SUM(f.GOODS_RECEIVE_QUANTITY) AS total_bought_units,
        SUM(f.GOODS_RECEIVE_AMOUNT) AS total_bought_value,
        SUM(ABS(f.NET_SALE_QUANTITY)) AS total_sold_units,
        SUM(ABS(f.NET_SALE_AMOUNT)) AS total_sold_value,
        SUM(f.CLOSING_STOCK_QUANTITY) AS unsold_units,
        SUM(f.CLOSING_STOCK_AMOUNT) AS unsold_value,
        SUM(f.SALE_DISCOUNT_AMOUNT) AS total_discount_amount,
        SUM(f.SALE_PROMO_AMOUNT) AS total_promo_amount,
        -- Sell-Through Realization % (Buying Accuracy)
        CASE 
            WHEN SUM(f.GOODS_RECEIVE_QUANTITY) > 0 
            THEN ROUND((SUM(ABS(f.NET_SALE_QUANTITY)) / SUM(f.GOODS_RECEIVE_QUANTITY)) * 100.0, 2)
            ELSE 0.0 
        END AS buying_accuracy_pct
    FROM fact_cube_monthly f
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    GROUP BY i.Department;
    """)

    # 3. Print Verification Statistics
    print("\n=== FINANCIAL HEALTH & GMROI ETL VERIFICATION ===")
    
    overall_gmroi = con.execute("""
        SELECT SUM(total_gross_profit) / AVG(avg_inventory_value) 
        FROM v_gmroi_analysis
    """).fetchone()[0]
    print(f"Overall GMROI: {overall_gmroi:.2f}")

    accuracy_sample = con.execute("""
        SELECT department, total_bought_units, total_sold_units, buying_accuracy_pct 
        FROM v_buying_accuracy_summary 
        ORDER BY buying_accuracy_pct DESC 
        LIMIT 5
    """).df()
    print("\nBuying Accuracy Top 5 Departments:")
    print(accuracy_sample)

    con.close()
    elapsed = time.time() - start_time
    print(f"=== FINANCIAL HEALTH & GMROI ETL COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_financial_gmroi_etl()
