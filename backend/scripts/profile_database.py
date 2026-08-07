"""Comprehensive DuckDB profiling script for BI platform planning."""
import json
import os
from datetime import datetime
from pathlib import Path

import duckdb

BACKEND_DIR = Path(__file__).resolve().parents[1]
DB_DIR = BACKEND_DIR / "db"
DB = DB_DIR / "olap_warehouse.duckdb"
OUT = DB_DIR / "profiling_output"
os.makedirs(OUT, exist_ok=True)

c = duckdb.connect(str(DB), read_only=True)

tables = [r[0] for r in c.execute(
    "SELECT table_name FROM information_schema.tables "
    "WHERE table_schema='main' AND table_type='BASE TABLE' ORDER BY table_name"
).fetchall()]

views = [r[0] for r in c.execute(
    "SELECT table_name FROM information_schema.tables "
    "WHERE table_schema='main' AND table_type='VIEW' ORDER BY table_name"
).fetchall()]

report = {
    "generated_at": str(datetime.now()),
    "database_path": str(DB),
    "tables": tables,
    "views": views,
    "schema": {},
    "row_counts": {},
    "profiling": {},
    "indexes": {},
    "view_definitions": {},
}

for t in tables + views:
    try:
        report["row_counts"][t] = c.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
    except Exception as e:
        report["row_counts"][t] = f"ERROR: {e}"

for t in tables + views:
    cols = c.execute(
        f"SELECT column_name, data_type, is_nullable, column_default, ordinal_position "
        f"FROM information_schema.columns "
        f"WHERE table_schema='main' AND table_name='{t}' ORDER BY ordinal_position"
    ).fetchall()
    report["schema"][t] = [
        {"name": r[0], "type": r[1], "nullable": r[2], "default": r[3], "position": r[4]}
        for r in cols
    ]

for v in views:
    try:
        defn = c.execute(
            f"SELECT sql FROM duckdb_views() WHERE view_name = '{v}'"
        ).fetchone()
        report["view_definitions"][v] = defn[0] if defn else None
    except Exception as e:
        report["view_definitions"][v] = f"ERROR: {e}"

for t in tables:
    try:
        idx_df = c.execute(
            f"SELECT * FROM duckdb_indexes() WHERE table_name = '{t}'"
        ).fetchdf()
        report["indexes"][t] = idx_df.to_dict("records")
    except Exception:
        report["indexes"][t] = []

NUMERIC_TYPES = {"TINYINT", "SMALLINT", "INTEGER", "BIGINT", "HUGEINT", "FLOAT", "DOUBLE", "DECIMAL", "NUMERIC"}
DATE_TYPES = {"DATE", "TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIME"}


def profile_column(table: str, col: str, dtype: str) -> dict:
    prof = {"column": col, "data_type": dtype}
    safe_t = f'"{table}"'
    safe_c = f'"{col}"'

    try:
        stats = c.execute(f"""
            SELECT
                COUNT(*) AS total_rows,
                COUNT({safe_c}) AS non_null_count,
                COUNT(*) - COUNT({safe_c}) AS null_count,
                ROUND(100.0 * (COUNT(*) - COUNT({safe_c})) / NULLIF(COUNT(*), 0), 2) AS null_pct,
                COUNT(DISTINCT {safe_c}) AS distinct_count
            FROM {safe_t}
        """).fetchone()
        prof["total_rows"] = stats[0]
        prof["non_null_count"] = stats[1]
        prof["null_count"] = stats[2]
        prof["null_pct"] = float(stats[3]) if stats[3] is not None else 0.0
        prof["distinct_count"] = stats[4]
        prof["nullable"] = prof["null_count"] > 0
        prof["high_cardinality"] = prof["distinct_count"] > 1000 if stats[0] else False
        prof["cardinality_ratio"] = round(prof["distinct_count"] / max(stats[0], 1), 4)

        samples = c.execute(
            f"SELECT DISTINCT {safe_c} FROM {safe_t} WHERE {safe_c} IS NOT NULL LIMIT 5"
        ).fetchall()
        prof["sample_values"] = [str(s[0]) for s in samples]

        base = dtype.upper().split("(")[0]
        if base in NUMERIC_TYPES or base in DATE_TYPES:
            mm = c.execute(f"""
                SELECT MIN({safe_c}), MAX({safe_c}) FROM {safe_t} WHERE {safe_c} IS NOT NULL
            """).fetchone()
            prof["min"] = str(mm[0]) if mm[0] is not None else None
            prof["max"] = str(mm[0]) if mm[1] is not None else None
            if mm[1] is not None:
                prof["max"] = str(mm[1])

        if prof["distinct_count"] and prof["distinct_count"] <= 50:
            freq = c.execute(f"""
                SELECT {safe_c}, COUNT(*) AS cnt
                FROM {safe_t}
                WHERE {safe_c} IS NOT NULL
                GROUP BY {safe_c}
                ORDER BY cnt DESC
                LIMIT 20
            """).fetchall()
            prof["frequency_distribution"] = [
                {"value": str(r[0]), "count": r[1]} for r in freq
            ]
    except Exception as e:
        prof["error"] = str(e)

    return prof


for t in tables:
    report["profiling"][t] = []
    for col_info in report["schema"][t]:
        report["profiling"][t].append(
            profile_column(t, col_info["name"], col_info["type"])
        )
    print(f"Profiled table: {t}")

for v in views:
    report["profiling"][v] = {"note": "View - schema captured, full profiling deferred", "columns": report["schema"][v]}

fk_candidates = []
for t in tables:
    for col_info in report["schema"][t]:
        col = col_info["name"]
        if col.endswith("_CODE") or col in ("BARCODE", "ICODE", "ADMSITE_CODE"):
            for ref_t in tables:
                if ref_t == t:
                    continue
                ref_cols = [c["name"] for c in report["schema"][ref_t]]
                if col in ref_cols or (col == "BARCODE" and "ICODE" in ref_cols):
                    fk_candidates.append({
                        "from_table": t, "from_column": col,
                        "to_table": ref_t,
                        "to_column": "ICODE" if col == "BARCODE" and "ICODE" in ref_cols else col,
                        "inferred": True,
                    })

report["inferred_relationships"] = fk_candidates

col_map = {}
for t, cols in report["schema"].items():
    for col in cols:
        col_map.setdefault(col["name"], []).append(t)
report["duplicate_column_names"] = {k: v for k, v in col_map.items() if len(v) > 1}

output_path = OUT / "full_profiling_report.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, default=str)

print(f"\nDone. Output: {output_path}")
print(f"Tables: {len(tables)}, Views: {len(views)}")
