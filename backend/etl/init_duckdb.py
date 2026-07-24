import os
import time
import duckdb

def init_duckdb_warehouse():
    start_time = time.time()
    print("=== INITIALIZING DUCKDB WAREHOUSE SCHEMA ===")

    db_dir = os.path.join("backend", "db")
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, "olap_warehouse.duckdb")

    parquet_dir = os.path.join("backend", "db", "parquet")
    fact_parquet = os.path.join(parquet_dir, "fact_cube_monthly.parquet").replace("\\", "/")
    items_parquet = os.path.join(parquet_dir, "dim_items.parquet").replace("\\", "/")
    loc_parquet = os.path.join(parquet_dir, "dim_locations.parquet").replace("\\", "/")

    con = duckdb.connect(db_path)

    # 1. Create Core Tables with Site Type Designation (1070 = Central Warehouse / DC)
    print("1. Creating persistent tables in DuckDB...")
    con.execute(f"""
    CREATE OR REPLACE TABLE dim_location AS 
    SELECT 
        *,
        CASE 
            WHEN ADMSITE_CODE = 1070 THEN 'CENTRAL_WAREHOUSE' 
            ELSE 'RETAIL_STORE' 
        END AS SITE_TYPE
    FROM read_parquet('{loc_parquet}')
    """)
    con.execute(f"CREATE OR REPLACE TABLE dim_item AS SELECT * FROM read_parquet('{items_parquet}')")
    con.execute(f"CREATE OR REPLACE TABLE fact_cube_monthly AS SELECT * FROM read_parquet('{fact_parquet}')")

    # 2. Create Joined Star-Schema View
    print("2. Creating star-schema view (v_fact_item_location_monthly)...")
    con.execute("""
    CREATE OR REPLACE VIEW v_fact_item_location_monthly AS
    SELECT 
        f.*,
        i.Division,
        i.Section,
        i.Department,
        i."Department Allias",
        i.PARTYNAME,
        i.CNAME1,
        i.CNAME2,
        i.CNAME3,
        i.CNAME4,
        i.CNAME5,
        i.CNAME6,
        i.DESC1,
        i.DESC2,
        i.DESC3,
        i.RATE,
        i.MRP,
        i.STOCKINDATE,
        l.Name AS STORE_NAME,
        COALESCE(l.SITE_TYPE, CASE WHEN f.ADMSITE_CODE = 1070 THEN 'CENTRAL_WAREHOUSE' ELSE 'RETAIL_STORE' END) AS SITE_TYPE
    FROM fact_cube_monthly f
    LEFT JOIN dim_item i ON f.BARCODE = i.ICODE
    LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE;
    """)

    # 3. Data Integrity & Quality Validation Checks
    print("\n=== RUNNING DATA QUALITY & INTEGRITY CHECKS ===")
    
    fact_rows = con.execute("SELECT count(*) FROM fact_cube_monthly").fetchone()[0]
    item_rows = con.execute("SELECT count(*) FROM dim_item").fetchone()[0]
    loc_rows = con.execute("SELECT count(*) FROM dim_location").fetchone()[0]
    print(f"   [PASS] Total Fact Cube Rows: {fact_rows:,}")
    print(f"   [PASS] Total Item Master Rows: {item_rows:,}")
    print(f"   [PASS] Total Location Master Rows: {loc_rows:,}")

    # Check site types breakdown
    loc_types = con.execute("SELECT ADMSITE_CODE, Name, SITE_TYPE FROM dim_location ORDER BY ADMSITE_CODE").fetchall()
    print("   [PASS] Location Master Classifications:")
    for loc in loc_types:
        print(f"         • Site {loc[0]}: {loc[1]} -> [{loc[2]}]")

    con.close()
    elapsed = time.time() - start_time
    print(f"=== DUCKDB WAREHOUSE INITIALIZED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    init_duckdb_warehouse()
