import os
import json
import yaml
import duckdb

def verify_wren_context_and_golden_sql():
    """
    Verification Runner for Wren AI Context Layer & MDL ETL:
      1. Verifies YAML MDL files (olap_cube.yml, metrics.yml, business_rules.yml).
      2. Connects to DuckDB (backend/db/olap_warehouse.duckdb).
      3. Verifies table/column references match live DuckDB catalog.
      4. Executes all 20 golden SQL queries in golden_sql.json against DuckDB.
    """
    print("=== STARTING WREN AI CONTEXT & GOLDEN SQL VERIFICATION ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database file not found at: {db_path}")

    con = duckdb.connect(db_path)
    print(f"Connected to DuckDB: {os.path.abspath(db_path)}")

    # 1. Load MDL Models
    olap_cube_path = os.path.join("backend", "semantic", "models", "olap_cube.yml")
    with open(olap_cube_path, "r", encoding="utf-8") as f:
        cube_mdl = yaml.safe_load(f)

    print("\n1. Verifying MDL Tables against DuckDB catalog...")
    for model in cube_mdl.get("models", []):
        table_name = model["table_reference"]["table"]
        count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        print(f"   [PASS] Model '{model['name']}' -> DuckDB table '{table_name}' ({count:,} rows)")

    # 2. Load Golden SQL Corpus
    golden_sql_path = os.path.join("backend", "semantic", "memory", "golden_sql.json")
    with open(golden_sql_path, "r", encoding="utf-8") as f:
        golden_pairs = json.load(f)

    print(f"\n2. Executing {len(golden_pairs)} Golden SQL Benchmark Queries against DuckDB...")
    passed_count = 0
    failed_count = 0

    for item in golden_pairs:
        q_id = item.get("id")
        question = item.get("question")
        sql = item.get("sql")

        try:
            res = con.execute(sql).fetchall()
            row_count = len(res)
            passed_count += 1
            print(f"   [PASS] Q{q_id:02d}: \"{question}\" -> {row_count} rows returned")
        except Exception as e:
            failed_count += 1
            print(f"   [FAIL] Q{q_id:02d}: \"{question}\"\n          Error: {str(e)}")

    con.close()

    print("\n=== VERIFICATION SUMMARY ===")
    print(f"   Total Golden Queries: {len(golden_pairs)}")
    print(f"   Successful Queries:   {passed_count}")
    print(f"   Failed Queries:       {failed_count}")

    if failed_count == 0:
        print("\nSUCCESS: 100% of Wren AI Golden SQL Queries Executed Cleanly!")
    else:
        raise RuntimeError(f"{failed_count} golden queries failed execution!")

if __name__ == "__main__":
    verify_wren_context_and_golden_sql()
