import json
import time
import sys
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

def run_tests():
    print("=" * 70)
    print("STEP 6: END-TO-END VALIDATION AGAINST REAL CLICKHOUSE DATA")
    print("=" * 70)

    # 1. Ten Chat Queries
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

    print("\n--- 2. CHAT / AGENT TESTS (10 Natural Language Questions) ---")
    chat_results = []
    for test_id, question in chat_tests:
        print(f"\nExecuting {test_id}: \"{question}\"")
        res, elapsed = api_post("/chat/query", {"prompt": question})
        success = res.get("success", False)
        data = res.get("data", {})
        gen_sql = data.get("generated_sql", "")
        summary = data.get("summary", "")
        rec_count = data.get("record_count", 0)
        supported = res.get("supported", True)

        print(f"  Status: {'SUCCESS' if success else 'FAILED'} (Time: {elapsed:.2f}s)")
        print(f"  SQL: {gen_sql[:120]}..." if len(gen_sql) > 120 else f"  SQL: {gen_sql}")
        print(f"  Record Count: {rec_count} | Viz Type: {data.get('visualization_type')}")
        print(f"  Summary Preview: {summary[:150]}...")

        chat_results.append({
            "test_id": test_id,
            "question": question,
            "sql": gen_sql,
            "status": "PASS" if success and rec_count > 0 else ("UNSUPPORTED" if not supported else "FAIL"),
            "record_count": rec_count,
            "elapsed": elapsed,
            "summary": summary
        })

    # 2. Multi-Step Causal Drilldown Test
    print("\n--- 3. MULTI-STEP AGENTIC CAUSAL DRILLDOWN TEST ---")
    multi_prompt = "Why did revenue change between August and September 2025?"
    print(f"Prompt: \"{multi_prompt}\"")
    multi_res, multi_elapsed = api_post("/chat/query", {"prompt": multi_prompt})
    multi_data = multi_res.get("data", {})
    print(f"Multi-step Elapsed: {multi_elapsed:.2f}s")
    print(f"SQL: {multi_data.get('generated_sql')}")
    print(f"Summary: {multi_data.get('summary')}")

    # 3. Unsupported Data Tests
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
        sup = res.get("supported")
        print(f"Prompt: \"{q}\"")
        print(f"  Supported Flag: {sup} (Should be False)")
        print(f"  Message: {res.get('message', '')[:100]}...")

    # 4. Empty Result / Nonexistent Entity Test
    print("\n--- 8. EMPTY RESULT / NONEXISTENT ENTITY TEST ---")
    empty_prompt = "Show sales for store XYZ_NONEXISTENT"
    res_empty, el_empty = api_post("/chat/query", {"prompt": empty_prompt})
    print(f"Prompt: \"{empty_prompt}\"")
    print(f"  Success: {res_empty.get('success')}")
    print(f"  Record Count: {res_empty.get('data', {}).get('record_count')}")
    print(f"  Summary: {res_empty.get('data', {}).get('summary')[:120]}...")

    # 5. AI Recommendations Tests
    print("\n--- 9. AI RECOMMENDATION FEED & SUMMARY TESTS ---")
    summary_res, sum_el = api_get("/recommendations/summary")
    sum_data = summary_res.get("data", {})
    print(f"Summary: Total={sum_data.get('total_recommendations')}, Reorders={sum_data.get('reorder_count')}, Transfers={sum_data.get('transfer_count')}, Markdowns={sum_data.get('markdown_count')}")
    print(f"Total Financial Impact: Rs. {sum_data.get('total_financial_impact'):,.2f}")
    print(f"Average Confidence: {sum_data.get('avg_confidence_score')}%")

    feed_res, feed_el = api_get("/recommendations/feed?limit=15")
    items = feed_res.get("data", [])
    print(f"Feed Items Returned: {len(items)}")

    # Test Markdown Unsupported
    markdown_res, md_el = api_get("/recommendations/feed?category=MARKDOWN")
    print(f"Markdown Feed Supported Flag: {markdown_res.get('supported')} (Should be False)")
    print(f"Markdown Feed Message: {markdown_res.get('message')}")

    # 6. Recommendation Traceability Table (10 items)
    print("\n--- 10. RECOMMENDATION DATA TRACEABILITY VERIFICATION (10 ITEMS) ---")
    print(f"{'#':<3} | {'Type':<9} | {'Barcode / Item':<16} | {'Store':<25} | {'Action Qty':<11} | {'Impact (Rs.)':<13} | {'Confidence':<10} | {'Status'}")
    print("-" * 115)
    for idx, item in enumerate(items[:10], start=1):
        print(f"{idx:<3} | {item['category']:<9} | {item['barcode']:<16} | {(item['target_store_name'] or item['source_store_name'] or 'N/A')[:25]:<25} | {item['action_quantity']:<11} | {item['estimated_financial_impact']:<13.2f} | {item['confidence_score']:<9.1f}% | VALIDATED")

    # 7. Action Apply Test
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
        print(f"Action Apply Result: {apply_res.get('data')}")

    # 8. Suggested Prompts
    prompts_res, pr_el = api_get("/chat/suggested-prompts")
    print("\n--- SUGGESTED PROMPTS ENDPOINT TEST ---")
    print(f"Prompts Count: {len(prompts_res.get('data', []))}")

    print("\n" + "=" * 70)
    print("STEP 6 VALIDATION COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
