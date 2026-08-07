import os
from typing import List, Union

from pydantic_settings import BaseSettings


def _project_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _backend_db_dir() -> str:
    return os.path.join(_project_root(), "backend", "db")


def _resolve_duckdb_path() -> str:
    """Resolve DuckDB warehouse path from env or canonical backend/db location."""
    if os.getenv("DUCKDB_PATH"):
        return os.path.abspath(os.getenv("DUCKDB_PATH", ""))

    return os.path.join(_backend_db_dir(), "olap_warehouse.duckdb")


def _resolve_reports_db_path() -> str:
    if os.getenv("REPORTS_DB_PATH"):
        return os.path.abspath(os.getenv("REPORTS_DB_PATH", ""))

    return os.path.join(_backend_db_dir(), "reports.db")


class Settings(BaseSettings):
    PROJECT_NAME: str = "M Baazar Analytics API"
    API_V1_STR: str = "/api/v1"
    DUCKDB_PATH: str = _resolve_duckdb_path()
    REPORTS_DB_PATH: str = _resolve_reports_db_path()
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]

    class Config:
        case_sensitive = True


settings = Settings()
