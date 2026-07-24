import sys
import time

# Ensure UTF-8 stdout encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from backend.etl.convert_to_parquet import run_parquet_conversion
from backend.etl.init_duckdb import init_duckdb_warehouse

def main():
    pipeline_start = time.time()
    print("==================================================")
    print("STARTING MB-OLAP V2 CORE DATA ETL PIPELINE")
    print("==================================================")

    # 1. Run Parquet Conversion
    run_parquet_conversion()

    # 2. Run DuckDB Initialization
    init_duckdb_warehouse()

    total_elapsed = time.time() - pipeline_start
    print("==================================================")
    print(f"PIPELINE SUCCESSFULLY EXECUTED IN {total_elapsed:.2f}s")
    print("==================================================")

if __name__ == "__main__":
    main()
