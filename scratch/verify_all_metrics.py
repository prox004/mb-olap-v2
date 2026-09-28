import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api/v1"

def run_validations():
    print("=" * 70)
    print("RUNNING FINAL VALIDATION FOR INVENTORY ANALYTICS INTEGRATION")
    print("=" * 70)

    # 1. Executive KPIs
    print("\n--- 1. Testing /api/v1/executive/kpis ---")
    r = requests.get(f"{BASE_URL}/executive/kpis")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    kpis = r.json()["data"]

    revenue = kpis["total_revenue"]
    units = kpis["total_sales_units"]
    gp = kpis["total_gross_profit"]
    inv_val = kpis["total_inventory_value"]
    inv_units = kpis["total_inventory_units"]
    sell_thru = kpis["sell_through_pct"]
    woc = kpis["average_woc"]
    inv_avail = kpis["inventory_metrics_available"]

    print(f"Revenue: {revenue:,.2f} (Target: 331,367,606.00)")
    assert revenue == 331367606.0, f"Revenue mismatch: {revenue}"

    print(f"Sales Units: {units:,.0f} (Target: 1,234,990)")
    assert units == 1234990.0, f"Units mismatch: {units}"

    print(f"Gross Profit: {gp:,.2f} (Target: 140,741,381.00)")
    assert gp == 140741381.0, f"Gross profit mismatch: {gp}"

    print(f"Inventory Value: {inv_val:,.2f} (Target: 114,258,542.00)")
    assert inv_val == 114258542.0, f"Inventory value mismatch: {inv_val}"

    print(f"Inventory Units: {inv_units:,.0f} (Target: 620,420)")
    assert inv_units == 620420.0, f"Inventory units mismatch: {inv_units}"

    print(f"Sell-Through %: {sell_thru}% (Target: 69.48%)")
    assert sell_thru == 69.48, f"Sell-through mismatch: {sell_thru}"

    print(f"Average WOC: {woc} weeks (Target: 10.14 weeks)")
    assert woc == 10.14, f"WOC mismatch: {woc}"

    print(f"Inventory Metrics Available: {inv_avail} (Target: True)")
    assert inv_avail is True, f"Inventory metrics available mismatch: {inv_avail}"
    print(">>> Executive KPIs: ALL ASSERTIONS PASSED!")

    # 2. Executive Store Rankings
    print("\n--- 2. Testing /api/v1/executive/store-rankings ---")
    r = requests.get(f"{BASE_URL}/executive/store-rankings")
    assert r.status_code == 200
    stores = r.json()["data"]
    assert len(stores) == 6, f"Expected 6 stores, got {len(stores)}"
    total_store_stock_val = sum(s["store_stock_value"] or 0 for s in stores)
    total_store_stock_units = sum(s["store_stock_units"] or 0 for s in stores)
    print(f"Total Store Stock Value: {total_store_stock_val:,.2f} (Target: 114,258,542.00)")
    assert total_store_stock_val == 114258542.0
    print(f"Total Store Stock Units: {total_store_stock_units:,.0f} (Target: 620,420)")
    assert total_store_stock_units == 620420.0
    for s in stores:
        print(f"  Store {s['admsite_code']} ({s['store_name']}): stock_val=₹{s['store_stock_value']:,.0f}, stock_units={s['store_stock_units']}, woc={s['store_woc']} wks")
        assert s["store_stock_value"] is not None and s["store_stock_value"] > 0
        assert s["store_woc"] is not None and s["store_woc"] > 0
    print(">>> Executive Store Rankings: ALL ASSERTIONS PASSED!")

    # 3. Top & Bottom SKUs
    print("\n--- 3. Testing /api/v1/executive/top-bottom-skus ---")
    r = requests.get(f"{BASE_URL}/executive/top-bottom-skus")
    assert r.status_code == 200
    top_skus = r.json()["data"]["top_skus"]
    bottom_skus = r.json()["data"]["bottom_skus"]
    assert len(top_skus) == 10
    assert len(bottom_skus) == 10
    print(f"Top SKU #1: {top_skus[0]['barcode']} - Rev: ₹{top_skus[0]['sku_revenue']:,.0f}, Stock: {top_skus[0]['current_stock_units']}")
    print(f"Bottom SKU #1: {bottom_skus[0]['barcode']} - Rev: ₹{bottom_skus[0]['sku_revenue']:,.0f}, Stock: {bottom_skus[0]['current_stock_units']}")
    assert bottom_skus[0]["current_stock_units"] is not None and bottom_skus[0]["current_stock_units"] > 0, "Bottom SKU should have stock units"
    print(">>> Top & Bottom SKUs: ALL ASSERTIONS PASSED!")

    # 4. Monthly Trends
    print("\n--- 4. Testing /api/v1/executive/monthly-trends ---")
    r = requests.get(f"{BASE_URL}/executive/monthly-trends")
    assert r.status_code == 200
    trends = r.json()["data"]
    assert len(trends) == 6, f"Expected 6 monthly trends, got {len(trends)}"
    for t in trends:
        assert t["inventory_value"] is None, "Monthly inventory_value MUST be null to prevent fabrication"
        assert t["revenue"] is not None and t["revenue"] > 0
        assert t["gross_profit"] is not None and t["gross_profit"] > 0
    tot_trend_rev = sum(t["revenue"] for t in trends)
    tot_trend_gp = sum(t["gross_profit"] for t in trends)
    print(f"Monthly Trends Count: {len(trends)}")
    print(f"Monthly Trends Revenue Sum: {tot_trend_rev:,.2f}")
    print(f"Monthly Trends GP Sum: {tot_trend_gp:,.2f}")
    print(">>> Monthly Trends: ALL ASSERTIONS PASSED (inventory_value is strictly None)!")

    # 5. Category Matrix
    print("\n--- 5. Testing /api/v1/category/matrix ---")
    r = requests.get(f"{BASE_URL}/category/matrix")
    assert r.status_code == 200
    cat_items = r.json()["data"]
    assert len(cat_items) > 50
    quadrants = set(item["performance_quadrant"] for item in cat_items)
    print(f"Quadrants present: {quadrants}")
    assert quadrants == {"WINNER", "HIGH_MARGIN_SLOW", "VOLUME_DRIVER", "OVERSTOCKED_UNDERPERFORMER"}
    # Verify no sell_through_pct is null
    assert all(item["sell_through_pct"] is not None for item in cat_items)
    print(">>> Category Matrix: ALL ASSERTIONS PASSED!")

    # 6. Financial GMROI
    print("\n--- 6. Testing /api/v1/financial/gmroi ---")
    for dim in ["store", "department", "vendor"]:
        r = requests.get(f"{BASE_URL}/financial/gmroi", params={"group_by": dim})
        assert r.status_code == 200
        items = r.json()["data"]
        tot_rev = sum(x["total_revenue"] for x in items)
        tot_gp = sum(x["total_gross_profit"] for x in items)
        tot_avg_inv = sum(x["avg_inventory_value"] for x in items)
        ratio = round(tot_gp / tot_avg_inv, 2)
        print(f"GMROI by {dim} (count={len(items)}):")
        print(f"  Revenue: ₹{tot_rev:,.2f} (Target: 331,367,606.00)")
        print(f"  Gross Profit: ₹{tot_gp:,.2f} (Target: 140,741,381.00)")
        print(f"  Avg Inventory: ₹{tot_avg_inv:,.2f} (Target: 101,659,068.50)")
        print(f"  Period GMROI: {ratio} (Target: 1.38)")
        assert tot_rev == 331367606.0, f"Rev mismatch for {dim}"
        assert tot_gp == 140741381.0, f"GP mismatch for {dim}"
        assert tot_avg_inv == 101659068.5, f"Avg inv mismatch for {dim}"
        assert ratio == 1.38, f"GMROI ratio mismatch for {dim}"
    print(">>> Financial GMROI: ALL ASSERTIONS PASSED!")

    # 7. Vendor Scorecard
    print("\n--- 7. Testing /api/v1/vendor/scorecard ---")
    r = requests.get(f"{BASE_URL}/vendor/scorecard", params={"page": 1, "page_size": 20})
    assert r.status_code == 200
    v_data = r.json()["data"]
    total_vendors = v_data["total_vendors"]
    v_items = v_data["items"]
    print(f"Total Vendors: {total_vendors}")
    assert total_vendors > 100
    v0 = v_items[0]
    print(f"Vendor #1: {v0['vendor_name']}")
    print(f"  Received Units: {v0['receive_units']}")
    print(f"  Closing Stock Units: {v0['current_stock_units']}")
    print(f"  Closing Stock Value: ₹{v0['current_stock_value']:,.2f}")
    print(f"  Sell-Through %: {v0['sell_through_pct']}%")
    print(f"  Vendor Score: {v0['vendor_score']}")
    # Assert returns are 0.0 (unsupported, not fabricated)
    assert v0["return_units"] == 0.0
    assert v0["return_value"] == 0.0
    assert v0["return_rate_pct"] == 0.0
    print(">>> Vendor Scorecard: ALL ASSERTIONS PASSED (no vendor returns fabricated)!")

    print("\n" + "=" * 70)
    print("CONGRATULATIONS: ALL 7 ENDPOINTS & ALL BUSINESS METRICS VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    run_validations()
