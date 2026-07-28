import sys
import time

# Ensure UTF-8 stdout encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from backend.etl.convert_to_parquet import run_parquet_conversion
from backend.etl.init_duckdb import init_duckdb_warehouse
from backend.etl.modules.merchandise_buying import run_merchandise_buying_etl
from backend.etl.modules.vendor_performance import run_vendor_performance_etl
from backend.etl.modules.category_performance import run_category_performance_etl
from backend.etl.modules.colour_analytics import run_colour_analytics_etl
from backend.etl.modules.size_price_analytics import run_size_price_analytics_etl
from backend.etl.modules.store_allocation import run_store_allocation_etl
from backend.etl.modules.financial_gmroi import run_financial_gmroi_etl
from backend.etl.modules.ai_recommendations import run_ai_recommendations_etl

def main():
    pipeline_start = time.time()
    print("==================================================")
    print("STARTING MB-OLAP V2 CORE DATA ETL PIPELINE")
    print("==================================================")

    # 1. Run Parquet Conversion
    run_parquet_conversion()

    # 2. Run DuckDB Warehouse Base Schema Initialization
    init_duckdb_warehouse()

    # 3. Run All Feature Module ETL Views
    print("\n--- Running Feature Analytical Module ETL Views ---")
    run_merchandise_buying_etl()
    run_vendor_performance_etl()
    run_category_performance_etl()
    run_colour_analytics_etl()
    run_size_price_analytics_etl()
    run_store_allocation_etl()
    run_financial_gmroi_etl()
    run_ai_recommendations_etl()

    total_elapsed = time.time() - pipeline_start
    print("==================================================")
    print(f"PIPELINE SUCCESSFULLY EXECUTED IN {total_elapsed:.2f}s")
    print("==================================================")

if __name__ == "__main__":
    main()
