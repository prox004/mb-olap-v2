import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MB-OLAP V2 Analytical API"
    API_V1_STR: str = "/api/v1"
    DUCKDB_PATH: str = os.path.join("backend", "db", "olap_warehouse.duckdb")
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    class Config:
        case_sensitive = True

settings = Settings()
