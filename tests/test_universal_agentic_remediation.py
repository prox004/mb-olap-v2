import unittest
from typing import Dict, Any, List
from unittest.mock import patch

from backend.app.api.deps import get_clickhouse_db
from backend.app.services.analytics_agent import analytics_agent, AgentExecutionResult
from backend.app.services.agent_tools import (
    get_schema,
    describe_object,
    semantic_lookup,
    search_entities,
    execute_sub_analysis,
    execute_readonly_sql,
    inspect_result,
)
from backend.app.services.groq_llm_service import groq_service
from backend.app.main import app
from fastapi.testclient import TestClient


class TestUniversalAgenticRemediation(unittest.TestCase):
    """
    Comprehensive tests proving genuine universal agentic architecture:
      1. Dynamic tool dispatching across all 7 tools
      2. True result-driven follow-up (Query 1 result determines Query 2)
      3. Multi-turn conversational memory across 4+ turns
      4. Dynamic entity resolution without fragile regex
      5. Universal analytical categories (Inventory, Financial, Causal, Multi-metric, Multi-step)
      6. Safe error recovery without comment hacks
      7. Truthful unsupported data handling
    """

    @classmethod
    def setUpClass(cls):
        from backend.app.config import settings
        cls.orig_emergency = getattr(settings, "ENABLE_EMERGENCY_FALLBACK", False)
        settings.ENABLE_EMERGENCY_FALLBACK = True
        cls.client = TestClient(app)
        for db in get_clickhouse_db():
            cls.conn = db
            break

    @classmethod
    def tearDownClass(cls):
        from backend.app.config import settings
        settings.ENABLE_EMERGENCY_FALLBACK = cls.orig_emergency

    # -------------------------------------------------------------------------
    # 1. DYNAMIC TOOL SUITE VERIFICATION
    # -------------------------------------------------------------------------
    def test_01_tool_semantic_lookup(self):
        """Verifies semantic_lookup retrieves definitions and governance rules from Wren MDL."""
        res_gmroi = semantic_lookup("gmroi")
        self.assertTrue(res_gmroi["success"])
        self.assertGreater(len(res_gmroi["metrics"]), 0)
        self.assertIn("gmroi", res_gmroi["metrics"][0]["name"].lower())

        res_woc = semantic_lookup("weeks_of_cover")
        self.assertTrue(res_woc["success"])
        self.assertGreater(len(res_woc["metrics"]), 0)

        res_sales = semantic_lookup("signed_sales")
        self.assertTrue(res_sales["success"])
        self.assertGreater(len(res_sales["business_rules"]), 0)

    def test_02_tool_search_entities(self):
        """Verifies dynamic entity resolution against ClickHouse dimensions without fragile regex."""
        # Store ordinal resolution
        res_store3 = search_entities(self.conn, "Store 3")
        self.assertTrue(res_store3["success"])
        self.assertGreater(len(res_store3["matches"]), 0)
        self.assertEqual(res_store3["matches"][0]["entity_type"], "store")

        # Store name resolution
        res_bbsr = search_entities(self.conn, "Bhubaneswar")
        self.assertTrue(res_bbsr["success"])
        self.assertIn("Bhubaneswar", res_bbsr["matches"][0]["canonical_name"])

        # Department resolution
        res_dept = search_entities(self.conn, "Casual Shirts")
        self.assertTrue(res_dept["success"])
        self.assertIn("Casual Shirts", res_dept["matches"][0]["canonical_name"])

    def test_03_tool_execute_sub_analysis(self):
        """Verifies execute_sub_analysis executes dynamic dimensional aggregations."""
        # Store sub-analysis
        res_store = execute_sub_analysis(self.conn, dimension="store")
        self.assertTrue(res_store["success"])
        self.assertGreater(res_store["row_count"], 0)
        self.assertIn("store_name", res_store["columns"])

        # Department sub-analysis filtered by store
        res_dept = execute_sub_analysis(
            self.conn, dimension="department", filters={"store_name": "M Baazar - Bhubaneswar"}
        )
        self.assertTrue(res_dept["success"])
        self.assertGreater(res_dept["row_count"], 0)
        self.assertIn("department", res_dept["columns"])

        # SKU sub-analysis
        res_sku = execute_sub_analysis(
            self.conn, dimension="sku", filters={"department": "Casual Shirts"}, limit=5
        )
        self.assertTrue(res_sku["success"])
        self.assertGreater(res_sku["row_count"], 0)
        self.assertIn("item_code", res_sku["columns"])

    # -------------------------------------------------------------------------
    # 2. TRUE RESULT-DRIVEN MULTI-STEP AGENTIC BEHAVIOR
    # -------------------------------------------------------------------------
    def test_04_result_driven_followup_worst_store_to_sku(self):
        """
        CRITICAL TEST: Proves true agentic behavior where Query 1 result determines Query 2,
        and Query 2 result determines Query 3.
        Question: Find the worst-performing store, identify its worst department, then top 5 SKUs.
        """
        prompt = "Find the worst-performing store, identify its worst department, then identify the top 5 SKUs responsible"
        res = analytics_agent.run(self.conn, prompt)

        self.assertTrue(res.supported)
        self.assertTrue(res.plan.multi_step)
        self.assertGreaterEqual(len(res.steps), 3)

        # Step 1 should identify the worst store (M Baazar - Tezpur)
        step1 = res.steps[0]
        self.assertTrue(step1.success)
        self.assertIn("v_store_performance_summary", step1.query_or_target)
        self.assertIn("Tezpur", step1.data[0]["store_name"])

        # Step 2 MUST use Tezpur from Step 1's result
        step2 = res.steps[1]
        self.assertTrue(step2.success)
        self.assertIn("Tezpur", step2.query_or_target)
        self.assertIn("department", step2.columns)

        # Step 3 MUST use the department from Step 2's result
        step3 = res.steps[2]
        self.assertTrue(step3.success)
        self.assertIn("item_code", step3.columns)
        self.assertIn("Tezpur", step3.query_or_target)

        # Execution trace verification
        for s in res.steps:
            self.assertIsNotNone(s.decision_rationale)
            self.assertGreater(len(s.decision_rationale), 0)

    def test_05_inventory_rebalancing_multi_step(self):
        """Tests inventory surplus-deficit detection and lateral transfer recommendation sequence."""
        prompt = "Find stores with excess inventory and recommend transfers"
        res = analytics_agent.run(self.conn, prompt)

        self.assertTrue(res.supported)
        self.assertTrue(res.plan.multi_step)
        self.assertGreaterEqual(len(res.steps), 2)
        self.assertIn("v_fact_inventory_enriched", res.generated_sql)
        self.assertIn("Rebalance surplus", res.summary)

    # -------------------------------------------------------------------------
    # 3. MULTI-TURN CONVERSATIONAL MEMORY & ANAPHORA
    # -------------------------------------------------------------------------
    def test_06_multi_turn_conversational_chain(self):
        """
        Tests multi-turn context carry-over across 4 consecutive turns:
          Turn 1: "Show me the worst store." -> Tezpur
          Turn 2: "Why?" -> understands Tezpur performance
          Turn 3: "Which department caused it?" -> Tezpur departments
          Turn 4: "Which products caused that?" -> products in that department
        """
        # Turn 1
        t1_res = self.client.post("/api/v1/chat/query", json={"prompt": "Show me the worst store"}).json()
        self.assertTrue(t1_res["success"])
        self.assertIn("Tezpur", t1_res["data"]["summary"])

        history = [
            {"role": "user", "content": "Show me the worst store"},
            {"role": "assistant", "content": t1_res["data"]["summary"]}
        ]

        # Turn 2: "Why?"
        t2_res = self.client.post("/api/v1/chat/query", json={"prompt": "Why?", "conversation_history": history}).json()
        self.assertTrue(t2_res["success"])
        self.assertIn("Tezpur", t2_res["data"]["generated_sql"])

        history.extend([
            {"role": "user", "content": "Why?"},
            {"role": "assistant", "content": t2_res["data"]["summary"]}
        ])

        # Turn 3: "Which department caused it?"
        t3_res = self.client.post("/api/v1/chat/query", json={"prompt": "Which department caused it?", "conversation_history": history}).json()
        self.assertTrue(t3_res["success"])
        self.assertIn("Tezpur", t3_res["data"]["generated_sql"])
        self.assertIn("department", [c.lower() for c in t3_res["data"]["columns"]])

        history.extend([
            {"role": "user", "content": "Which department caused it?"},
            {"role": "assistant", "content": t3_res["data"]["summary"]}
        ])

        # Turn 4: "Which products caused that?"
        t4_res = self.client.post("/api/v1/chat/query", json={"prompt": "Which products caused that?", "conversation_history": history}).json()
        self.assertTrue(t4_res["success"])
        self.assertIn("item_code", [c.lower() for c in t4_res["data"]["columns"]])

    # -------------------------------------------------------------------------
    # 4. UNIVERSAL ANALYTICAL CATEGORIES
    # -------------------------------------------------------------------------
    def test_07_category_simple_lookup(self):
        """Category A: Simple lookup - closing stock."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "What is the closing stock?"}).json()
        self.assertTrue(res["success"])
        self.assertIn("closing_units", [c.lower() for c in res["data"]["columns"]])

    def test_08_category_financial_gmroi(self):
        """Category H: Financial questions - GMROI by vendor."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "What is GMROI by vendor?"}).json()
        self.assertTrue(res["success"])
        self.assertIn("v_vendor_scorecard", res["data"]["generated_sql"])
        self.assertIn("gmroi", [c.lower() for c in res["data"]["columns"]])

    def test_09_category_inventory_woc(self):
        """Category G: Inventory - stores with low stock."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Which stores have low stock?"}).json()
        self.assertTrue(res["success"])
        self.assertIn("v_fact_inventory_enriched", res["data"]["generated_sql"])
        self.assertIn("store_name", [c.lower() for c in res["data"]["columns"]])

    def test_10_category_multi_metric(self):
        """Category I: Multi-metric - revenue and gross margin by store."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Show revenue, GP and margin for each store"}).json()
        self.assertTrue(res["success"])
        cols = [c.lower() for c in res["data"]["columns"]]
        self.assertTrue(any("revenue" in c for c in cols))
        self.assertTrue(any("margin" in c or "profit" in c for c in cols))

    def test_11_category_unsupported_data_no_fabrication(self):
        """Category L: Unsupported data - vendor lead time."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "What was vendor lead time?"}).json()
        self.assertTrue(res["success"])
        self.assertFalse(res["supported"])
        self.assertIn("Vendor Fill Rate & Supplier Lead Times is unavailable", res["data"]["summary"])
        self.assertEqual(res["data"]["record_count"], 0)

    def test_12_error_recovery_no_comment_hacks(self):
        """Verifies error handling terminates safely without inserting /* retry_1 */ comment hacks."""
        broken_sql = "SELECT unrecoverable_syntax_xyz FROM v_fact_sales_enriched"
        with patch.object(groq_service, "refine_sql_error", return_value=broken_sql):
            with patch.object(groq_service, "generate_sql", return_value=broken_sql):
                res = analytics_agent.run(self.conn, "Query that fails")
                self.assertNotIn("/* retry_", res.generated_sql)
                self.assertEqual(res.iterations, analytics_agent.MAX_ITERATIONS)


if __name__ == "__main__":
    unittest.main()
