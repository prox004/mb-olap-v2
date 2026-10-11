import sys
import io
import json
import os
sys.path.insert(0, os.path.abspath("."))
from backend.app.main import app
from fastapi.testclient import TestClient

# Fix Windows console UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = TestClient(app)
BASE_URL = "/api/v1/chat/query"

CATEGORIES = [
    {
        "category": "A. Simple Lookup",
        "queries": [
            "What is total revenue?",
            "What are the top 10 items by units sold?",
            "What is the closing stock?"
        ]
    },
    {
        "category": "B. Filtered Analysis",
        "queries": [
            "What was Store 3 revenue in September?",
            "Show sales for Casual Shirts department.",
            "What is the stock of a particular SKU?"
        ]
    },
    {
        "category": "C. Comparison",
        "queries": [
            "Compare August and September revenue.",
            "Compare Store 1 and Store 3.",
            "Which store performed better?"
        ]
    },
    {
        "category": "D. Why / Root-Cause",
        "queries": [
            "Why did revenue fall in September compared with August?",
            "Why did Store 3 underperform?",
            "Why did a category decline?"
        ]
    },
    {
        "category": "E. Drill-Down",
        "queries": [
            "Which departments caused the decline?",
            "Which SKUs caused the department decline?"
        ]
    },
    {
        "category": "F. Trend",
        "queries": [
            "Show monthly revenue trend.",
            "Which month had the highest revenue?",
            "How did gross margin change?"
        ]
    },
    {
        "category": "G. Inventory",
        "queries": [
            "Which stores have low stock?",
            "What is weeks of cover?",
            "Which SKUs should be transferred?"
        ]
    },
    {
        "category": "H. Financial",
        "queries": [
            "What is GMROI by vendor?",
            "Which categories have the highest gross profit?",
            "What is the gross margin?"
        ]
    },
    {
        "category": "I. Multi-Metric",
        "queries": [
            "Which stores have high revenue but low margin?",
            "Show revenue, GP and margin for each store."
        ]
    },
    {
        "category": "J. Multi-Step Business Questions",
        "queries": [
            "Find the worst-performing store, identify its worst department, then identify the top 5 SKUs responsible.",
            "Find stores with excess inventory and recommend transfers."
        ]
    },
    {
        "category": "K. Ambiguous Questions",
        "queries": [
            "How are we doing?",
            "Which products are weak?",
            "What needs attention?"
        ]
    },
    {
        "category": "L. Unsupported Data Questions",
        "queries": [
            "What was vendor lead time?",
            "What was the exact transaction-level transfer history?",
            "What was the markdown percentage?"
        ]
    }
]

print("================================================================================")
print("RUNNING UNIVERSAL AGENTIC ARCHITECTURE VERIFICATION ACROSS ALL 13 CATEGORIES")
print("================================================================================")

summary_results = []

for cat in CATEGORIES:
    cat_name = cat["category"]
    print(f"\n--- {cat_name} ---")
    for q in cat["queries"]:
        payload = {"prompt": q}
        try:
            resp = client.post(BASE_URL, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                ch_sql = data.get("data", {}).get("generated_sql", "")
                supported = data.get("supported", True)
                rec_count = data.get("data", {}).get("record_count", 0)
                summary = data.get("data", {}).get("summary", "")[:120].replace("\n", " ")
                
                status_str = "PASS"
                if not supported:
                    status_str = "UNSUPPORTED (GROUNDED REJECTION)"
                
                print(f"  [Q] {q}")
                print(f"      Status: {status_str} | Rows: {rec_count} | SQL Lines: {len(ch_sql.splitlines())}")
                print(f"      Summary: {summary}...")
                
                summary_results.append({
                    "category": cat_name,
                    "query": q,
                    "status": "PASS",
                    "supported": supported,
                    "row_count": rec_count,
                    "sql_preview": ch_sql[:150]
                })
            else:
                print(f"  [FAIL] {q} -> HTTP {resp.status_code}: {resp.text[:100]}")
                summary_results.append({
                    "category": cat_name,
                    "query": q,
                    "status": "FAIL",
                    "error": resp.text[:100]
                })
        except Exception as e:
            print(f"  [ERROR] {q} -> {e}")
            summary_results.append({
                "category": cat_name,
                "query": q,
                "status": "ERROR",
                "error": str(e)
            })

# Multi-Turn Conversational Memory Test
print("\n--- M. Multi-Turn Follow-Up (Conversational Chain) ---")
turn_chain = [
    "Show me the worst store",
    "Why?",
    "Which department caused it?",
    "Which products caused that?"
]

history = []
for turn_idx, turn_prompt in enumerate(turn_chain, 1):
    turn_payload = {"prompt": turn_prompt, "conversation_history": history}
    resp = client.post(BASE_URL, json=turn_payload)
    data = resp.json()
    summary = data.get("data", {}).get("summary", "")
    gen_sql = data.get("data", {}).get("generated_sql", "")
    print(f"  Turn {turn_idx}: '{turn_prompt}'")
    print(f"    SQL Preview: {gen_sql[:100]}...")
    print(f"    Summary: {summary[:120].replace(chr(10), ' ')}...")
    history.append({"role": "user", "content": turn_prompt})
    history.append({"role": "assistant", "content": summary})

print("\n================================================================================")
print(f"VERIFICATION COMPLETE: {len(summary_results)} analytical queries tested across all 13 categories.")
print("================================================================================")
