"""Business discovery and profiling summary."""
import json
from pathlib import Path

import duckdb

BACKEND_DIR = Path(__file__).resolve().parents[1]
DB_DIR = BACKEND_DIR / "db"
DB = DB_DIR / "olap_warehouse.duckdb"
REPORT = DB_DIR / "profiling_output" / "full_profiling_report.json"

c = duckdb.connect(str(DB), read_only=True)
r = json.load(open(REPORT, encoding="utf-8"))

print("=== COLUMN PROFILING SUMMARY (BASE TABLES) ===\n")
for table in ["fact_cube_monthly", "dim_item", "dim_location", "ai_recommendations_feed"]:
    print("=" * 80)
    print(f"TABLE: {table} | Rows: {r['row_counts'][table]:,}")
    print("=" * 80)
    for p in r["profiling"][table]:
        hc = " [HIGH-CARD]" if p.get("high_cardinality") else ""
        print(
            f"  {p['column']:30} {p['data_type']:12} "
            f"null={p.get('null_pct', 0)}% distinct={p.get('distinct_count', '?')}{hc}"
        )
        if p.get("min"):
            print(f"    min={p['min']} max={p['max']}")
        if p.get("frequency_distribution"):
            top3 = p["frequency_distribution"][:3]
            print(f"    top values: {top3}")
        if p.get("sample_values") and not p.get("frequency_distribution"):
            print(f"    samples: {p['sample_values'][:3]}")
    print()

print("\n=== JOIN INTEGRITY ===")
orphan_items = c.execute(
    "SELECT COUNT(*) FROM fact_cube_monthly f "
    "LEFT JOIN dim_item i ON f.BARCODE = i.ICODE WHERE i.ICODE IS NULL"
).fetchone()[0]
orphan_locs = c.execute(
    "SELECT COUNT(*) FROM fact_cube_monthly f "
    "LEFT JOIN dim_location l ON f.ADMSITE_CODE = l.ADMSITE_CODE WHERE l.ADMSITE_CODE IS NULL"
).fetchone()[0]
print(f"Fact rows with no matching dim_item: {orphan_items:,}")
print(f"Fact rows with no matching dim_location: {orphan_locs:,}")

print("\n=== DATE RANGE ===")
dr = c.execute(
    "SELECT MIN(REPORT_DATE), MAX(REPORT_DATE), MIN(START_DATE), MAX(END_DATE), "
    "COUNT(DISTINCT strftime(START_DATE, '%Y-%m')) FROM fact_cube_monthly"
).fetchone()
print(f"REPORT_DATE: {dr[0]} to {dr[1]}")
print(f"START_DATE: {dr[2]} to {dr[3]}")
print(f"Distinct months: {dr[4]}")

print("\n=== LOCATIONS ===")
for row in c.execute(
    "SELECT ADMSITE_CODE, Name, SITE_TYPE FROM dim_location ORDER BY ADMSITE_CODE"
).fetchall():
    print(row)

print("\n=== DIVISIONS ===")
for row in c.execute(
    "SELECT Division, COUNT(*) FROM dim_item GROUP BY Division ORDER BY COUNT(*) DESC LIMIT 10"
).fetchall():
    print(row)

print(f"\n=== DEPARTMENTS COUNT: {c.execute('SELECT COUNT(DISTINCT Department) FROM dim_item').fetchone()[0]} ===")

print("\n=== VIEW SCHEMAS (key views) ===")
for v in [
    "v_fact_item_location_monthly",
    "v_category_hierarchy_summary",
    "v_gmroi_analysis",
    "v_sku_velocity_summary",
]:
    cols = c.execute(
        f"SELECT column_name, data_type FROM information_schema.columns "
        f"WHERE table_name='{v}' ORDER BY ordinal_position"
    ).fetchall()
    print(f"\n{v} ({len(cols)} cols):")
    for col in cols[:10]:
        print(f"  {col[0]}: {col[1]}")
    if len(cols) > 10:
        print(f"  ... +{len(cols) - 10} more")

print("\n=== DERIVED/CALCULATED COLUMNS IN VIEWS ===")
for v, defn in r.get("view_definitions", {}).items():
    if defn and "CASE" in str(defn).upper():
        print(f"  {v}: contains CASE expressions (derived logic)")
