import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from decimal import Decimal

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from backend.db.clickhouse import (
    get_clickhouse_settings,
    ClickHouseWarehouseConnection,
    ClickHouseQueryResult,
)


class TestBackendIntegration(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_duckdb_health_check(self):
        """Verify health check reports DuckDB when WAREHOUSE_BACKEND is duckdb."""
        settings.WAREHOUSE_BACKEND = "duckdb"
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["warehouse_backend"], "duckdb")
        self.assertEqual(body["data"]["status"], "online")
        self.assertGreater(body["data"]["fact_records"], 0)

    def test_duckdb_executive_kpis(self):
        """Verify executive KPI endpoint returns expected schema."""
        settings.WAREHOUSE_BACKEND = "duckdb"
        res = self.client.get("/api/v1/executive/kpis")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertIn("total_revenue", data)
        self.assertIn("total_sales_units", data)
        self.assertIn("total_gross_profit", data)
        self.assertIn("gross_margin_pct", data)

    def test_duckdb_locations_lookup(self):
        """Verify locations lookup returns 4 demo/store locations."""
        settings.WAREHOUSE_BACKEND = "duckdb"
        res = self.client.get("/api/v1/locations")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 4)

    def test_clickhouse_settings_no_hardcoded_secrets(self):
        """Verify ClickHouse configuration defaults and env-var overrides."""
        cfg = get_clickhouse_settings()
        self.assertEqual(cfg["host"], os.getenv("CLICKHOUSE_HOST", "localhost"))
        self.assertEqual(cfg["port"], int(os.getenv("CLICKHOUSE_PORT", "8123")))
        self.assertEqual(cfg["database"], os.getenv("CLICKHOUSE_DATABASE", "mb_olap_v2"))
        self.assertEqual(cfg["username"], os.getenv("CLICKHOUSE_USER", "default"))
        self.assertEqual(cfg["password"], os.getenv("CLICKHOUSE_PASSWORD", ""))

    def test_clickhouse_adapter_parameter_binding(self):
        """Verify ClickHouseWarehouseConnection correctly formats parameter placeholders."""
        mock_client = MagicMock()
        adapter = ClickHouseWarehouseConnection(mock_client)

        query = "SELECT * FROM fact_sales WHERE store_code = ? AND bill_qty > ?"
        params = ["GRHAT", 10]
        formatted = adapter._bind_parameters(query, params)
        expected = "SELECT * FROM fact_sales WHERE store_code = 'GRHAT' AND bill_qty > 10"
        self.assertEqual(formatted, expected)

    def test_clickhouse_adapter_query_translation(self):
        """Verify dialect translation from DuckDB strftime to ClickHouse formatDateTime."""
        mock_client = MagicMock()
        adapter = ClickHouseWarehouseConnection(mock_client)

        duckdb_sql = "SELECT strftime(v.START_DATE, '%Y-%m') AS month FROM v"
        translated = adapter._translate_sql(duckdb_sql)
        expected = "SELECT formatDateTime(v.START_DATE, '%Y-%m') AS month FROM v"
        self.assertEqual(translated, expected)

    def test_clickhouse_query_result_wrapping(self):
        """Verify ClickHouseQueryResult provides fetchone and fetchall correctly."""
        sample_rows = [(1, "A"), (2, "B"), (3, "C")]
        qr = ClickHouseQueryResult(sample_rows, ["id", "val"])
        self.assertEqual(qr.fetchone(), (1, "A"))
        self.assertEqual(qr.fetchall(), sample_rows)
        df = qr.df()
        self.assertEqual(len(df), 3)
        self.assertEqual(list(df.columns), ["id", "val"])

    def test_duckdb_months_lookup(self):
        """Verify months lookup returns distinct operational months."""
        settings.WAREHOUSE_BACKEND = "duckdb"
        res = self.client.get("/api/v1/months")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_clickhouse_unreachable_error_handling(self):
        """Verify graceful error reporting when ClickHouse server is offline."""
        settings.WAREHOUSE_BACKEND = "clickhouse"
        settings.CLICKHOUSE_PORT = 9999  # Non-existent port
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["warehouse_backend"], "clickhouse")
        self.assertEqual(data["status"], "degraded")
        self.assertIn("failed", data["database"])

        # Reset backend
        settings.WAREHOUSE_BACKEND = "duckdb"
        settings.CLICKHOUSE_PORT = 8123

    def test_clickhouse_mode_mock_response(self):
        """Verify endpoints work seamlessly when ClickHouse backend returns data, with inventory metrics marked unavailable."""
        from backend.db.clickhouse import ClickHouseQueryResult

        settings.WAREHOUSE_BACKEND = "clickhouse"
        mock_conn = MagicMock()
        mock_conn.execute.return_value = ClickHouseQueryResult(
            [[331367606.0, 1234990.0, 140741381.0, 42.47, 0.0, 0.0, 0.0, 999.0]],
            ["total_revenue", "total_sales_units", "total_gross_profit", "gross_margin_pct",
             "total_inventory_value", "total_inventory_units", "sell_through_pct", "average_woc"]
        )

        with patch("backend.app.db.session.get_db") as mock_get_db:
            mock_get_db.return_value = mock_conn
            from backend.app.api.deps import get_db
            app.dependency_overrides[get_db] = lambda: mock_conn

            res = self.client.get("/api/v1/executive/kpis")
            app.dependency_overrides.clear()
            settings.WAREHOUSE_BACKEND = "duckdb"

            self.assertEqual(res.status_code, 200)
            data = res.json()["data"]
            self.assertEqual(data["total_revenue"], 331367606.0)
            self.assertEqual(data["total_sales_units"], 1234990.0)
            self.assertEqual(data["total_gross_profit"], 140741381.0)
            self.assertEqual(data["gross_margin_pct"], 42.47)
            # Verify inventory metrics are None and marked unavailable (NOT fabricated as 0.0 / 999.0)
            self.assertIsNone(data["total_inventory_value"])
            self.assertIsNone(data["total_inventory_units"])
            self.assertIsNone(data["sell_through_pct"])
            self.assertIsNone(data["average_woc"])
            self.assertFalse(data["inventory_metrics_available"])

    def test_clickhouse_gmroi_unsupported(self):
        """Verify /api/v1/financial/gmroi returns supported=False and data=None in ClickHouse mode."""
        settings.WAREHOUSE_BACKEND = "clickhouse"
        mock_conn = MagicMock()
        with patch("backend.app.db.session.get_db") as mock_get_db:
            mock_get_db.return_value = mock_conn
            from backend.app.api.deps import get_db
            app.dependency_overrides[get_db] = lambda: mock_conn

            res = self.client.get("/api/v1/financial/gmroi")
            app.dependency_overrides.clear()
            settings.WAREHOUSE_BACKEND = "duckdb"

            self.assertEqual(res.status_code, 200)
            body = res.json()
            self.assertFalse(body["success"])
            self.assertFalse(body["supported"])
            self.assertIsNone(body["data"])
            self.assertIn("requires stock-on-hand", body["message"])

    def test_duckdb_gmroi_supported(self):
        """Verify /api/v1/financial/gmroi functions normally in DuckDB mode."""
        settings.WAREHOUSE_BACKEND = "duckdb"
        res = self.client.get("/api/v1/financial/gmroi")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertTrue(body["supported"])
        self.assertIsInstance(body["data"], list)

    def test_duckdb_category_growth(self):
        """Verify /api/v1/category/growth calculates period-over-period growth."""
        settings.WAREHOUSE_BACKEND = "duckdb"
        res = self.client.get("/api/v1/category/growth")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertIsInstance(body["data"], list)


if __name__ == "__main__":
    unittest.main()

