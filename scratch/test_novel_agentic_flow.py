import os
import sys
import io
import json
from unittest.mock import patch, PropertyMock, MagicMock

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath("."))

from backend.db.clickhouse import get_clickhouse_connection
from backend.app.services.analytics_agent import analytics_agent
from backend.app.services.groq_llm_service import groq_service

conn = get_clickhouse_connection()
groq_service.client = MagicMock()

print("================================================================================")
print("TEST 1: NOVEL EXPLORATORY QUESTION -> MULTI-STEP INVESTIGATION")
print("Prompt: 'Where are we performing well but leaving money on the table?'")
print("================================================================================")

responses_chain_1 = [
    # Iteration 1 Action
    json.dumps({
        "thought": "To find where we are performing well but leaving money on the table, I should look for merchandise categories with high net sales volume but suboptimal gross margin percentages.",
        "action": "execute_readonly_sql",
        "action_input": {
            "sql": "SELECT department, total_sales_units, total_net_revenue, gross_margin_pct FROM v_category_performance_summary ORDER BY gross_margin_pct ASC LIMIT 5;"
        }
    }),
    # Iteration 2 Action (dependent on observation from iteration 1)
    json.dumps({
        "thought": "The query revealed that Casual Shirts generated over ₹47M in revenue, but its margin is only 26.4%, leaving significant gross profit unrealized compared to other categories. Now I will inspect the vendor-level GMROI for Casual Shirts to identify which suppliers are driving down profitability.",
        "action": "execute_readonly_sql",
        "action_input": {
            "sql": "SELECT vendor_name, net_revenue, gross_profit, margin_pct, return_rate_pct, vendor_score FROM v_vendor_scorecard ORDER BY net_revenue DESC LIMIT 5;"
        }
    }),
    # Iteration 3 Action (synthesis)
    json.dumps({
        "thought": "I now have concrete data: Casual Shirts generates high volume but suffers from low margins, driven by specific vendor return rates. I can synthesize a clear management recommendation.",
        "action": "synthesize_final_answer",
        "action_input": {
            "summary": "Analysis of high-volume / low-margin segments reveals that **Casual Shirts** generates substantial sales (₹47.3M across 139K units) but yields a compressed gross margin of only **26.4%** (compared to chain benchmark of ~38%). Reviewing vendor performance indicates high return rates in top suppliers erode net realization. Management should renegotiate supplier terms or adjust markdown timing for Casual Shirts to capture up to ₹5.5M in unrealized margin.",
            "visualization_type": "BAR_CHART"
        }
    })
]

with patch.object(groq_service, "_create_completion", side_effect=responses_chain_1):
    with patch.object(type(groq_service), "is_available", new_callable=PropertyMock, return_value=True):
        res1 = analytics_agent.run(conn, "Where are we performing well but leaving money on the table?")
        print(f"Supported: {res1.supported}")
        print(f"Iterations: {res1.iterations}")
        print(f"Steps Executed: {len(res1.steps)}")
        for idx, s in enumerate(res1.steps, 1):
            print(f"  Step {idx}: Action={s.action} | Rows={s.row_count}")
            print(f"    Rationale: {s.decision_rationale}")
        print(f"\nFinal Summary:\n{res1.summary}\n")

print("================================================================================")
print("TEST 2: NOVEL QUESTION -> AMBIGUITY DETECTION & CLARIFYING QUESTION")
print("Prompt: 'Compare performance'")
print("================================================================================")

responses_chain_2 = [
    json.dumps({
        "thought": "The user prompt 'Compare performance' is too ambiguous. It does not specify whether to compare stores, merchandise divisions, vendors, or monthly periods.",
        "action": "ask_clarification",
        "action_input": {
            "question": "Which dimension or entities would you like me to compare? I can compare specific stores (e.g., Bhubaneswar vs Silchar), time periods (e.g., August vs September), or merchandise categories."
        }
    })
]

with patch.object(groq_service, "_create_completion", side_effect=responses_chain_2):
    with patch.object(type(groq_service), "is_available", new_callable=PropertyMock, return_value=True):
        res2 = analytics_agent.run(conn, "Compare performance")
        print(f"Supported: {res2.supported}")
        print(f"Summary: {res2.summary}")
        print(f"Visualization: {res2.visualization_type}")
        print(f"Rows: {res2.record_count}")

print("================================================================================")
print("TEST 3: NOVEL QUESTION -> CROSS-DOMAIN SALES VS INVENTORY MISMATCH")
print("Prompt: 'Find stores where sales look healthy but inventory looks problematic.'")
print("================================================================================")

responses_chain_3 = [
    # Iteration 1: Store sales ranking
    json.dumps({
        "thought": "First, let's identify stores with strong sales revenue and healthy margins.",
        "action": "execute_readonly_sql",
        "action_input": {
            "sql": "SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct FROM v_store_performance_summary ORDER BY total_net_revenue DESC LIMIT 5;"
        }
    }),
    # Iteration 2: Check inventory coverage / weeks of cover for those top stores
    json.dumps({
        "thought": "Bhubaneswar is the top-performing store with ₹68.4M in sales. Now let's examine its stock levels and weeks of cover to see if stockouts are imminent.",
        "action": "execute_readonly_sql",
        "action_input": {
            "sql": "SELECT store_name, sum(closing_qty) AS closing_units, round(sum(closing_amt), 2) AS closing_val, sum(final_sale_qty) AS sales_units FROM v_fact_inventory_enriched WHERE store_name = 'M Baazar - Bhubaneswar' GROUP BY store_name;"
        }
    }),
    # Iteration 3: Synthesize mismatch
    json.dumps({
        "thought": "We see that Bhubaneswar has high sales velocity, but closing stock on hand is lean with only 3.2 weeks of cover. I can now synthesize the risk.",
        "action": "synthesize_final_answer",
        "action_input": {
            "summary": "Cross-domain audit identified an inventory replenishment risk at **M Baazar - Bhubaneswar**: while leading all outlets with ₹68.4M in net revenue (39.1% gross margin), its average weeks of cover has fallen to **3.2 weeks** with fast-depleting stock in key apparel lines. Without prioritized lateral transfers from surplus locations like Tezpur, high-velocity stockouts will constrain revenue growth.",
            "visualization_type": "KPI_CARD"
        }
    })
]

with patch.object(groq_service, "_create_completion", side_effect=responses_chain_3):
    with patch.object(type(groq_service), "is_available", new_callable=PropertyMock, return_value=True):
        res3 = analytics_agent.run(conn, "Find stores where sales look healthy but inventory looks problematic.")
        print(f"Supported: {res3.supported}")
        print(f"Iterations: {res3.iterations}")
        print(f"Steps: {len(res3.steps)}")
        for idx, s in enumerate(res3.steps, 1):
            print(f"  Step {idx}: Action={s.action} | Rows={s.row_count}")
            print(f"    Rationale: {s.decision_rationale}")
        print(f"\nFinal Summary:\n{res3.summary}\n")
