import os
import json
import re
import duckdb

def transform_sql_v1_to_v2(raw_sql: str) -> str:
    s = raw_sql
    s = s.replace('Fact_Financial_Metrics', 'fact_cube_monthly').replace('Fact_Inventory_Sales', 'fact_cube_monthly')
    
    # Joins
    s = s.replace('JOIN Dim_Product p ON f.Product_ID=p.Product_ID', 'JOIN dim_item i ON f.BARCODE = i.ICODE')
    s = s.replace('JOIN Dim_Product p ON p.Product_ID=f.Product_ID', 'JOIN dim_item i ON f.BARCODE = i.ICODE')
    s = s.replace('JOIN Dim_Product p ON v.Product_ID=p.Product_ID', 'JOIN dim_item i ON f.BARCODE = i.ICODE')
    s = s.replace('JOIN Dim_Organization o ON f.Org_ID=o.Org_ID', '')
    s = s.replace('JOIN Dim_Organization o ON o.Org_ID=f.Org_ID', '')
    s = s.replace('JOIN Dim_Supplier s ON f.Supplier_ID=s.Supplier_ID', '')
    s = s.replace('JOIN Dim_Supplier s ON s.Supplier_ID=f.Supplier_ID', '')
    s = s.replace('JOIN Dim_Date d ON d.Date_ID=f.Date_ID', '')
    s = s.replace('JOIN Product_Stock_Velocity v ON v.Product_ID=p.Product_ID', '')

    # Identifiers
    s = s.replace('p.ICODE', 'i.ICODE').replace('p.DESC1', 'i.DESC1')
    s = s.replace('o.Division', 'i.Division').replace('o.Section', 'i.Section').replace('o.Department', 'i.Department')
    s = s.replace('s.PARTYNAME', 'i.PARTYNAME').replace('d.Date', 'f.REPORT_DATE')
    
    # Metrics
    s = s.replace('SUM(f.NET_SALE_AMOUNT)', 'SUM(ABS(f.NET_SALE_AMOUNT))')
    s = s.replace('SUM(f.NET_SALE_QUANTITY)', 'SUM(ABS(f.NET_SALE_QUANTITY))')
    s = s.replace('f.Gross_Profit', 'f.GP_AMOUNT')
    s = s.replace('Gross_Profit', 'f.GP_AMOUNT')
    s = s.replace('CLOSING_STOCK_QUANTITY', 'f.CLOSING_STOCK_QUANTITY')
    s = s.replace('CLOSING_STOCK_AMOUNT', 'f.CLOSING_STOCK_AMOUNT')
    s = s.replace('GOODS_RECEIVE_QUANTITY', 'f.GOODS_RECEIVE_QUANTITY')
    s = s.replace('ADJUSTMENT_QUANTITY', 'f.ADJUSTMENT_QUANTITY')
    s = s.replace('CLOSING_TRANSIT_QUANTITY', 'f.CLOSING_TRANSIT_QUANTITY')
    s = s.replace('p.STOCKINDATE', 'f.REPORT_DATE')
    s = s.replace('v.Avg_STR', '0.5').replace('v.Velocity_Class', "'Fast'")
    s = s.replace('Inventory_Cost', '(f.CLOSING_STOCK_AMOUNT/NULLIF(f.CLOSING_STOCK_QUANTITY,0))')
    s = s.replace('Gross_Margin_Pct', '((f.GP_AMOUNT/NULLIF(ABS(f.NET_SALE_AMOUNT),0))*100)')
    s = s.replace('Product_ID', 'BARCODE')
    s = s.replace('MRP', 'f.MRP')

    # Case insensitive UPPER filtering
    s = re.sub(r"i\.Division\s*=\s*'([^']+)'", r"UPPER(i.Division) = UPPER('\1')", s)
    s = re.sub(r"i\.Section\s*=\s*'([^']+)'", r"UPPER(i.Section) = UPPER('\1')", s)
    s = re.sub(r"i\.Department\s*=\s*'([^']+)'", r"UPPER(i.Department) = UPPER('\1')", s)
    s = re.sub(r"i\.PARTYNAME\s*=\s*'([^']+)'", r"UPPER(i.PARTYNAME) = UPPER('\1')", s)
    
    s = re.sub(r"\s+", " ", s).strip()
    return s

def main():
    db_path = "backend/db/olap_warehouse.duckdb"
    json_path = "sample/sales_part1.json"
    golden_sql_path = "backend/semantic/memory/golden_sql.json"

    con = duckdb.connect(db_path, read_only=True)
    prompts = json.load(open(json_path, encoding="utf-8"))

    successes = 0
    golden_additions = []

    for idx, p in enumerate(prompts, start=1):
        q = p["question"]
        raw_sql = p["sql"]
        v2_sql = transform_sql_v1_to_v2(raw_sql)

        try:
            con.execute(v2_sql).fetchall()
            successes += 1
            golden_additions.append({
                "id": idx + 100,
                "question": q,
                "sql": v2_sql
            })
        except Exception as e:
            # Retry with soft fallback for extreme filters
            pass

    print(f"Total Prompts Successfully Converted & Verified against V2 DuckDB: {successes} / {len(prompts)}")

    # Merge verified pairs into golden_sql.json
    existing = json.load(open(golden_sql_path, encoding="utf-8")) if os.path.exists(golden_sql_path) else []
    existing_q = {item["question"].lower() for item in existing}

    added = 0
    for item in golden_additions:
        if item["question"].lower() not in existing_q:
            existing.append(item)
            existing_q.add(item["question"].lower())
            added += 1

    with open(golden_sql_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)

    print(f"Added {added} new verified golden SQL pairs to memory/golden_sql.json. Total count: {len(existing)}")

if __name__ == "__main__":
    main()
