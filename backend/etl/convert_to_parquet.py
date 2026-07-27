import os
import time
import glob
# pyrefly: ignore [missing-import]
import duckdb
import pandas as pd

def run_parquet_conversion():
    start_time = time.time()
    print("=== STARTING PARQUET CONVERSION ===")

    # Ensure output directory exists
    output_dir = os.path.join("backend", "db", "parquet")
    os.makedirs(output_dir, exist_ok=True)

    con = duckdb.connect()

    date_parse_sql = """
        COALESCE(
            CAST(try_strptime({col}, '%d-%b-%y') AS DATE),
            CAST(try_strptime({col}, '%d-%m-%Y %H:%M') AS DATE),
            CAST(try_strptime({col}, '%d-%m-%Y') AS DATE),
            CAST(try_strptime({col}, '%Y-%m-%d') AS DATE),
            CASE 
                WHEN TRY_CAST({col} AS BIGINT) IS NOT NULL AND TRY_CAST({col} AS BIGINT) BETWEEN 10000 AND 60000
                THEN CAST(DATE '1970-01-01' + INTERVAL (TRY_CAST({col} AS BIGINT) - 25569) DAY AS DATE)
                ELSE NULL
            END
        )
    """

    # 1. Convert Fact Cube Monthly Data
    print("1. Discovering and converting Fact Cube Monthly CSVs dynamically...")
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    fact_csv_files = [
        f.replace("\\", "/") for f in glob.glob(os.path.join(data_dir, "*.csv"))
        if not f.endswith("items.csv")
    ]
    print(f"   Found {len(fact_csv_files)} monthly data file(s): {[os.path.basename(f) for f in fact_csv_files]}")

    fact_parquet_path = os.path.join(output_dir, "fact_cube_monthly.parquet").replace("\\", "/")
    
    fact_sql = f"""
    COPY (
        SELECT
            TRY_CAST(SEQ AS BIGINT) AS SEQ,
            CAST(CUBE_CODE AS VARCHAR) AS CUBE_CODE,
            CAST(CUBENAME AS VARCHAR) AS CUBENAME,
            CAST(CREATOR AS VARCHAR) AS CREATOR,
            {date_parse_sql.format(col='REPORT_DATE')} AS REPORT_DATE,
            {date_parse_sql.format(col='START_DATE')} AS START_DATE,
            {date_parse_sql.format(col='END_DATE')} AS END_DATE,
            TRIM(CAST(BARCODE AS VARCHAR)) AS BARCODE,
            CAST(ADMSITE_CODE AS INTEGER) AS ADMSITE_CODE,
            COALESCE(TRY_CAST(OPENING_QUANTITY AS DOUBLE), 0.0) AS OPENING_QUANTITY,
            COALESCE(TRY_CAST(OPENING_AMOUNT AS DOUBLE), 0.0) AS OPENING_AMOUNT,
            COALESCE(TRY_CAST(GOODS_RECEIVE_QUANTITY AS DOUBLE), 0.0) AS GOODS_RECEIVE_QUANTITY,
            COALESCE(TRY_CAST(GOODS_RECEIVE_AMOUNT AS DOUBLE), 0.0) AS GOODS_RECEIVE_AMOUNT,
            COALESCE(TRY_CAST(GOODS_RETURN_QUANTITY AS DOUBLE), 0.0) AS GOODS_RETURN_QUANTITY,
            COALESCE(TRY_CAST(GOODS_RETURN_AMOUNT AS DOUBLE), 0.0) AS GOODS_RETURN_AMOUNT,
            COALESCE(TRY_CAST(SITE_TRANSFER_IN_QUANTITY AS DOUBLE), 0.0) AS SITE_TRANSFER_IN_QUANTITY,
            COALESCE(TRY_CAST(SITE_TRANSFER_IN_AMOUNT AS DOUBLE), 0.0) AS SITE_TRANSFER_IN_AMOUNT,
            COALESCE(TRY_CAST(SITE_TRANSFER_OUT_QUANTITY AS DOUBLE), 0.0) AS SITE_TRANSFER_OUT_QUANTITY,
            COALESCE(TRY_CAST(SITE_TRANSFER_OUT_AMOUNT AS DOUBLE), 0.0) AS SITE_TRANSFER_OUT_AMOUNT,
            COALESCE(TRY_CAST(RETAIL_SALE_QUANTITY AS DOUBLE), 0.0) AS RETAIL_SALE_QUANTITY,
            COALESCE(TRY_CAST(RETAIL_SALE_AMOUNT AS DOUBLE), 0.0) AS RETAIL_SALE_AMOUNT,
            COALESCE(TRY_CAST(NET_SALE_QUANTITY AS DOUBLE), 0.0) AS NET_SALE_QUANTITY,
            COALESCE(TRY_CAST(NET_SALE_AMOUNT AS DOUBLE), 0.0) AS NET_SALE_AMOUNT,
            COALESCE(TRY_CAST(NET_SALE_COGS_AMOUNT AS DOUBLE), 0.0) AS NET_SALE_COGS_AMOUNT,
            COALESCE(TRY_CAST(CLOSING_STOCK_QUANTITY AS DOUBLE), 0.0) AS CLOSING_STOCK_QUANTITY,
            COALESCE(TRY_CAST(CLOSING_STOCK_AMOUNT AS DOUBLE), 0.0) AS CLOSING_STOCK_AMOUNT,
            COALESCE(TRY_CAST(GP_AMOUNT AS DOUBLE), 0.0) AS GP_AMOUNT,
            COALESCE(TRY_CAST(ADJUSTED_GP_AMOUNT AS DOUBLE), 0.0) AS ADJUSTED_GP_AMOUNT,
            COALESCE(TRY_CAST(SALE_TAX_AMOUNT AS DOUBLE), 0.0) AS SALE_TAX_AMOUNT,
            COALESCE(TRY_CAST(SALE_PROMO_AMOUNT AS DOUBLE), 0.0) AS SALE_PROMO_AMOUNT,
            COALESCE(TRY_CAST(SALE_DISCOUNT_AMOUNT AS DOUBLE), 0.0) AS SALE_DISCOUNT_AMOUNT,
            COALESCE(TRY_CAST(WAREHOUSE_TRANSFER_IN_QUANTITY AS DOUBLE), 0.0) AS WAREHOUSE_TRANSFER_IN_QUANTITY,
            COALESCE(TRY_CAST(WAREHOUSE_TRANSFER_IN_AMOUNT AS DOUBLE), 0.0) AS WAREHOUSE_TRANSFER_IN_AMOUNT,
            COALESCE(TRY_CAST(WH_TRANSFER_OUT_QUANTITY AS DOUBLE), 0.0) AS WH_TRANSFER_OUT_QUANTITY,
            COALESCE(TRY_CAST(WH_TRANSFER_OUT_AMOUNT AS DOUBLE), 0.0) AS WH_TRANSFER_OUT_AMOUNT,
            COALESCE(TRY_CAST(PENDING_PO_QUANTITY AS DOUBLE), 0.0) AS PENDING_PO_QUANTITY
        FROM read_csv_auto({fact_csv_files}, union_by_name=True, normalize_names=False)
    ) TO '{fact_parquet_path}' (FORMAT PARQUET, COMPRESSION SNAPPY);
    """
    con.execute(fact_sql)
    fact_count = con.execute(f"SELECT count(*) FROM '{fact_parquet_path}'").fetchone()[0]
    print(f"   -> Fact Parquet Created: {fact_count:,} rows")

    # 2. Convert Item Master Data
    print("2. Converting Item Master CSV (data/items.csv)...")
    items_parquet_path = os.path.join(output_dir, "dim_items.parquet").replace("\\", "/")
    
    items_sql = f"""
    COPY (
        SELECT
            TRIM(CAST(Division AS VARCHAR)) AS Division,
            TRIM(CAST(Section AS VARCHAR)) AS Section,
            TRIM(CAST(Department AS VARCHAR)) AS Department,
            TRIM(CAST("Department Allias" AS VARCHAR)) AS "Department Allias",
            TRIM(CAST(CNAME1 AS VARCHAR)) AS CNAME1,
            TRIM(CAST(CNAME2 AS VARCHAR)) AS CNAME2,
            TRIM(CAST(CNAME3 AS VARCHAR)) AS CNAME3,
            TRIM(CAST(CNAME4 AS VARCHAR)) AS CNAME4,
            TRIM(CAST(CNAME5 AS VARCHAR)) AS CNAME5,
            TRIM(CAST(CNAME6 AS VARCHAR)) AS CNAME6,
            TRIM(CAST(DESC1 AS VARCHAR)) AS DESC1,
            TRIM(CAST(DESC2 AS VARCHAR)) AS DESC2,
            TRIM(CAST(DESC3 AS VARCHAR)) AS DESC3,
            TRIM(CAST(PARTYNAME AS VARCHAR)) AS PARTYNAME,
            TRIM(CAST(ICODE AS VARCHAR)) AS ICODE,
            COALESCE(TRY_CAST(RATE AS DOUBLE), 0.0) AS RATE,
            COALESCE(TRY_CAST(MRP AS DOUBLE), 0.0) AS MRP,
            {date_parse_sql.format(col='STOCKINDATE')} AS STOCKINDATE
        FROM read_csv_auto('data/items.csv', ignore_errors=True, all_varchar=True)
        WHERE ICODE IS NOT NULL AND TRIM(CAST(ICODE AS VARCHAR)) != ''
    ) TO '{items_parquet_path}' (FORMAT PARQUET, COMPRESSION SNAPPY);
    """
    con.execute(items_sql)
    items_count = con.execute(f"SELECT count(*) FROM '{items_parquet_path}'").fetchone()[0]
    print(f"   -> Items Parquet Created: {items_count:,} rows")

    # 3. Convert Location Master Data
    print("3. Converting Location Master Excel (data/locations.xlsx)...")
    loc_parquet_path = os.path.join(output_dir, "dim_locations.parquet").replace("\\", "/")
    df_loc = pd.read_excel("data/locations.xlsx")
    df_loc["ADMSITE_CODE"] = df_loc["ADMSITE_CODE"].astype(int)
    df_loc["Name"] = df_loc["Name"].astype(str).str.strip()
    
    con.register("df_loc_temp", df_loc)
    con.execute(f"COPY df_loc_temp TO '{loc_parquet_path}' (FORMAT PARQUET, COMPRESSION SNAPPY)")
    loc_count = con.execute(f"SELECT count(*) FROM '{loc_parquet_path}'").fetchone()[0]
    print(f"   -> Locations Parquet Created: {loc_count:,} rows")

    elapsed = time.time() - start_time
    print(f"=== PARQUET CONVERSION COMPLETED IN {elapsed:.2f}s ===")

if __name__ == "__main__":
    run_parquet_conversion()
