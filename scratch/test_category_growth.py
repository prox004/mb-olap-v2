import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api/v1/category/growth"

def test_category_growth():
    print("=" * 70)
    print("TESTING /api/v1/category/growth FIX")
    print("=" * 70)

    # 1. Test April 2025 (month=2025-04)
    print("\n--- 1. Testing /api/v1/category/growth?month=2025-04 ---")
    r = requests.get(BASE_URL, params={"month": "2025-04", "limit": 5})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    items = data["data"]
    print(f"Items returned: {len(items)}")
    for item in items:
        print(f"Dept: {item['department']} | Div: {item['division']} | Month: {item['month']}")
        print(f"  Current Rev: ₹{item['current_revenue']:,.2f}, Prior Rev: {item['prior_revenue']}, Rev Growth %: {item['revenue_growth_pct']}")
        print(f"  Current Units: {item['current_units']}, Prior Units: {item['prior_units']}, Units Growth %: {item['units_growth_pct']}")
        assert item["month"] == "2025-04"
        assert item["prior_revenue"] is None, "April prior_revenue must be None"
        assert item["revenue_growth_pct"] is None, "April revenue_growth_pct must be None"
        assert item["prior_units"] is None, "April prior_units must be None"
        assert item["units_growth_pct"] is None, "April units_growth_pct must be None"
        assert item["current_revenue"] > 0
        assert item["current_units"] > 0
    print(">>> April 2025 test PASSED: All prior/growth fields are strictly None!")

    # 2. Test August 2025 (month=2025-08) -> July to August
    print("\n--- 2. Testing /api/v1/category/growth?month=2025-08 ---")
    r = requests.get(BASE_URL, params={"month": "2025-08", "limit": 5})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    items = r.json()["data"]
    print(f"Items returned: {len(items)}")
    for item in items:
        print(f"Dept: {item['department']} | Div: {item['division']} | Month: {item['month']}")
        print(f"  Current Rev: ₹{item['current_revenue']:,.2f}, Prior Rev: ₹{item['prior_revenue']:,.2f}, Rev Growth %: {item['revenue_growth_pct']}%")
        print(f"  Current Units: {item['current_units']}, Prior Units: {item['prior_units']}, Units Growth %: {item['units_growth_pct']}%")
        assert item["month"] == "2025-08"
        assert item["prior_revenue"] is not None and item["prior_revenue"] > 0
        assert item["prior_units"] is not None and item["prior_units"] > 0
        assert item["revenue_growth_pct"] is not None
        assert item["units_growth_pct"] is not None
        # Verify formula: ((curr - prior) / prior) * 100
        expected_rev_growth = round(((item["current_revenue"] - item["prior_revenue"]) / item["prior_revenue"]) * 100.0, 2)
        assert abs(item["revenue_growth_pct"] - expected_rev_growth) < 0.05, f"Rev growth formula mismatch: {item['revenue_growth_pct']} vs {expected_rev_growth}"
        expected_unit_growth = round(((item["current_units"] - item["prior_units"]) / item["prior_units"]) * 100.0, 2)
        assert abs(item["units_growth_pct"] - expected_unit_growth) < 0.05, f"Units growth formula mismatch: {item['units_growth_pct']} vs {expected_unit_growth}"
        # Verify no mock 11.11 or 8.70
        assert item["revenue_growth_pct"] != 11.11, "Mock 11.11% detected!"
        assert item["units_growth_pct"] != 8.70, "Mock 8.70% detected!"
    print(">>> August 2025 test PASSED: Real July → August growth verified!")

    # 3. Test September 2025 (month=2025-09) -> August to September
    print("\n--- 3. Testing /api/v1/category/growth?month=2025-09 ---")
    r = requests.get(BASE_URL, params={"month": "2025-09", "limit": 5})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    items = r.json()["data"]
    print(f"Items returned: {len(items)}")
    for item in items:
        print(f"Dept: {item['department']} | Div: {item['division']} | Month: {item['month']}")
        print(f"  Current Rev: ₹{item['current_revenue']:,.2f}, Prior Rev: ₹{item['prior_revenue']:,.2f}, Rev Growth %: {item['revenue_growth_pct']}%")
        print(f"  Current Units: {item['current_units']}, Prior Units: {item['prior_units']}, Units Growth %: {item['units_growth_pct']}%")
        assert item["month"] == "2025-09"
        assert item["prior_revenue"] is not None and item["prior_revenue"] > 0
        assert item["prior_units"] is not None and item["prior_units"] > 0
        assert item["revenue_growth_pct"] is not None
        assert item["units_growth_pct"] is not None
        expected_rev_growth = round(((item["current_revenue"] - item["prior_revenue"]) / item["prior_revenue"]) * 100.0, 2)
        assert abs(item["revenue_growth_pct"] - expected_rev_growth) < 0.05
        assert item["revenue_growth_pct"] != 11.11
        assert item["units_growth_pct"] != 8.70
    print(">>> September 2025 test PASSED: Real August → September growth verified!")

    # 4. Test default when month is omitted
    print("\n--- 4. Testing /api/v1/category/growth (month omitted, defaults to latest) ---")
    r = requests.get(BASE_URL, params={"limit": 5})
    assert r.status_code == 200
    items = r.json()["data"]
    assert len(items) > 0
    assert items[0]["month"] == "2025-09", f"Expected default month 2025-09, got {items[0]['month']}"
    print(f">>> Default month test PASSED: Correctly defaulted to {items[0]['month']}!")

    # 5. Test invalid month validation (e.g. month=2025-01)
    print("\n--- 5. Testing /api/v1/category/growth?month=2025-01 (invalid month) ---")
    r = requests.get(BASE_URL, params={"month": "2025-01"})
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"HTTP Status: {r.status_code}, Detail: {r.json().get('detail')}")
    print(">>> Invalid month test PASSED: Correctly rejected non-existent month!")

    # 6. Verify source code has no mock numbers or ABS()
    print("\n--- 6. Verifying endpoint code integrity ---")
    with open("backend/app/api/v1/endpoints/category.py", "r", encoding="utf-8") as f:
        code = f.read()
    # Check that in get_category_growth, no 0.9, 0.92, 11.11, 8.70 or ABS()
    growth_func = code[code.find("def get_category_growth"):]
    assert "* 0.9" not in growth_func, "Found '* 0.9' in get_category_growth!"
    assert "* 0.92" not in growth_func, "Found '* 0.92' in get_category_growth!"
    assert "11.11" not in growth_func, "Found '11.11' in get_category_growth!"
    assert "8.70" not in growth_func, "Found '8.70' in get_category_growth!"
    assert "ABS(" not in growth_func.upper(), "Found ABS() in get_category_growth!"
    print(">>> Code integrity PASSED: No mock values and zero ABS() in get_category_growth!")

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_category_growth()
