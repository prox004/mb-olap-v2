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
from backend.app.services.recommendation_agent import recommendation_agent, RecommendationAgent
from backend.app.services.agent_tools import execute_readonly_sql
from backend.app.services.groq_llm_service import groq_service


class TestRecommendationAgent(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.conn = get_clickhouse_connection()

    @classmethod
    def tearDownClass(cls):
        cls.conn.close()

    def setUp(self):
        self.original_backend = settings.WAREHOUSE_BACKEND
        settings.WAREHOUSE_BACKEND = "clickhouse"

    def tearDown(self):
        settings.WAREHOUSE_BACKEND = self.original_backend

    # -------------------------------------------------------------------------
    # A. REORDER recommendation
    # -------------------------------------------------------------------------
    def test_a_reorder_recommendation(self):
        """Test REORDER generation: validates stockout risk candidates against live ClickHouse data."""
        items, meta = recommendation_agent.generate_recommendations(self.conn, category="REORDER", limit=10)
        self.assertTrue(meta["supported"])
        self.assertGreater(len(items), 0)

        for item in items:
            self.assertEqual(item.category, "REORDER")
            self.assertTrue(item.id.startswith("REORDER-"))
            self.assertTrue(len(item.barcode) > 0)
            self.assertGreater(item.action_quantity, 0)
            self.assertGreater(item.estimated_financial_impact, 0.0)
            self.assertIn(item.priority, ["CRITICAL", "HIGH", "MEDIUM", "LOW"])
            self.assertGreaterEqual(item.confidence_score, 75.0)
            self.assertLessEqual(item.confidence_score, 100.0)
            self.assertIn("Stockout risk detected", item.message)
            self.assertIsNotNone(item.target_store_name)

        # Grounding check: verify top item exists in ClickHouse
        top_rec = items[0]
        chk_sql = f"SELECT count() FROM v_fact_inventory_enriched WHERE item_code = '{top_rec.barcode}'"
        chk_res = execute_readonly_sql(self.conn, chk_sql)
        self.assertTrue(chk_res["success"])
        self.assertGreater(chk_res["data"][0]["count()"], 0)

    # -------------------------------------------------------------------------
    # B. TRANSFER recommendation
    # -------------------------------------------------------------------------
    def test_b_transfer_recommendation(self):
        """Test TRANSFER generation: validates surplus-to-deficit rebalancing pairs against live ClickHouse data."""
        items, meta = recommendation_agent.generate_recommendations(self.conn, category="TRANSFER", limit=10)
        self.assertTrue(meta["supported"])
        self.assertGreater(len(items), 0)

        for item in items:
            self.assertEqual(item.category, "TRANSFER")
            self.assertTrue(item.id.startswith("TRANSFER-"))
            self.assertTrue(len(item.barcode) > 0)
            self.assertGreater(item.action_quantity, 0)
            self.assertGreater(item.estimated_financial_impact, 0.0)
            self.assertIsNotNone(item.source_store_name)
            self.assertIsNotNone(item.target_store_name)
            self.assertNotEqual(item.source_store_name, item.target_store_name)
            self.assertIn("Lateral rebalance opportunity", item.message)

        # Grounding check: verify source store exists in dim_location
        top_rec = items[0]
        if top_rec.source_store_code:
            loc_sql = f"SELECT count() FROM dim_location WHERE admsite_code = {top_rec.source_store_code}"
            loc_res = execute_readonly_sql(self.conn, loc_sql)
            self.assertTrue(loc_res["success"])
            self.assertGreater(loc_res["data"][0]["count()"], 0)

    # -------------------------------------------------------------------------
    # C. MARKDOWN unsupported case
    # -------------------------------------------------------------------------
    def test_c_markdown_unsupported_case(self):
        """Test MARKDOWN handling: verifies explicit unsupported status with clear justification, preventing fake data."""
        is_sup, msg = recommendation_agent.is_category_supported("MARKDOWN")
        self.assertFalse(is_sup)
        self.assertIn("MARKDOWN recommendations require promotional price elasticity", msg)

        items, meta = recommendation_agent.generate_recommendations(self.conn, category="MARKDOWN")
        self.assertFalse(meta["supported"])
        self.assertEqual(len(items), 0)
        self.assertIn("price elasticity", meta["message"])

    # -------------------------------------------------------------------------
    # D. No recommendation when evidence is insufficient
    # -------------------------------------------------------------------------
    def test_d_no_recommendation_when_evidence_insufficient(self):
        """Test zero-hallucination guarantee: when filter yields no candidates, returns empty list without inventing records."""
        items, meta = recommendation_agent.generate_recommendations(
            self.conn, department="NONEXISTENT_DEPARTMENT_XYZ_9999"
        )
        self.assertTrue(meta["supported"])
        self.assertEqual(len(items), 0)
        self.assertEqual(meta["total_count"], 0)

    # -------------------------------------------------------------------------
    # E. Deterministic confidence
    # -------------------------------------------------------------------------
    def test_e_deterministic_confidence(self):
        """Test deterministic confidence formula: exact mathematical repeatability without randomness."""
        c1 = recommendation_agent._calculate_reorder_confidence(woc=0.4, weekly_sales=50.0)
        c2 = recommendation_agent._calculate_reorder_confidence(woc=0.4, weekly_sales=50.0)
        self.assertEqual(c1, c2)
        self.assertEqual(c1, 87.5)

        t1 = recommendation_agent._calculate_transfer_confidence(source_woc=25.0, target_woc=0.4, target_sales=80.0)
        t2 = recommendation_agent._calculate_transfer_confidence(source_woc=25.0, target_woc=0.4, target_sales=80.0)
        self.assertEqual(t1, t2)
        self.assertEqual(t1, 93.8)

        # Repeated generation on ClickHouse yields identical confidence scores
        items_run1, _ = recommendation_agent.generate_recommendations(self.conn, limit=5)
        items_run2, _ = recommendation_agent.generate_recommendations(self.conn, limit=5)
        self.assertEqual(
            [it.confidence_score for it in items_run1],
            [it.confidence_score for it in items_run2]
        )

    # -------------------------------------------------------------------------
    # F. No RANDOM() usage
    # -------------------------------------------------------------------------
    def test_f_no_random_usage(self):
        """Test zero randomness: confirms no RANDOM() or rand() SQL functions exist in recommendation pipeline."""
        reorder_sql = recommendation_agent._build_reorder_sql()
        transfer_sql = recommendation_agent._build_transfer_sql()

        for sql in [reorder_sql, transfer_sql]:
            self.assertNotIn("random()", sql.lower())
            self.assertNotIn("rand()", sql.lower())
            self.assertNotIn("random", sql.lower())

        # Inspect source code of recommendation_agent.py
        with open("backend/app/services/recommendation_agent.py", "r", encoding="utf-8") as f:
            code = f.read()
        self.assertNotIn("import random", code)
        self.assertNotIn("from random", code)

    # -------------------------------------------------------------------------
    # G. No fake financial impact
    # -------------------------------------------------------------------------
    def test_g_no_fake_financial_impact(self):
        """Test financial impact grounding: verified against unit RSP and action quantity."""
        items, _ = recommendation_agent.generate_recommendations(self.conn, category="REORDER", limit=10)
        for it in items:
            self.assertGreater(it.estimated_financial_impact, 0.0)
            # Implied unit price should be realistic retail pricing (> ₹50 and < ₹50,000)
            implied_price = it.estimated_financial_impact / it.action_quantity
            self.assertGreater(implied_price, 50.0)
            self.assertLess(implied_price, 50000.0)

    # -------------------------------------------------------------------------
    # H. ClickHouse query failure handling
    # -------------------------------------------------------------------------
    def test_h_clickhouse_query_failure(self):
        """Test graceful handling of ClickHouse query execution failure."""
        with patch("backend.app.services.base_agent.execute_readonly_sql") as mock_exec:
            mock_exec.return_value = {
                "success": False,
                "error": "ClickHouse DB::Exception: Connection refused (localhost:8123)",
                "data": [],
                "columns": [],
                "row_count": 0
            }
            items, meta = recommendation_agent.generate_recommendations(self.conn, category="REORDER")
            self.assertEqual(len(items), 0)
            self.assertTrue(meta["supported"])
            self.assertIsNotNone(meta.get("errors"))
            self.assertIn("Connection refused", meta["errors"][0])

    # -------------------------------------------------------------------------
    # I. Agent self-correction
    # -------------------------------------------------------------------------
    def test_i_agent_self_correction(self):
        """Test self-correction: failed query is caught, refined via groq_service, and retried."""
        initial_fail = {
            "success": False,
            "error": "Syntax error: Unknown function XYZ()",
            "data": [],
            "columns": [],
            "row_count": 0
        }
        corrected_success = {
            "success": True,
            "data": [{"test": 1}],
            "columns": ["test"],
            "row_count": 1
        }

        with patch("backend.app.services.recommendation_agent.execute_readonly_sql", side_effect=[initial_fail, corrected_success]):
            with patch.object(groq_service, "refine_sql_error", return_value="SELECT 1 AS test"):
                res = recommendation_agent._execute_with_self_correction(
                    self.conn, "SELECT XYZ()", "Test self correction intent"
                )
                self.assertTrue(res["success"])
                self.assertTrue(res.get("self_corrected", False))

    # -------------------------------------------------------------------------
    # J. Empty ClickHouse result
    # -------------------------------------------------------------------------
    def test_j_empty_clickhouse_result(self):
        """Test agent behavior when ClickHouse returns 0 candidate rows."""
        empty_res = {
            "success": True,
            "data": [],
            "columns": ["item_code", "stock_qty"],
            "row_count": 0
        }
        with patch.object(recommendation_agent, "_execute_with_self_correction", return_value=empty_res):
            items, meta = recommendation_agent.generate_recommendations(self.conn)
            self.assertEqual(len(items), 0)
            self.assertTrue(meta["supported"])
            self.assertEqual(meta["total_count"], 0)

    # -------------------------------------------------------------------------
    # K. Recommendation feed endpoint
    # -------------------------------------------------------------------------
    def test_k_recommendation_feed_endpoint(self):
        """Test GET /api/v1/recommendations/feed FastAPI endpoint."""
        # 1. Default feed
        res = self.client.get("/api/v1/recommendations/feed?limit=10")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertGreater(len(body["data"]), 0)
        self.assertIn("barcode", body["data"][0])
        self.assertIn("confidence_score", body["data"][0])

        # 2. Filter by category
        res_reorder = self.client.get("/api/v1/recommendations/feed?category=REORDER&limit=5")
        self.assertEqual(res_reorder.status_code, 200)
        for item in res_reorder.json()["data"]:
            self.assertEqual(item["category"], "REORDER")

        # 3. Filter by MARKDOWN (unsupported)
        res_md = self.client.get("/api/v1/recommendations/feed?category=MARKDOWN")
        self.assertEqual(res_md.status_code, 200)
        body_md = res_md.json()
        self.assertFalse(body_md["supported"])
        self.assertEqual(len(body_md["data"]), 0)

    # -------------------------------------------------------------------------
    # L. Recommendation summary endpoint
    # -------------------------------------------------------------------------
    def test_l_recommendation_summary_endpoint(self):
        """Test GET /api/v1/recommendations/summary FastAPI endpoint."""
        res = self.client.get("/api/v1/recommendations/summary")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])

        data = body["data"]
        self.assertGreater(data["total_recommendations"], 0)
        self.assertEqual(
            data["total_recommendations"],
            data["reorder_count"] + data["transfer_count"] + data["markdown_count"]
        )
        self.assertEqual(data["markdown_count"], 0)
        self.assertGreater(data["avg_confidence_score"], 70.0)
        self.assertGreater(data["total_financial_impact"], 0.0)

    # -------------------------------------------------------------------------
    # M. Apply-action endpoint
    # -------------------------------------------------------------------------
    def test_m_apply_action_endpoint(self):
        """Test POST /api/v1/recommendations/apply-action endpoint."""
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
        self.assertIn("order_reference", body["data"])
        self.assertTrue(body["data"]["order_reference"].startswith("AI-REO-"))
        self.assertIn("R174936", body["data"]["message"])


if __name__ == "__main__":
    unittest.main()
