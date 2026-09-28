import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint(name, path, params=None):
    url = f"{BASE_URL}{path}"
    print(f"\n=======================================================")
    print(f"Testing {name}: GET {url} params={params}")
    try:
        resp = requests.get(url, params=params, timeout=30)
        print(f"HTTP Status: {resp.status_code}")
        if resp.status_code != 200:
            print("ERROR response:", resp.text[:500])
            return None
        data = resp.json()
        return data
    except Exception as e:
        print(f"Exception calling {url}: {e}")
        return None

results = {}

# 1. Executive KPIs
kpis = test_endpoint("Executive KPIs", "/executive/kpis")
results['kpis'] = kpis
if kpis and kpis.get("success"):
    d = kpis.get("data", {})
    print("KPIs Data:")
    print(f"  total_revenue: {d.get('total_revenue')}")
    print(f"  total_sales_units: {d.get('total_sales_units')}")
    print(f"  total_gross_profit: {d.get('total_gross_profit')}")
    print(f"  gross_margin_pct: {d.get('gross_margin_pct')}")
    print(f"  total_inventory_value: {d.get('total_inventory_value')}")
    print(f"  total_inventory_units: {d.get('total_inventory_units')}")
    print(f"  sell_through_pct: {d.get('sell_through_pct')}")
    print(f"  average_woc: {d.get('average_woc')}")
    print(f"  inventory_metrics_available: {d.get('inventory_metrics_available')}")

# 2. Executive Store Rankings
store_rankings = test_endpoint("Executive Store Rankings", "/executive/store-rankings")
results['store_rankings'] = store_rankings
if store_rankings and store_rankings.get("success"):
    stores = store_rankings.get("data", [])
    print(f"Store Rankings Count: {len(stores)}")
    if stores:
        s0 = stores[0]
        print(f"  Sample Store: {s0.get('store_name')} ({s0.get('admsite_code')})")
        print(f"    store_revenue: {s0.get('store_revenue')}")
        print(f"    store_stock_value: {s0.get('store_stock_value')}")
        print(f"    store_stock_units: {s0.get('store_stock_units')}")
        print(f"    store_woc: {s0.get('store_woc')}")
    # Sum of stock values across stores
    total_store_stock_val = sum(s.get('store_stock_value') or 0 for s in stores)
    total_store_stock_units = sum(s.get('store_stock_units') or 0 for s in stores)
    print(f"  Total store_stock_value across all stores: {total_store_stock_val}")
    print(f"  Total store_stock_units across all stores: {total_store_stock_units}")

# 3. Top Bottom SKUs
top_bottom_skus = test_endpoint("Top & Bottom SKUs", "/executive/top-bottom-skus")
results['top_bottom_skus'] = top_bottom_skus
if top_bottom_skus and top_bottom_skus.get("success"):
    top_skus = top_bottom_skus.get("data", {}).get("top_skus", [])
    bottom_skus = top_bottom_skus.get("data", {}).get("bottom_skus", [])
    print(f"Top SKUs Count: {len(top_skus)}, Bottom SKUs Count: {len(bottom_skus)}")
    if top_skus:
        print(f"  Top SKU 0: {top_skus[0].get('barcode')} rev={top_skus[0].get('sku_revenue')} stock={top_skus[0].get('current_stock_units')}")
    if bottom_skus:
        print(f"  Bottom SKU 0: {bottom_skus[0].get('barcode')} rev={bottom_skus[0].get('sku_revenue')} stock={bottom_skus[0].get('current_stock_units')}")

# 4. Monthly Trends
monthly_trends = test_endpoint("Executive Monthly Trends", "/executive/monthly-trends")
results['monthly_trends'] = monthly_trends
if monthly_trends and monthly_trends.get("success"):
    months = monthly_trends.get("data", [])
    print(f"Monthly Trends Count: {len(months)}")
    for m in months[:3]:
        print(f"  Month {m.get('month_year')}: rev={m.get('revenue')} gp={m.get('gross_profit')} inv={m.get('inventory_value')}")

# 5. Category Matrix
cat_matrix = test_endpoint("Category Matrix", "/category/matrix")
results['cat_matrix'] = cat_matrix
if cat_matrix and cat_matrix.get("success"):
    matrix = cat_matrix.get("data", [])
    benchmarks = cat_matrix.get("benchmarks", {})
    print(f"Category Matrix Departments Count: {len(matrix)}")
    print(f"  Benchmarks: {benchmarks}")
    if matrix:
        d0 = matrix[0]
        print(f"  Sample Department: {d0.get('department')}")
        print(f"    closing_stock_value: {d0.get('closing_stock_value')}")
        print(f"    closing_stock_units: {d0.get('closing_stock_units')}")
        print(f"    sell_through_pct: {d0.get('sell_through_pct')}")
        print(f"    woc: {d0.get('woc')}")
        print(f"    performance_quadrant: {d0.get('performance_quadrant')}")
    # Quadrant distribution
    quadrants = {}
    for m in matrix:
        q = m.get('performance_quadrant')
        quadrants[q] = quadrants.get(q, 0) + 1
    print(f"  Quadrant Distribution: {quadrants}")

# 6. Financial GMROI
gmroi_store = test_endpoint("Financial GMROI (store)", "/financial/gmroi", params={"group_by": "store"})
gmroi_dept = test_endpoint("Financial GMROI (dept)", "/financial/gmroi", params={"group_by": "department"})
if gmroi_dept and gmroi_dept.get("success"):
    d_list = gmroi_dept.get("data", [])
    print(f"GMROI Dept Count: {len(d_list)}")
    tot_rev = sum(x.get('total_revenue') or 0 for x in d_list)
    tot_gp = sum(x.get('total_gross_profit') or 0 for x in d_list)
    tot_avg_inv = sum(x.get('avg_inventory_value') or 0 for x in d_list)
    overall_gmroi = round(tot_gp / tot_avg_inv, 2) if tot_avg_inv > 0 else 0
    print(f"  Total GMROI Revenue: {tot_rev}")
    print(f"  Total GMROI GP: {tot_gp}")
    print(f"  Total GMROI Avg Inv: {tot_avg_inv}")
    print(f"  Overall Period GMROI: {overall_gmroi}")
    if d_list:
        print(f"  Sample Dept GMROI: {d_list[0]}")

# 7. Vendor Scorecard
vendor_scorecard = test_endpoint("Vendor Scorecard", "/vendor/scorecard", params={"page": 1, "page_size": 10})
if vendor_scorecard and vendor_scorecard.get("success"):
    v_data = vendor_scorecard.get("data", {})
    v_items = v_data.get("items", [])
    total_vendors = v_data.get("total_vendors")
    print(f"Vendor Scorecard total_vendors: {total_vendors}, items page 1: {len(v_items)}")
    if v_items:
        v0 = v_items[0]
        print(f"  Top Vendor: {v0.get('vendor_name')}")
        print(f"    receive_units: {v0.get('receive_units')}")
        print(f"    receive_value: {v0.get('receive_value')}")
        print(f"    current_stock_units: {v0.get('current_stock_units')}")
        print(f"    current_stock_value: {v0.get('current_stock_value')}")
        print(f"    sell_through_pct: {v0.get('sell_through_pct')}")
        print(f"    vendor_score: {v0.get('vendor_score')}")

print("\nValidation script finished.")
