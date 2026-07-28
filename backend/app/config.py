import os
from typing import List, Union
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "M Baazar Analytics API"
    API_V1_STR: str = "/api/v1"
    DUCKDB_PATH: str = os.getenv("DUCKDB_PATH", os.path.join("backend", "db", "olap_warehouse.duckdb"))
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]

    class Config:
        case_sensitive = True

settings = Settings()
