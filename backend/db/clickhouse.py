import os
import re
import logging
from typing import Optional, Any, List
import pandas as pd
import clickhouse_connect
from clickhouse_connect.driver.client import Client

logger = logging.getLogger("mb_olap.clickhouse")


class ClickHouseQueryResult:
    """Wrapper around ClickHouse query results mimicking DuckDBPyConnection cursor."""
    def __init__(self, result_rows: Optional[List[Any]] = None, column_names: Optional[List[str]] = None):
        self._rows = result_rows if result_rows is not None else []
        self._columns = column_names if column_names is not None else []
        self._idx = 0

    def fetchall(self) -> List[Any]:
        return self._rows

    def fetchone(self) -> Optional[Any]:
        if self._rows and self._idx < len(self._rows):
            row = self._rows[self._idx]
            self._idx += 1
            return row
        return None

    @property
    def description(self) -> Optional[List[Any]]:
        if self._columns:
            return [(col, None, None, None, None, None, None) for col in self._columns]
        return None

    def df(self) -> pd.DataFrame:
        if self._columns:
            return pd.DataFrame(self._rows, columns=self._columns)
        return pd.DataFrame(self._rows)


class ClickHouseWarehouseConnection:
    """
    Adapter enabling FastAPI endpoints to execute SQL queries transparently
    against ClickHouse with the same interface as DuckDBPyConnection.
    """
    def __init__(self, client: Client):
        self.client = client

    def execute(self, query: str, parameters: Optional[list] = None) -> ClickHouseQueryResult:
        # 1. Translate dialect differences (e.g., strftime to formatDateTime)
        translated_sql = self._translate_sql(query)

        # 2. Substitute ? placeholders safely
        formatted_sql = self._bind_parameters(translated_sql, parameters)

        # 3. Execute query
        try:
            res = self.client.query(formatted_sql)
            return ClickHouseQueryResult(res.result_rows, res.column_names)
        except Exception as e:
            logger.error(f"ClickHouse query execution failed: {e}\nQuery: {formatted_sql}")
            raise e

    def _translate_sql(self, query: str) -> str:
        """Translates common DuckDB SQL expressions to ClickHouse equivalents."""
        # Translate strftime(col, '%Y-%m') to formatDateTime(col, '%Y-%m')
        q = re.sub(
            r"strftime\s*\(\s*([^,]+)\s*,\s*('%Y-%m')\s*\)",
            r"formatDateTime(\1, \2)",
            query,
            flags=re.IGNORECASE
        )
        return q

    def _bind_parameters(self, query: str, parameters: Optional[list]) -> str:
        if not parameters:
            return query

        parts = query.split("?")
        if len(parts) - 1 != len(parameters):
            # Fallback if placeholder count differs
            return query

        out = []
        for i, val in enumerate(parameters):
            out.append(parts[i])
            if val is None:
                out.append("NULL")
            elif isinstance(val, (int, float)):
                out.append(str(val))
            elif isinstance(val, str):
                escaped = val.replace("'", "\\'")
                out.append(f"'{escaped}'")
            elif isinstance(val, (list, tuple)):
                items = []
                for item in val:
                    if isinstance(item, (int, float)):
                        items.append(str(item))
                    else:
                        esc_item = str(item).replace("'", "\\'")
                        items.append(f"'{esc_item}'")
                out.append(f"({', '.join(items)})")
            else:
                esc_val = str(val).replace("'", "\\'")
                out.append(f"'{esc_val}'")

        out.append(parts[-1])
        return "".join(out)

    def close(self):
        if self.client:
            self.client.close()


def get_clickhouse_settings() -> dict:
    """
    Retrieve ClickHouse connection settings from environment variables and settings object.
    Safe defaults for local development. Never hard-code credentials.
    """
    from backend.app.config import settings
    return {
        "host": getattr(settings, "CLICKHOUSE_HOST", os.getenv("CLICKHOUSE_HOST", "localhost")),
        "port": int(getattr(settings, "CLICKHOUSE_PORT", os.getenv("CLICKHOUSE_PORT", "8123"))),
        "database": getattr(settings, "CLICKHOUSE_DATABASE", os.getenv("CLICKHOUSE_DATABASE", "mb_olap_v2")),
        "username": getattr(settings, "CLICKHOUSE_USER", os.getenv("CLICKHOUSE_USER", "default")),
        "password": getattr(settings, "CLICKHOUSE_PASSWORD", os.getenv("CLICKHOUSE_PASSWORD", "")),
        "connect_timeout": int(os.getenv("CLICKHOUSE_CONNECT_TIMEOUT", "10")),
        "send_receive_timeout": int(os.getenv("CLICKHOUSE_SEND_RECEIVE_TIMEOUT", "300")),
    }


def get_client(database: Optional[str] = None) -> Client:
    """Creates and returns a raw ClickHouse Client connection."""
    cfg = get_clickhouse_settings()
    if database:
        cfg["database"] = database
    try:
        return clickhouse_connect.get_client(**cfg)
    except Exception as e:
        logger.error(f"Failed to connect to ClickHouse at {cfg['host']}:{cfg['port']}: {e}")
        raise ConnectionError(
            f"ClickHouse connection failed ({cfg['host']}:{cfg['port']}). "
            f"Ensure ClickHouse is running or set CLICKHOUSE_HOST/PORT env vars. Error: {e}"
        ) from e


def get_clickhouse_connection() -> ClickHouseWarehouseConnection:
    """Creates and returns a ClickHouseWarehouseConnection adapter."""
    client = get_client()
    return ClickHouseWarehouseConnection(client)


def test_connection() -> dict:
    """Verifies ClickHouse connectivity and returns version & database info."""
    try:
        client = get_client()
        version = client.server_version
        db = client.database
        tables = client.command("SHOW TABLES")
        return {
            "status": "connected",
            "server_version": str(version),
            "database": db,
            "tables": tables.split("\n") if isinstance(tables, str) else list(tables)
        }
    except Exception as e:
        return {
            "status": "unreachable",
            "error": str(e)
        }
