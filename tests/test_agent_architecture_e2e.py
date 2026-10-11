import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from backend.db.clickhouse import get_clickhouse_connection
from backend.app.services.analytics_agent import analytics_agent, ConversationalAnalyticsAgent
from backend.app.services.recommendation_agent import recommendation_agent, RecommendationAgent
from backend.app.services.base_agent import BaseAnalyticsAgent
from backend.app.services.agent_tools import (
    execute_readonly_sql,
    get_schema,
    describe_object,
    inspect_result,
    AUTHORITATIVE_CLICKHOUSE_CATALOG,
    AUTHORITATIVE_BUSINESS_RULES,
)
from backend.app.services.groq_llm_service import groq_service


class TestUnifiedAgentArchitectureE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orig_emergency = getattr(settings, "ENABLE_EMERGENCY_FALLBACK", False)
        settings.ENABLE_EMERGENCY_FALLBACK = True
        cls.client = TestClient(app)
        cls.conn = get_clickhouse_connection()

    @classmethod
    def tearDownClass(cls):
        settings.ENABLE_EMERGENCY_FALLBACK = cls.orig_emergency
        cls.conn.close()

    def setUp(self):
        self.original_backend = settings.WAREHOUSE_BACKEND
        settings.WAREHOUSE_BACKEND = "clickhouse"

    def tearDown(self):
        settings.WAREHOUSE_BACKEND = self.original_backend

    # -------------------------------------------------------------------------
    # SHARED ARCHITECTURE & INHERITANCE VERIFICATION
    # -------------------------------------------------------------------------
    def test_00_shared_base_agent_architecture(self):
        """Verifies both Conversational & Recommendation Agents inherit from BaseAnalyticsAgent and share tools."""
        self.assertTrue(issubclass(ConversationalAnalyticsAgent, BaseAnalyticsAgent))
        self.assertTrue(issubclass(RecommendationAgent, BaseAnalyticsAgent))
        self.assertIsInstance(analytics_agent, BaseAnalyticsAgent)
        self.assertIsInstance(recommendation_agent, BaseAnalyticsAgent)

        # Authoritative catalog verification
        catalog = get_schema(self.conn)
        self.assertIn("v_fact_sales_enriched", catalog["authoritative_objects"])
        self.assertIn("v_fact_inventory_enriched", catalog["authoritative_objects"])
        self.assertEqual(len(catalog["authoritative_objects"]), 12)

        # Business rules availability
        self.assertIn("signed_sales", AUTHORITATIVE_BUSINESS_RULES)
        self.assertIn("no_vendor_returns", AUTHORITATIVE_BUSINESS_RULES)

    # -------------------------------------------------------------------------
    # CHAT / CONVERSATIONAL ANALYTICS SCENARIOS (1 to 10)
    # -------------------------------------------------------------------------
    def test_01_chat_total_revenue_query(self):
        """1. Total revenue query: tests natural language query against ClickHouse sales views."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "What was total revenue in September?"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertGreater(body["data"]["record_count"], 0)
        self.assertIn("v_fact_sales_enriched", body["data"]["generated_sql"])
        self.assertIn("net_revenue", [c.lower() for c in body["data"]["columns"]])

    def test_02_chat_monthly_comparison(self):
        """2. Monthly comparison: tests period-over-period trend analysis."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Compare revenue between August and September"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertGreaterEqual(body["data"]["record_count"], 2)
        self.assertIn("v_monthly_sales_trend", body["data"]["generated_sql"])

    def test_03_chat_store_comparison(self):
        """3. Store comparison: tests store outlet performance rankings."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Which stores had the highest revenue?"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertGreater(body["data"]["record_count"], 0)
        self.assertIn("store_name", [c.lower() for c in body["data"]["columns"]])

    def test_04_chat_category_comparison(self):
        """4. Category comparison: tests merchandise department and division breakdown."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Top 5 departments by sales revenue"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertEqual(body["data"]["record_count"], 5)
        self.assertIn("department", [c.lower() for c in body["data"]["columns"]])

    def test_05_chat_inventory_query(self):
        """5. Inventory query: tests inventory stock cover and SOH queries against ClickHouse."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Which departments have high inventory closing stock?"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertGreater(body["data"]["record_count"], 0)
        self.assertIn("v_fact_inventory_enriched", body["data"]["generated_sql"])

    def test_06_chat_multi_step_investigation(self):
        """6. Multi-step investigation: tests causal analysis executing trend -> store -> department drilldown."""
        agent_res = analytics_agent.run(self.conn, "Why did September revenue fall compared with August?")
        self.assertTrue(agent_res.plan.multi_step)
        self.assertGreaterEqual(agent_res.iterations, 2)
        self.assertGreaterEqual(len(agent_res.steps), 2)
        self.assertIn("-- Step 1:", agent_res.generated_sql)
        self.assertIn("-- Step 2:", agent_res.generated_sql)
        self.assertIn("Bhubaneswar", agent_res.summary)

    def test_07_chat_sql_error_recovery(self):
        """7. SQL error recovery: tests agent auto-correction loop on ClickHouse syntax/execution error."""
        broken_sql = "SELECT invalid_field_err FROM v_fact_sales_enriched"
        corrected_sql = "SELECT department, round(sum(net_amount), 2) AS net_revenue FROM v_fact_sales_enriched GROUP BY department ORDER BY net_revenue DESC LIMIT 3"

        with patch.object(groq_service, "refine_sql_error", return_value=corrected_sql):
            res = analytics_agent.execute_with_self_correction(
                self.conn, broken_sql, "Test error recovery", dialect="clickhouse"
            )
            self.assertTrue(res["success"])
            self.assertTrue(res.get("self_corrected", False))
            self.assertIn("department", res["columns"])

    def test_08_chat_empty_result(self):
        """8. Empty result: tests zero row inspection handling without crashing."""
        empty_sql = "SELECT * FROM v_fact_sales_enriched WHERE store_code = 'NONEXISTENT_XYZ_STORE'"
        res = execute_readonly_sql(self.conn, empty_sql)
        self.assertTrue(res["success"])
        self.assertEqual(res["row_count"], 0)

        inspection = inspect_result(res["data"], res["columns"])
        self.assertTrue(inspection["is_empty"])
        self.assertEqual(inspection["row_count"], 0)

    def test_09_chat_unsupported_metric(self):
        """9. Unsupported metric: tests truthful explanation for unavailable metrics like vendor fill rate."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "What was vendor fill rate?"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertFalse(body["supported"])
        self.assertIn("Vendor Fill Rate", body["data"]["summary"])
        self.assertEqual(body["data"]["record_count"], 0)

    def test_10_chat_follow_up_question(self):
        """10. Follow-up question: tests conversation context resolution across conversational turns."""
        history = [
            {"role": "user", "content": "What was total revenue in August?"},
            {"role": "assistant", "content": "Total revenue in August was ₹3,68,91,481.56."}
        ]
        res = self.client.post("/api/v1/chat/query", json={
            "prompt": "What about September?",
            "conversation_history": history
        })
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertIn("v_fact_sales_enriched", body["data"]["generated_sql"])
        self.assertTrue(any(k in body["data"]["generated_sql"] for k in ["Sep", "September"]))

    # -------------------------------------------------------------------------
    # RECOMMENDATION SCENARIOS (11 to 18)
    # -------------------------------------------------------------------------
    def test_11_recommendation_reorder(self):
        """11. Reorder: generates stockout replenishment recommendations grounded in ClickHouse inventory & sales."""
        items, meta = recommendation_agent.generate_recommendations(self.conn, category="REORDER", limit=5)
        self.assertTrue(meta["supported"])
        self.assertGreater(len(items), 0)
        for item in items:
            self.assertEqual(item.category, "REORDER")
            self.assertGreater(item.action_quantity, 0)
            self.assertGreater(item.estimated_financial_impact, 0.0)
            self.assertGreaterEqual(item.confidence_score, 75.0)

    def test_12_recommendation_transfer(self):
        """12. Transfer: generates lateral store rebalancing recommendations between surplus and deficit stores."""
        items, meta = recommendation_agent.generate_recommendations(self.conn, category="TRANSFER", limit=5)
        self.assertTrue(meta["supported"])
        self.assertGreater(len(items), 0)
        for item in items:
            self.assertEqual(item.category, "TRANSFER")
            self.assertIsNotNone(item.source_store_name)
            self.assertIsNotNone(item.target_store_name)
            self.assertNotEqual(item.source_store_name, item.target_store_name)

    def test_13_recommendation_unsupported_markdown(self):
        """13. Unsupported markdown: verifies explicit unsupported status without synthetic fabrication."""
        is_sup, msg = recommendation_agent.is_category_supported("MARKDOWN")
        self.assertFalse(is_sup)
        items, meta = recommendation_agent.generate_recommendations(self.conn, category="MARKDOWN")
        self.assertFalse(meta["supported"])
        self.assertEqual(len(items), 0)

    def test_14_recommendation_empty_candidate_set(self):
        """14. Empty candidate set: verifies zero recommendations and zero hallucinations for unknown filters."""
        items, meta = recommendation_agent.generate_recommendations(
            self.conn, department="NONEXISTENT_DEPT_FILTER_XYZ"
        )
        self.assertTrue(meta["supported"])
        self.assertEqual(len(items), 0)
        self.assertEqual(meta["total_count"], 0)

    def test_15_recommendation_evidence(self):
        """15. Recommendation evidence: validates evidence completeness on generated recommendations."""
        items, _ = recommendation_agent.generate_recommendations(self.conn, limit=5)
        for it in items:
            self.assertTrue(len(it.barcode) > 0)
            self.assertTrue(len(it.title) > 0)
            self.assertIn(it.category, ["REORDER", "TRANSFER"])
            self.assertGreater(it.action_quantity, 0)
            self.assertGreater(it.estimated_financial_impact, 0.0)
            self.assertTrue(len(it.message) > 0)

    def test_16_recommendation_summary_endpoint(self):
        """16. Summary endpoint: verifies GET /api/v1/recommendations/summary."""
        res = self.client.get("/api/v1/recommendations/summary")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        data = body["data"]
        self.assertGreater(data["total_recommendations"], 0)
        self.assertEqual(data["markdown_count"], 0)
        self.assertGreater(data["avg_confidence_score"], 70.0)
        self.assertGreater(data["total_financial_impact"], 0.0)

    def test_17_recommendation_feed_endpoint(self):
        """17. Feed endpoint: verifies GET /api/v1/recommendations/feed with pagination and category filter."""
        res = self.client.get("/api/v1/recommendations/feed?limit=10")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertGreater(len(body["data"]), 0)

    def test_18_recommendation_apply_action_endpoint(self):
        """18. Apply-action endpoint: verifies POST /api/v1/recommendations/apply-action creates simulated order reference."""
        payload = {
            "recommendation_id": "REORDER-R174936-103",
            "barcode": "R174936",
            "action_type": "REORDER",
            "action_quantity": 25
        }
        res = self.client.post("/api/v1/recommendations/apply-action", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["data"]["order_reference"].startswith("AI-REO-"))


if __name__ == "__main__":
    unittest.main()
