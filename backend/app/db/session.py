import duckdb
from backend.app.config import settings

def get_db():
    """
    Dependency generator for DuckDB database sessions.
    Opens a read-only connection per request to ensure safe concurrent access.
    """
    conn = duckdb.connect(settings.DUCKDB_PATH, read_only=True)
    try:
        yield conn
    finally:
        conn.close()
