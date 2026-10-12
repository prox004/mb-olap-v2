import os
import sys
import unittest

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.analytics_agent import analytics_agent
from backend.db.clickhouse import get_clickhouse_connection

def run_multi_turn_test():
    print("=" * 80)
    print("TESTING SECTION 12: NATURAL MULTI-TURN CONVERSATION MEMORY")
    print("=" * 80)
    
    db = get_clickhouse_connection()
    history = []
    
    # Turn 1: "Which store is doing worst?"
    q1 = "Which store is doing worst?"
    res1 = analytics_agent.run(db, user_prompt=q1, conversation_history=history, allow_emergency_fallback=True)
    print(f"\nTurn 1 User: {q1}")
    print(f"Turn 1 SQL:\n{res1.generated_sql}")
    print(f"Turn 1 Summary: {res1.summary}")
    history.append({"role": "user", "content": q1})
    history.append({"role": "assistant", "content": res1.summary})
    
    # Turn 2: "Why?"
    q2 = "Why?"
    res2 = analytics_agent.run(db, user_prompt=q2, conversation_history=history, allow_emergency_fallback=True)
    print(f"\nTurn 2 User: {q2}")
    print(f"Turn 2 SQL:\n{res2.generated_sql}")
    print(f"Turn 2 Summary: {res2.summary}")
    history.append({"role": "user", "content": q2})
    history.append({"role": "assistant", "content": res2.summary})
    
    # Turn 3: "What about its inventory?"
    q3 = "What about its inventory?"
    res3 = analytics_agent.run(db, user_prompt=q3, conversation_history=history, allow_emergency_fallback=True)
    print(f"\nTurn 3 User: {q3}")
    print(f"Turn 3 SQL:\n{res3.generated_sql}")
    print(f"Turn 3 Summary: {res3.summary}")
    history.append({"role": "user", "content": q3})
    history.append({"role": "assistant", "content": res3.summary})
    
    # Turn 4: "Which products are causing the problem?"
    q4 = "Which products are causing the problem?"
    res4 = analytics_agent.run(db, user_prompt=q4, conversation_history=history, allow_emergency_fallback=True)
    print(f"\nTurn 4 User: {q4}")
    print(f"Turn 4 SQL:\n{res4.generated_sql}")
    print(f"Turn 4 Summary: {res4.summary}")
    
    # Verifications
    assert "Tezpur" in res1.summary or "Tezpur" in res1.generated_sql, "Turn 1 should identify worst store (Tezpur)"
    assert "Tezpur" in res2.generated_sql or "Tezpur" in res2.summary, "Turn 2 ('Why?') must carry over Tezpur context"
    assert "v_fact_inventory_enriched" in res3.generated_sql, "Turn 3 must target inventory for the carried-over store"
    assert "Tezpur" in res3.generated_sql, "Turn 3 must filter by Tezpur"
    assert "v_fact_sales_enriched" in res4.generated_sql, "Turn 4 must target product level sales"
    assert "Tezpur" in res4.generated_sql, "Turn 4 must preserve Tezpur context"
    
    print("\n✅ ALL 4 MULTI-TURN STEPS PASSED WITH NATURAL PRONOUN / ANAPHORA RESOLUTION!")

if __name__ == "__main__":
    run_multi_turn_test()
