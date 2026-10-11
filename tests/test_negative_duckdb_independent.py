import unittest
import os
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings

class TestNegativeDuckDbIndependence(unittest.TestCase):
    """
    Negative Test: Proves that Chat/Wren AI and AI Recommendations runtime paths
    operate with 100% independence from DuckDB, and remain fully functional even when
    the DuckDB database file is completely missing or inaccessible.
    """

    def setUp(self):
        self.original_duckdb_path = getattr(settings, "DUCKDB_PATH", None)
        self.original_backend = getattr(settings, "WAREHOUSE_BACKEND", "clickhouse")
        self.client = TestClient(app)

    def tearDown(self):
        settings.DUCKDB_PATH = self.original_duckdb_path
        settings.WAREHOUSE_BACKEND = self.original_backend

    def test_runtime_paths_without_duckdb(self):
        # 1. Point DuckDB to a completely non-existent file
        bogus_duckdb_path = os.path.abspath("nonexistent_olap_warehouse_isolated_test.duckdb")
        if os.path.exists(bogus_duckdb_path):
            os.remove(bogus_duckdb_path)
        self.assertFalse(os.path.exists(bogus_duckdb_path))

        settings.DUCKDB_PATH = bogus_duckdb_path
        settings.WAREHOUSE_BACKEND = "clickhouse"

        # 2. Verify Chat/Wren query endpoint functions with zero DuckDB
        chat_res = self.client.post("/api/v1/chat/query", json={"prompt": "Which store had the highest revenue?"})
        self.assertEqual(chat_res.status_code, 200)
        chat_body = chat_res.json()
        self.assertTrue(chat_body["success"])
        self.assertTrue(chat_body["supported"])
        self.assertIn("data", chat_body)
        self.assertIn("v_store_performance_summary", chat_body["data"]["generated_sql"])

        # 3. Verify Chat suggested-prompts endpoint functions with zero DuckDB
        prompts_res = self.client.get("/api/v1/chat/suggested-prompts")
        self.assertEqual(prompts_res.status_code, 200)
        prompts_body = prompts_res.json()
        self.assertTrue(prompts_body["success"])
        self.assertGreater(len(prompts_body["data"]), 0)

        # 4. Verify Recommendations feed endpoint functions with zero DuckDB
        feed_res = self.client.get("/api/v1/recommendations/feed?limit=5")
        self.assertEqual(feed_res.status_code, 200)
        feed_body = feed_res.json()
        self.assertTrue(feed_body["success"])
        self.assertTrue(feed_body["supported"])
        self.assertIsInstance(feed_body["data"], list)

        # 5. Verify Recommendations summary endpoint functions with zero DuckDB
        summary_res = self.client.get("/api/v1/recommendations/summary")
        self.assertEqual(summary_res.status_code, 200)
        summary_body = summary_res.json()
        self.assertTrue(summary_body["success"])
        self.assertTrue(summary_body["supported"])
        self.assertIn("total_recommendations", summary_body["data"])

        # 6. Verify Recommendations apply-action endpoint functions with zero DuckDB
        action_res = self.client.post("/api/v1/recommendations/apply-action", json={
            "recommendation_id": "REORDER-TEST-001",
            "action_type": "PO",
            "barcode": "F03831",
            "quantity": 100
        })
        self.assertEqual(action_res.status_code, 200)
        action_body = action_res.json()
        self.assertTrue(action_body["success"])
        self.assertIn("order_reference", action_body["data"])

        print("\n[NEGATIVE TEST PASSED] All 5 Chat & Recommendation endpoints verified independent of DuckDB!")


if __name__ == "__main__":
    unittest.main()
