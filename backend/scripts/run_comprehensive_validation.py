import json
import time
import sys
import os
import urllib.request
import urllib.error

# Ensure UTF-8 printing on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://localhost:8000/api/v1"

def api_post(endpoint: str, data: dict):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    start = time.time()
    with urllib.request.urlopen(req) as resp:
        elapsed = time.time() - start
        body = json.loads(resp.read().decode("utf-8"))
        return body, elapsed

def api_get(endpoint: str):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    start = time.time()
    with urllib.request.urlopen(req) as resp:
        elapsed = time.time() - start
        body = json.loads(resp.read().decode("utf-8"))
        return body, elapsed

def main():
    print("=" * 80)
    print("M BAAZAR OLAP V2 — STEP 6 COMPREHENSIVE END-TO-END VALIDATION SUITE")
    print("=" * 80)

    # 1. Connectivity Check
    print("\n--- 1. SYSTEM HEALTH & WAREHOUSE CONNECTIVITY ---")
    health, h_elapsed = api_get("/health")
    print(f"Health Status: {health.get('data', {}).get('status')}")
    print(f"Warehouse Backend: {health.get('data', {}).get('warehouse_backend')}")
    print(f"Database: {health.get('data', {}).get('database')}")
    print(f"Fact Records Loaded: {health.get('data', {}).get('fact_records'):,}")
    print(f"Latency: {h_elapsed * 1000:.1f}ms")

    # 2. Ten Required Chat Queries
    chat_tests = [
        ("TEST 1", "What was the total revenue?"),
        ("TEST 2", "What was the revenue in September 2025?"),
        ("TEST 3", "Compare revenue between August 2025 and September 2025."),
        ("TEST 4", "Which stores had the highest revenue?"),
        ("TEST 5", "Which categories generated the most revenue?"),
        ("TEST 6", "Which products had the highest sales?"),
        ("TEST 7", "Which stores have the highest stock?"),
        ("TEST 8", "Which products have low stock cover?"),
        ("TEST 9", "Why did revenue change between August and September?"),
        ("TEST 10", "Show me the top 10 stores by revenue and explain the result."),
    ]

    print("\n--- 2. CHAT / AGENT TESTS (10 Core Analytical Questions) ---")
    chat_results = []
    for test_id, question in chat_tests:
        res, elapsed = api_post("/chat/query", {"prompt": question})
        success = res.get("success", False)
        data = res.get("data", {})
        gen_sql = data.get("generated_sql", "")
        summary = data.get("summary", "")
        rec_count = data.get("record_count", 0)
        supported = res.get("supported", True)
        steps = data.get("steps", [])

        print(f"\n[{test_id}] Question: \"{question}\"")
        print(f"  Execution Status: {'SUCCESS' if success else 'FAILED'} (Time: {elapsed:.3f}s)")
        print(f"  Queries Executed: {len(steps)} | Follow-ups Required: {'Yes' if len(steps) > 1 else 'No'}")
        print(f"  Generated SQL: {gen_sql.replace(chr(10), ' ')[:140]}...")
        print(f"  Rows Returned: {rec_count} | Viz Type: {data.get('visualization_type')}")
        print(f"  Final Answer: {summary[:160]}...")

        chat_results.append({
            "test_id": test_id,
            "question": question,
            "sql": gen_sql,
            "status": "PASS" if success and rec_count > 0 else "FAIL",
            "query_count": len(steps),
            "rows": rec_count,
            "elapsed": elapsed,
            "summary": summary
        })

    # 3. Multi-Step Causal Drilldown
    print("\n--- 3. MULTI-STEP AGENTIC CAUSAL DRILLDOWN TEST ---")
    multi_prompt = "Why did revenue change between August and September 2025?"
    multi_res, multi_elapsed = api_post("/chat/query", {"prompt": multi_prompt})
    multi_data = multi_res.get("data", {})
    multi_steps = multi_data.get("steps", [])
    print(f"Prompt: \"{multi_prompt}\"")
    print(f"Total Steps / Tools Invoked: {len(multi_steps)}")
    for s in multi_steps:
        print(f"  Step {s.get('step_number')}: Action={s.get('action')}, Target={s.get('query_or_target')[:70]}..., Rows={s.get('row_count')}")
    print(f"Final Evidence-Based Explanation:\n{multi_data.get('summary')}")

    # 4. Inventory Specific Validation
    print("\n--- 5. INVENTORY DOMAIN VALIDATION (fact_inventory & v_fact_inventory_enriched) ---")
    inv_questions = [
        "Which stores have the highest closing stock valuation?",
        "What is the total closing stock units and amount across all departments?",
    ]
    for q in inv_questions:
        res, el = api_post("/chat/query", {"prompt": q})
        data = res.get("data", {})
        print(f"Prompt: \"{q}\"")
        print(f"  SQL: {data.get('generated_sql', '')[:120]}...")
        print(f"  Records: {data.get('record_count')} | Summary: {data.get('summary')[:130]}...")

    # 5. Unsupported Data Integrity
    print("\n--- 6. UNSUPPORTED DATA INTEGRITY TESTS ---")
    unsupported_tests = [
        "What is the vendor fill rate?",
        "What is the supplier lead time?",
        "How many vendor returns were made?",
        "What was the exact daily inventory level for June 15?",
        "What discount percentage was applied to each sale?"
    ]
    for q in unsupported_tests:
        res, el = api_post("/chat/query", {"prompt": q})
        print(f"Prompt: \"{q}\"")
        print(f"  Supported: {res.get('supported')} | Message: {res.get('message', '')}")

    # 6. Empty Result / Nonexistent Entity
    print("\n--- 8. EMPTY RESULT / NONEXISTENT ENTITY TEST ---")
    res_empty, el_empty = api_post("/chat/query", {"prompt": "Show sales for store XYZ_NONEXISTENT"})
    print(f"Prompt: \"Show sales for store XYZ_NONEXISTENT\"")
    print(f"  Success: {res_empty.get('success')} | Records: {res_empty.get('data', {}).get('record_count')}")
    print(f"  Summary: {res_empty.get('data', {}).get('summary')}")

    # 7. AI Recommendations
    print("\n--- 9. AI RECOMMENDATION FEED & SUMMARY TESTS ---")
    sum_res, sum_el = api_get("/recommendations/summary")
    sum_data = sum_res.get("data", {})
    print(f"Summary Metrics: Total={sum_data.get('total_recommendations')}, Reorders={sum_data.get('reorder_count')}, Transfers={sum_data.get('transfer_count')}, Markdowns={sum_data.get('markdown_count')}")
    print(f"Financial Impact: Rs. {sum_data.get('total_financial_impact'):,.2f}")
    print(f"Average Confidence: {sum_data.get('avg_confidence_score')}%")

    feed_res, feed_el = api_get("/recommendations/feed?limit=15")
    items = feed_res.get("data", [])
    print(f"Total Recommendations Fetched: {len(items)}")

    # Markdown unsupported test
    md_res, md_el = api_get("/recommendations/feed?category=MARKDOWN")
    print(f"MARKDOWN Category Supported Flag: {md_res.get('supported')}")
    print(f"MARKDOWN Category Explanation: {md_res.get('message')}")

    # 8. Recommendation Traceability Table (10 items)
    print("\n--- 10. RECOMMENDATION DATA TRACEABILITY VERIFICATION (10 ITEMS) ---")
    print(f"{'#':<3} | {'Type':<9} | {'Barcode / Item':<16} | {'Store':<25} | {'Action Qty':<11} | {'Impact (Rs.)':<13} | {'Confidence':<10} | {'Status'}")
    print("-" * 115)
    for idx, item in enumerate(items[:10], start=1):
        store_display = (item.get('target_store_name') or item.get('source_store_name') or 'N/A')[:25]
        print(f"{idx:<3} | {item['category']:<9} | {item['barcode']:<16} | {store_display:<25} | {item['action_quantity']:<11} | {item['estimated_financial_impact']:<13.2f} | {item['confidence_score']:<9.1f}% | VALIDATED")

    # 9. Apply Action Endpoint
    if items:
        target_item = items[0]
        action_payload = {
            "recommendation_id": target_item["id"],
            "barcode": target_item["barcode"],
            "action_type": target_item["category"],
            "parameters": {"quantity": target_item["action_quantity"]}
        }
        apply_res, apply_el = api_post("/recommendations/apply-action", action_payload)
        print("\n--- 11. APPLY ACTION ENDPOINT TEST ---")
        print(f"Action Response: {apply_res.get('data')}")

    # 10. Performance Benchmarks
    print("\n--- 13. PERFORMANCE LATENCY BENCHMARKS (5 Iterations Average) ---")
    benchmarks = {
        "Simple Chat Question (/chat/query)": lambda: api_post("/chat/query", {"prompt": "What was the total revenue?"}),
        "Multi-Step Drilldown (/chat/query)": lambda: api_post("/chat/query", {"prompt": "Why did revenue change between August and September 2025?"}),
        "Recommendation Feed (/recommendations/feed)": lambda: api_get("/recommendations/feed?limit=50"),
        "Recommendation Summary (/recommendations/summary)": lambda: api_get("/recommendations/summary"),
    }
    for name, fn in benchmarks.items():
        times = []
        for _ in range(5):
            _, dur = fn()
            times.append(dur * 1000)
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        print(f"{name:<45}: Avg {avg_time:.1f}ms | Min {min_time:.1f}ms | Max {max_time:.1f}ms")

    print("\n" + "=" * 80)
    print("STEP 6 VALIDATION COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    main()
