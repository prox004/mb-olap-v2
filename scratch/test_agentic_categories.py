import urllib.request
import json
import time

test_questions = [
    # A. SIMPLE LOOKUP
    {"cat": "A. SIMPLE LOOKUP", "prompt": "What is total revenue?"},
    {"cat": "A. SIMPLE LOOKUP", "prompt": "What are the top 10 items by units sold?"},
    {"cat": "A. SIMPLE LOOKUP", "prompt": "What is the closing stock?"},

    # B. FILTERED ANALYSIS
    {"cat": "B. FILTERED ANALYSIS", "prompt": "What was Bhubaneswar store revenue in September?"},
    {"cat": "B. FILTERED ANALYSIS", "prompt": "Show sales for T Shirts department"},
    {"cat": "B. FILTERED ANALYSIS", "prompt": "What is the stock of item 100000010?"},

    # C. COMPARISON
    {"cat": "C. COMPARISON", "prompt": "Compare August and September revenue"},
    {"cat": "C. COMPARISON", "prompt": "Compare Bhubaneswar and Gariahat store performance"},
    {"cat": "C. COMPARISON", "prompt": "Which store performed better between Bhubaneswar and Gariahat?"},

    # D. WHY / ROOT-CAUSE
    {"cat": "D. WHY / ROOT-CAUSE", "prompt": "Why did revenue fall in September compared with August?"},
    {"cat": "D. WHY / ROOT-CAUSE", "prompt": "Why did Gariahat store underperform?"},
    {"cat": "D. WHY / ROOT-CAUSE", "prompt": "Why did Casual Shirts category decline?"},

    # E. DRILL-DOWN QUESTIONS
    {"cat": "E. DRILL-DOWN", "prompt": "Which departments caused the revenue decline in September?"},
    {"cat": "E. DRILL-DOWN", "prompt": "Which SKUs caused the Casual Shirts department decline?"},

    # F. TREND QUESTIONS
    {"cat": "F. TREND", "prompt": "Show monthly revenue trend"},
    {"cat": "F. TREND", "prompt": "Which month had the highest revenue?"},
    {"cat": "F. TREND", "prompt": "How did gross margin change over time?"},

    # G. INVENTORY QUESTIONS
    {"cat": "G. INVENTORY", "prompt": "Which stores have low stock?"},
    {"cat": "G. INVENTORY", "prompt": "What is weeks of cover by department?"},
    {"cat": "G. INVENTORY", "prompt": "Which SKUs should be transferred?"},

    # H. FINANCIAL QUESTIONS
    {"cat": "H. FINANCIAL", "prompt": "What is GMROI by vendor?"},
    {"cat": "H. FINANCIAL", "prompt": "Which categories have the highest gross profit?"},
    {"cat": "H. FINANCIAL", "prompt": "What is the gross margin by division?"},

    # I. MULTI-METRIC QUESTIONS
    {"cat": "I. MULTI-METRIC", "prompt": "Which stores have high revenue but low margin?"},
    {"cat": "I. MULTI-METRIC", "prompt": "Show revenue, gross profit and margin for each store"},

    # J. MULTI-STEP BUSINESS QUESTIONS
    {"cat": "J. MULTI-STEP", "prompt": "Find the worst-performing store, identify its worst department, then identify the top 5 SKUs responsible"},
    {"cat": "J. MULTI-STEP", "prompt": "Find stores with excess inventory and recommend possible transfers"},

    # K. AMBIGUOUS QUESTIONS
    {"cat": "K. AMBIGUOUS", "prompt": "How are we doing?"},
    {"cat": "K. AMBIGUOUS", "prompt": "Which products are weak?"},
    {"cat": "K. AMBIGUOUS", "prompt": "What needs attention?"},

    # L. UNSUPPORTED DATA QUESTIONS
    {"cat": "L. UNSUPPORTED", "prompt": "What was vendor lead time?"},
    {"cat": "L. UNSUPPORTED", "prompt": "What was the exact transaction-level transfer history?"},
    {"cat": "L. UNSUPPORTED", "prompt": "What was the customer retention rate and loyalty churn?"}
]

print(f"=== TESTING {len(test_questions)} QUESTIONS ACROSS 12 CATEGORIES ===")
results = []

for idx, q in enumerate(test_questions, 1):
    payload = json.dumps({"prompt": q["prompt"]}).encode()
    req = urllib.request.Request(
        "http://localhost:8000/api/v1/chat/query",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req) as resp:
            elapsed = time.time() - t0
            data = json.loads(resp.read().decode())
            chat_data = data.get("data", {})
            supported = data.get("supported", True)
            sql = chat_data.get("generated_sql", "")
            rec_count = chat_data.get("record_count", 0)
            viz = chat_data.get("visualization_type", "")
            summary = chat_data.get("summary", "")
            results.append({
                "index": idx,
                "cat": q["cat"],
                "prompt": q["prompt"],
                "status": "HTTP 200",
                "supported": supported,
                "record_count": rec_count,
                "viz": viz,
                "sql": sql,
                "summary": summary[:120] + "..." if len(summary) > 120 else summary,
                "elapsed": round(elapsed, 2)
            })
            print(f"[{idx:02d}/{len(test_questions):02d}] {q['cat']} | \"{q['prompt']}\" -> OK ({elapsed:.2f}s) | recs: {rec_count} | sup: {supported}")
    except Exception as e:
        results.append({
            "index": idx,
            "cat": q["cat"],
            "prompt": q["prompt"],
            "status": f"ERROR: {e}",
            "supported": False,
            "record_count": 0,
            "viz": "",
            "sql": "",
            "summary": "",
            "elapsed": 0.0
        })
        print(f"[{idx:02d}/{len(test_questions):02d}] {q['cat']} | \"{q['prompt']}\" -> FAILED: {e}")

with open("scratch/agentic_audit_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\nAudit test execution completed. Results saved to scratch/agentic_audit_results.json")
