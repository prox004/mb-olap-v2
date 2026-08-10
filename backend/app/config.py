import os
import sys
from typing import List, Union

from pydantic_settings import BaseSettings


def _project_root() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _backend_db_dir() -> str:
    if getattr(sys, "frozen", False):
        return os.path.join(os.path.dirname(sys.executable), "db")
    return os.path.join(_project_root(), "backend", "db")


def _resolve_duckdb_path() -> str:
    """Resolve DuckDB warehouse path from env or canonical backend/db location."""
    if os.getenv("DUCKDB_PATH"):
        return os.path.abspath(os.getenv("DUCKDB_PATH", ""))

    candidates = []
    if getattr(sys, "frozen", False):
        exe_dir = os.path.dirname(sys.executable)
        bundle_dir = getattr(sys, "_MEIPASS", exe_dir)
        candidates.append(os.path.join(exe_dir, "db", "olap_warehouse.duckdb"))
        candidates.append(os.path.join(exe_dir, "backend", "db", "olap_warehouse.duckdb"))
        candidates.append(os.path.join(bundle_dir, "backend", "db", "olap_warehouse.duckdb"))
        candidates.append(os.path.join(bundle_dir, "db", "olap_warehouse.duckdb"))

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidates.append(os.path.join(root_dir, "backend", "db", "olap_warehouse.duckdb"))

    for p in candidates:
        if os.path.isfile(p):
            return p
    return os.path.join(root_dir, "backend", "db", "olap_warehouse.duckdb")


def _resolve_reports_db_path() -> str:
    if os.getenv("REPORTS_DB_PATH"):
        return os.path.abspath(os.getenv("REPORTS_DB_PATH", ""))

    candidates = []
    if getattr(sys, "frozen", False):
        exe_dir = os.path.dirname(sys.executable)
        bundle_dir = getattr(sys, "_MEIPASS", exe_dir)
        candidates.append(os.path.join(exe_dir, "db", "reports.db"))
        candidates.append(os.path.join(exe_dir, "backend", "db", "reports.db"))
        candidates.append(os.path.join(bundle_dir, "backend", "db", "reports.db"))
        candidates.append(os.path.join(bundle_dir, "db", "reports.db"))

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidates.append(os.path.join(root_dir, "backend", "db", "reports.db"))

    for p in candidates:
        if os.path.isfile(p) or os.path.isdir(os.path.dirname(p)):
            return p
    return os.path.join(root_dir, "backend", "db", "reports.db")


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
