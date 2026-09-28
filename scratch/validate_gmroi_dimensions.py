import subprocess
import json
import csv
import io
import sys

sys.stdout.reconfigure(encoding='utf-8')

def run_ch_query(query):
    cmd = [
        "docker", "exec", "mb_olap_clickhouse",
        "clickhouse-client", "--database=mb_olap_v2",
        "--query", query + " FORMAT TabSeparatedWithNames"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    reader = csv.DictReader(io.StringIO(res.stdout), delimiter='\t')
    return list(reader)

queries = {
    "store": """
        WITH sales AS (
            SELECT
                l.admsite_code AS admsite_code,
                COALESCE(l.store_name, concat('Store ', toString(l.admsite_code))) AS store_name,
                SUM(f.net_amount) AS total_revenue,
                SUM(f.gross_profit) AS total_gross_profit
            FROM fact_sales_monthly f
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            GROUP BY l.admsite_code, l.store_name
        ),
        inv AS (
            SELECT
                l.admsite_code AS admsite_code,
                COALESCE(l.store_name, concat('Store ', toString(l.admsite_code))) AS store_name,
                SUM(i.opening_amt) AS opening_amt,
                SUM(i.closing_amt) AS closing_amt,
                (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
            FROM fact_inventory i
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            GROUP BY l.admsite_code, l.store_name
        ),
        all_keys AS (
            SELECT admsite_code FROM sales UNION DISTINCT SELECT admsite_code FROM inv
        )
        SELECT
            COALESCE(s.store_name, i.store_name, concat('Store ', toString(k.admsite_code))) AS group_name,
            COALESCE(s.total_gross_profit, 0.0) AS gross_profit,
            COALESCE(i.opening_amt, 0.0) AS opening_inventory,
            COALESCE(i.closing_amt, 0.0) AS closing_inventory,
            COALESCE(i.avg_inventory_value, 0.0) AS avg_inventory,
            CASE 
                WHEN COALESCE(i.avg_inventory_value, 0.0) > 0 
                THEN ROUND(COALESCE(s.total_gross_profit, 0.0) / i.avg_inventory_value, 2)
                ELSE 0.0 
            END AS period_gmroi
        FROM all_keys k
        LEFT JOIN sales s ON k.admsite_code = s.admsite_code
        LEFT JOIN inv i ON k.admsite_code = i.admsite_code
        ORDER BY period_gmroi DESC
    """,
    "department": """
        WITH sales AS (
            SELECT
                COALESCE(p.department, 'UNKNOWN') AS department,
                SUM(f.net_amount) AS total_revenue,
                SUM(f.gross_profit) AS total_gross_profit
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            GROUP BY COALESCE(p.department, 'UNKNOWN')
        ),
        inv AS (
            SELECT
                COALESCE(p.department, 'UNKNOWN') AS department,
                SUM(i.opening_amt) AS opening_amt,
                SUM(i.closing_amt) AS closing_amt,
                (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
            FROM fact_inventory i
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            GROUP BY COALESCE(p.department, 'UNKNOWN')
        ),
        all_keys AS (
            SELECT department FROM sales UNION DISTINCT SELECT department FROM inv
        )
        SELECT
            k.department AS group_name,
            COALESCE(s.total_gross_profit, 0.0) AS gross_profit,
            COALESCE(i.opening_amt, 0.0) AS opening_inventory,
            COALESCE(i.closing_amt, 0.0) AS closing_inventory,
            COALESCE(i.avg_inventory_value, 0.0) AS avg_inventory,
            CASE 
                WHEN COALESCE(i.avg_inventory_value, 0.0) > 0 
                THEN ROUND(COALESCE(s.total_gross_profit, 0.0) / i.avg_inventory_value, 2)
                ELSE 0.0 
            END AS period_gmroi
        FROM all_keys k
        LEFT JOIN sales s ON k.department = s.department
        LEFT JOIN inv i ON k.department = i.department
        ORDER BY period_gmroi DESC
    """,
    "vendor": """
        WITH sales AS (
            SELECT
                COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                SUM(f.net_amount) AS total_revenue,
                SUM(f.gross_profit) AS total_gross_profit
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            GROUP BY COALESCE(p.vendor_name, 'UNKNOWN_VENDOR')
        ),
        inv AS (
            SELECT
                COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
                SUM(i.opening_amt) AS opening_amt,
                SUM(i.closing_amt) AS closing_amt,
                (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
            FROM fact_inventory i
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            GROUP BY COALESCE(p.vendor_name, 'UNKNOWN_VENDOR')
        ),
        all_keys AS (
            SELECT vendor_name FROM sales UNION DISTINCT SELECT vendor_name FROM inv
        )
        SELECT
            k.vendor_name AS group_name,
            COALESCE(s.total_gross_profit, 0.0) AS gross_profit,
            COALESCE(i.opening_amt, 0.0) AS opening_inventory,
            COALESCE(i.closing_amt, 0.0) AS closing_inventory,
            COALESCE(i.avg_inventory_value, 0.0) AS avg_inventory,
            CASE 
                WHEN COALESCE(i.avg_inventory_value, 0.0) > 0 
                THEN ROUND(COALESCE(s.total_gross_profit, 0.0) / i.avg_inventory_value, 2)
                ELSE 0.0 
            END AS period_gmroi
        FROM all_keys k
        LEFT JOIN sales s ON k.vendor_name = s.vendor_name
        LEFT JOIN inv i ON k.vendor_name = i.vendor_name
        ORDER BY period_gmroi DESC
    """,
    "sku": """
        WITH sales AS (
            SELECT
                f.item_code AS item_code,
                COALESCE(MAX(p.article_name), f.item_code) AS item_name,
                SUM(f.net_amount) AS total_revenue,
                SUM(f.gross_profit) AS total_gross_profit
            FROM fact_sales_monthly f
            LEFT JOIN dim_product p ON f.item_code = p.item_code
            LEFT JOIN dim_location l ON f.store_code = l.store_code
            GROUP BY f.item_code
        ),
        inv AS (
            SELECT
                i.item_code AS item_code,
                SUM(i.opening_amt) AS opening_amt,
                SUM(i.closing_amt) AS closing_amt,
                (SUM(i.opening_amt) + SUM(i.closing_amt)) / 2.0 AS avg_inventory_value
            FROM fact_inventory i
            LEFT JOIN dim_location l ON i.store_code = l.store_code
            LEFT JOIN dim_product p ON i.item_code = p.item_code
            GROUP BY i.item_code
        ),
        all_keys AS (
            SELECT item_code FROM sales UNION DISTINCT SELECT item_code FROM inv
        )
        SELECT
            k.item_code AS group_name,
            COALESCE(s.total_gross_profit, 0.0) AS gross_profit,
            COALESCE(i.opening_amt, 0.0) AS opening_inventory,
            COALESCE(i.closing_amt, 0.0) AS closing_inventory,
            COALESCE(i.avg_inventory_value, 0.0) AS avg_inventory,
            CASE 
                WHEN COALESCE(i.avg_inventory_value, 0.0) > 0 
                THEN ROUND(COALESCE(s.total_gross_profit, 0.0) / i.avg_inventory_value, 2)
                ELSE 0.0 
            END AS period_gmroi
        FROM all_keys k
        LEFT JOIN sales s ON k.item_code = s.item_code
        LEFT JOIN inv i ON k.item_code = i.item_code
        ORDER BY period_gmroi DESC
    """
}

for dim, sql in queries.items():
    print(f"\n{'='*70}")
    print(f"DIMENSION: {dim.upper()}")
    print(f"{'='*70}")
    rows = run_ch_query(sql)
    num_groups = len(rows)
    gmrois = [float(r['period_gmroi']) for r in rows]
    min_gmroi = min(gmrois)
    max_gmroi = max(gmrois)
    avg_gmroi = sum(gmrois) / num_groups
    
    # Also calculate weighted GMROI (total GP / total avg inv)
    tot_gp = sum(float(r['gross_profit']) for r in rows)
    tot_avg_inv = sum(float(r['avg_inventory']) for r in rows)
    weighted_gmroi = tot_gp / tot_avg_inv if tot_avg_inv > 0 else 0
    
    # Check distinct GMROIs
    distinct_gmrois = set(gmrois)
    
    print(f"1. Number of groups returned: {num_groups}")
    print(f"2. Minimum GMROI: {min_gmroi:.2f}")
    print(f"3. Maximum GMROI: {max_gmroi:.2f}")
    print(f"4. Arithmetic Average GMROI: {avg_gmroi:.2f}")
    print(f"   Weighted Chain GMROI: {weighted_gmroi:.2f} (Total GP: {tot_gp:,.2f} / Total Avg Inv: {tot_avg_inv:,.2f})")
    print(f"   Distinct GMROI values count: {len(distinct_gmrois)}")
    print(f"\n5. First 10 individual groups:")
    print(f"{'Group Name':<35} | {'Gross Profit':<14} | {'Opening Inv':<14} | {'Closing Inv':<14} | {'Avg Inv':<14} | {'Period GMROI'}")
    print("-" * 110)
    for r in rows[:10]:
        g_name = (r['group_name'][:33] + '..') if len(r['group_name']) > 35 else r['group_name']
        gp = float(r['gross_profit'])
        op = float(r['opening_inventory'])
        cl = float(r['closing_inventory'])
        ai = float(r['avg_inventory'])
        gmroi = float(r['period_gmroi'])
        print(f"{g_name:<35} | ₹{gp:>12,.2f} | ₹{op:>12,.2f} | ₹{cl:>12,.2f} | ₹{ai:>12,.2f} | {gmroi:>10.2f}")
        # Verify formulas
        calc_ai = (op + cl) / 2.0
        assert abs(calc_ai - ai) < 0.01, f"Avg inv mismatch for {g_name}: {calc_ai} vs {ai}"
        if ai > 0:
            calc_gmroi = round(gp / ai, 2)
            assert abs(calc_gmroi - gmroi) < 0.02, f"GMROI mismatch for {g_name}: {calc_gmroi} vs {gmroi}"
            
    print(f"\n6. Confirm distinct GMROI: {'YES - Each group has its own calculated GMROI!' if len(distinct_gmrois) > 1 else 'NO - ALL GROUPS RETURN SAME!'}")
