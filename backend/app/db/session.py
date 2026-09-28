import duckdb
import logging
from backend.app.config import settings

logger = logging.getLogger("mb_olap.db")


class DegradedClickHouseConnection:
    """Fallback object yielded when ClickHouse is configured but unreachable."""
    def __init__(self, error_message: str):
        self.error_message = error_message

    def execute(self, *args, **kwargs):
        raise ConnectionError(
            f"ClickHouse server is unreachable: {self.error_message}. "
            "Please ensure ClickHouse is running or set WAREHOUSE_BACKEND=duckdb."
        )

    def close(self):
        pass


def get_db():
    """
    Unified database session dependency generator.
    Selects warehouse backend dynamically based on WAREHOUSE_BACKEND setting:
      - 'duckdb' (default): Connects to local DuckDB olap_warehouse.duckdb
      - 'clickhouse': Connects to ClickHouse via ClickHouseWarehouseConnection adapter
    """
    backend_mode = settings.WAREHOUSE_BACKEND.lower().strip()

    if backend_mode == "clickhouse":
        from backend.db.clickhouse import get_clickhouse_connection
        try:
            conn = get_clickhouse_connection()
        except Exception as e:
            logger.warning(f"ClickHouse connection failed: {e}. Yielding degraded connection.")
            yield DegradedClickHouseConnection(str(e))
            return

        try:
            yield conn
        finally:
            conn.close()
    else:
        # Default DuckDB mode
        conn = duckdb.connect(settings.DUCKDB_PATH, read_only=True)
        try:
            yield conn
        finally:
            conn.close()
