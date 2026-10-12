import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from backend.app.services.sql_validator import sql_validator
from backend.app.services.wren_context_engine import wren_engine
from backend.app.services.groq_llm_service import groq_service
from backend.app.api.v1.endpoints.chat import detect_unsupported_metric


class TestChatClickHouse(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        self.original_backend = settings.WAREHOUSE_BACKEND
        settings.WAREHOUSE_BACKEND = "clickhouse"

    def tearDown(self):
        settings.WAREHOUSE_BACKEND = self.original_backend

    # 1. Simple sales question
    def test_simple_sales_question(self):
        """Verify natural language sales question generates and executes ClickHouse SQL on v_fact_sales_enriched."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "What are the top 5 departments by sales revenue?"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        data = body["data"]
        self.assertIn("v_fact_sales_enriched", data["generated_sql"])
        self.assertGreater(data["record_count"], 0)
        self.assertIn("department", [c.lower() for c in data["columns"]])
        self.assertIn("net_revenue", [c.lower() for c in data["columns"]])
        # Verify positive numbers (no ABS required)
        first_row = data["data"][0]
        self.assertGreater(float(first_row.get("net_revenue") or first_row.get("Net_Revenue", 0)), 0)

    # 2. Monthly revenue question
    def test_monthly_revenue_question(self):
        """Verify monthly sales trend query targets v_monthly_sales_trend in ClickHouse."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Show monthly sales trend by report date"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        data = body["data"]
        self.assertIn("v_monthly_sales_trend", data["generated_sql"])
        self.assertGreater(data["record_count"], 0)
        self.assertTrue(any("month" in c.lower() or "period" in c.lower() for c in data["columns"]))

    # 3. Store comparison
    def test_store_comparison_question(self):
        """Verify store comparison question queries v_store_performance_summary in ClickHouse."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Compare revenue across all retail stores"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        data = body["data"]
        self.assertIn("v_store_performance_summary", data["generated_sql"])
        self.assertGreater(data["record_count"], 0)
        store_names = [r.get("store_name") for r in data["data"] if "store_name" in r]
        self.assertTrue(len(store_names) > 0)

    # 4. Category comparison
    def test_category_comparison_question(self):
        """Verify category/division performance query targets v_category_performance_summary in ClickHouse."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Show division and category performance comparison"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        data = body["data"]
        self.assertIn("v_category_performance_summary", data["generated_sql"])
        self.assertGreater(data["record_count"], 0)

    # 5. Inventory question
    def test_inventory_question(self):
        """Verify inventory / closing stock queries are SUPPORTED on ClickHouse and query v_fact_inventory_enriched."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Show closing stock valuation and units by department"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        # Should NOT be marked unsupported in ClickHouse mode
        self.assertNotEqual(body.get("supported"), False)
        data = body["data"]
        self.assertIn("v_fact_inventory_enriched", data["generated_sql"])
        self.assertGreater(data["record_count"], 0)
        cols_lower = [c.lower() for c in data["columns"]]
        self.assertTrue(any("closing" in c or "val" in c or "unit" in c for c in cols_lower))

    # 6. Invalid ClickHouse SQL rejection
    def test_invalid_clickhouse_sql_security(self):
        """Verify SQLValidatorService strictly rejects non-read-only and destructive ClickHouse commands."""
        # Test destructive statements
        forbidden_queries = [
            "DROP TABLE fact_sales_monthly",
            "TRUNCATE TABLE fact_inventory",
            "ALTER TABLE dim_product DELETE WHERE 1=1",
            "OPTIMIZE TABLE fact_sales_monthly FINAL",
            "SYSTEM FLUSH LOGS",
            "KILL QUERY WHERE query_id = '123'",
            "INSERT INTO dim_location VALUES ('A', 1, 'B', 'C', 'D', 'E', 1, 'F')",
            "SELECT * FROM dim_product; DROP TABLE dim_location;",
        ]

        for bad_sql in forbidden_queries:
            with self.subTest(sql=bad_sql):
                with self.assertRaises(ValueError) as ctx:
                    sql_validator.enforce_security_and_limits(bad_sql)
                self.assertIn("Security Alert", str(ctx.exception))

        # Test limit appending
        valid_sql = "SELECT department, sum(net_amount) FROM v_fact_sales_enriched GROUP BY department"
        secured = sql_validator.enforce_security_and_limits(valid_sql)
        self.assertTrue(secured.endswith("LIMIT 500"))

    # 7. ClickHouse query error followed by correction
    def test_clickhouse_query_error_followed_by_correction(self):
        """Verify that when a ClickHouse query throws an error, the error is fed to the LLM and refined."""
        from backend.db.clickhouse import get_clickhouse_connection
        conn = get_clickhouse_connection()

        # Broken SQL with non-existent column
        broken_sql = "SELECT non_existent_column_xyz FROM v_fact_sales_enriched"
        corrected_sql = "SELECT department, round(sum(net_amount), 2) AS net_revenue FROM v_fact_sales_enriched GROUP BY department LIMIT 5"

        with patch.object(groq_service, "refine_sql_error", return_value=corrected_sql) as mock_refine:
            executed_sql, columns, data = sql_validator.execute_with_auto_refinement(
                db=conn,
                initial_sql=broken_sql,
                user_prompt="Top departments by revenue",
                max_attempts=2,
                dialect="clickhouse"
            )

            # Verify mock_refine was called with ClickHouse error traceback and dialect
            self.assertTrue(mock_refine.called)
            call_args = mock_refine.call_args
            self.assertEqual(call_args.kwargs.get("dialect"), "clickhouse")
            self.assertIn("v_fact_sales_enriched", call_args.kwargs.get("broken_sql"))
            self.assertIn("non_existent_column_xyz", call_args.kwargs.get("error_trace"))

            # Verify the corrected SQL executed successfully
            self.assertEqual(executed_sql, sql_validator.enforce_security_and_limits(corrected_sql))
            self.assertEqual(len(data), 5)
            self.assertIn("department", columns)

        conn.close()

    # 8. Unsupported metric detection
    def test_unsupported_metrics_in_clickhouse(self):
        """Verify genuinely unavailable metrics (CRM/loyalty, footfall, OpEx) return supported=False."""
        unsupported_prompts = [
            ("What is the customer churn rate and loyalty card retention?", "Customer CRM & Loyalty Analytics"),
            ("Show store footfall and visitor traffic conversion rate", "Store Footfall & Traffic Analytics"),
            ("What are our monthly staff payroll and store rent expenses?", "Operating Expenses & Payroll"),
            ("Show online website clickstream and cart abandonment rates", "E-Commerce Clickstream & Web Analytics"),
        ]

        for prompt, expected_metric in unsupported_prompts:
            with self.subTest(prompt=prompt):
                # Verify detector directly
                unsupported_info = detect_unsupported_metric(prompt, dialect="clickhouse")
                self.assertIsNotNone(unsupported_info)
                self.assertEqual(unsupported_info["metric"], expected_metric)

                # Verify via API endpoint
                res = self.client.post("/api/v1/chat/query", json={"prompt": prompt})
                self.assertEqual(res.status_code, 200)
                body = res.json()
                self.assertTrue(body["success"])
                self.assertEqual(body.get("supported"), False)
                data = body["data"]
                self.assertEqual(data["record_count"], 0)
                self.assertEqual(data["visualization_type"], "TEXT_ONLY")
                self.assertIn(expected_metric, data["summary"])


if __name__ == "__main__":
    unittest.main()
