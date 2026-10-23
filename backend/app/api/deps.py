from backend.app.db.session import get_db

def get_clickhouse_db():
    """
    Dedicated database dependency for agentic ClickHouse services (ClickHouse AI Chat and Recommendations).
    Guarantees a ClickHouse connection regardless of the global WAREHOUSE_BACKEND setting,
    ensuring zero runtime dependency on DuckDB.
    """
    from backend.db.clickhouse import get_clickhouse_connection
    conn = get_clickhouse_connection()
    try:
        yield conn
    finally:
        conn.close()

# Re-export database dependencies
__all__ = ["get_db", "get_clickhouse_db"]
