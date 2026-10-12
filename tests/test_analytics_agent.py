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
from backend.app.services.analytics_agent import analytics_agent, AgentPlan
from backend.app.services.agent_tools import (
    get_schema,
    describe_object,
    execute_readonly_sql,
    inspect_result,
)
from backend.app.services.groq_llm_service import groq_service


class TestAnalyticsAgent(unittest.TestCase):
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

    # A. Simple one-query question
    def test_a_simple_one_query_question(self):
        """Test simple analytical question: produces single-step plan and executes 1 SQL query."""
        res = analytics_agent.run(self.conn, "What are the top 5 departments by sales revenue?")
        self.assertFalse(res.plan.multi_step)
        self.assertEqual(res.iterations, 1)
        self.assertEqual(len(res.steps), 1)
        self.assertTrue(res.steps[0].success)
        self.assertIn("v_fact_sales_enriched", res.generated_sql)
        self.assertEqual(res.record_count, 5)
        self.assertIn("department", [c.lower() for c in res.columns])
        self.assertGreater(float(res.data[0].get("net_revenue") or res.data[0].get("Net_Revenue", 0)), 0)

    # B. Multi-step analytical question
    def test_b_multi_step_analytical_question(self):
        """Test multi-step causal question: executes 3 queries (trend -> store breakdown -> department breakdown)."""
        prompt = "Why did revenue fall in September compared with August?"
        res = analytics_agent.run(self.conn, prompt)

        self.assertTrue(res.plan.multi_step)
        self.assertGreaterEqual(res.iterations, 2)
        self.assertGreaterEqual(len(res.steps), 2)

        # Verify steps sequence
        step_queries = [s.query_or_target for s in res.steps if s.action == "execute_readonly_sql"]
        self.assertGreaterEqual(len(step_queries), 2)
        # Step 1 should inspect monthly trend
        self.assertIn("v_monthly_sales_trend", step_queries[0])
        # Step 2 should inspect store breakdown
        self.assertIn("store_name", step_queries[1])

        # Verify combined SQL contains documented multi-step chain
        self.assertIn("-- Step 1:", res.generated_sql)
        self.assertIn("-- Step 2:", res.generated_sql)

        # Verify summary contains causal evidence
        self.assertIn("Store Contribution", res.summary)
        self.assertIn("Bhubaneswar", res.summary)

    # C. Empty result inspection
    def test_c_empty_result_inspection(self):
        """Test inspect_result and agent handling on zero rows."""
        empty_sql = "SELECT * FROM v_fact_sales_enriched WHERE store_code = 'NONEXISTENT_XYZ_999'"
        exec_res = execute_readonly_sql(self.conn, empty_sql)
        self.assertTrue(exec_res["success"])
        self.assertEqual(exec_res["row_count"], 0)

        inspection = inspect_result(exec_res["data"], exec_res["columns"])
        self.assertTrue(inspection["is_empty"])
        self.assertEqual(inspection["row_count"], 0)
        self.assertIn("returned 0 rows", inspection["findings"][0])

    # D. SQL error followed by corrected SQL
    def test_d_sql_error_followed_by_corrected_sql(self):
        """Test self-correction: ClickHouse syntax error is caught, refined, and successfully executed."""
        broken_sql = "SELECT invalid_column_error_xyz FROM v_fact_sales_enriched"
        corrected_sql = "SELECT department, round(sum(net_amount), 2) AS net_revenue FROM v_fact_sales_enriched GROUP BY department ORDER BY net_revenue DESC LIMIT 3"

        with patch.object(groq_service, "refine_sql_error", return_value=corrected_sql) as mock_refine:
            with patch.object(analytics_agent, "create_plan") as mock_plan:
                mock_plan.return_value = AgentPlan(
                    user_intent="Test self-correction",
                    required_metrics=["net_amount"],
                    required_dimensions=["department"],
                    time_period="All",
                    likely_tables=["v_fact_sales_enriched"],
                    multi_step=False,
                    planned_steps=["Execute query"],
                    initial_tool="execute_readonly_sql"
                )
                with patch.object(groq_service, "generate_sql", return_value=broken_sql):
                    res = analytics_agent.run(self.conn, "Top 3 departments by revenue")

                    # Verify refinement was triggered
                    self.assertTrue(mock_refine.called)
                    # Verify first step failed with ClickHouse error and second step succeeded
                    self.assertEqual(len(res.steps), 2)
                    self.assertFalse(res.steps[0].success)
                    self.assertIn("invalid_column_error_xyz", res.steps[0].error)
                    self.assertTrue(res.steps[1].success)
                    self.assertEqual(res.record_count, 3)

    # E. Query requiring schema inspection
    def test_e_query_requiring_schema_inspection(self):
        """Test describe_object tool execution when user asks for table columns."""
        res = analytics_agent.run(self.conn, "Describe table dim_product")
        self.assertEqual(res.plan.initial_tool, "describe_object")
        self.assertEqual(res.plan.initial_target, "dim_product")
        self.assertEqual(res.iterations, 1)
        self.assertGreaterEqual(res.record_count, 15)
        self.assertIn("column_name", res.columns)
        self.assertIn("data_type", res.columns)

    # F. Unsupported metric
    def test_f_unsupported_metric_rejection(self):
        """Test unsupported metric returns supported=False and clear explanation."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "What is our store footfall conversion rate?"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertEqual(body.get("supported"), False)
        self.assertIn("Footfall", body["data"]["summary"])
        self.assertEqual(body["data"]["record_count"], 0)

    # G. Destructive SQL rejection
    def test_g_destructive_sql_rejection(self):
        """Test execute_readonly_sql rejects destructive operations immediately."""
        bad_queries = [
            "DROP TABLE fact_sales_monthly",
            "DELETE FROM dim_product WHERE 1=1",
            "TRUNCATE TABLE fact_inventory",
            "OPTIMIZE TABLE fact_sales_monthly FINAL",
            "SYSTEM FLUSH LOGS",
        ]
        for bad_sql in bad_queries:
            with self.subTest(sql=bad_sql):
                res = execute_readonly_sql(self.conn, bad_sql)
                self.assertFalse(res["success"])
                self.assertIn("Security Alert", res["error"])

    # H. Maximum iteration protection
    def test_h_maximum_iteration_protection(self):
        """Test agent strictly halts at MAX_ITERATIONS without entering an infinite loop."""
        broken_sql = "SELECT invalid_loop_col FROM v_fact_sales_enriched"
        # Always return broken SQL to test bounded termination
        with patch.object(groq_service, "refine_sql_error", return_value=broken_sql):
            with patch.object(groq_service, "generate_sql", return_value=broken_sql):
                res = analytics_agent.run(self.conn, "Query that always errors")
                # Must not exceed MAX_ITERATIONS
                self.assertLessEqual(res.iterations, analytics_agent.MAX_ITERATIONS)
                self.assertEqual(res.iterations, analytics_agent.MAX_ITERATIONS)

    # Integration test with FastAPI endpoint
    def test_chat_endpoint_integration(self):
        """Test /api/v1/chat/query works with multi-step causal query."""
        res = self.client.post("/api/v1/chat/query", json={"prompt": "Why did revenue fall in September compared with August?"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        data = body["data"]
        self.assertGreater(data["record_count"], 0)
        self.assertIn("-- Step 1:", data["generated_sql"])
        self.assertIn("Store Contribution", data["summary"])


if __name__ == "__main__":
    unittest.main()
