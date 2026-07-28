from typing import Optional
from fastapi import APIRouter, Depends
from duckdb import DuckDBPyConnection
from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse
from backend.app.api.v1.endpoints.executive import router as executive_router
from backend.app.api.v1.endpoints.category import router as category_router
from backend.app.api.v1.endpoints.merchandise import router as merchandise_router
from backend.app.api.v1.endpoints.analytics import router as analytics_router
from backend.app.api.v1.endpoints.financial import router as financial_router
from backend.app.api.v1.endpoints.vendor import router as vendor_router
from backend.app.api.v1.endpoints.colour import router as colour_router
from backend.app.api.v1.endpoints.allocation import router as allocation_router
from backend.app.api.v1.endpoints.recommendations import router as recommendations_router
from backend.app.api.v1.endpoints.chat import router as chat_router

api_router = APIRouter()

# Mount Feature Routers
api_router.include_router(executive_router, prefix="/executive", tags=["CEO Executive Dashboard"])
api_router.include_router(category_router, prefix="/category", tags=["Category Performance"])
api_router.include_router(merchandise_router, prefix="/merchandise", tags=["Merchandise Buying"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Size & Price Analytics"])
api_router.include_router(financial_router, prefix="/financial", tags=["Financial & GMROI"])
api_router.include_router(vendor_router, prefix="/vendor", tags=["Vendor Performance"])
api_router.include_router(colour_router, prefix="/colour", tags=["Colour Analytics"])
api_router.include_router(allocation_router, prefix="/allocation", tags=["Store Allocation"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["AI Recommendations"])
api_router.include_router(chat_router, prefix="/chat", tags=["Wren AI Semantic Assistant"])

@api_router.get("/health", response_model=StandardResponse[dict], tags=["System Health"])
def health_check(db: DuckDBPyConnection = Depends(get_db)):
    """
    Health check endpoint verifying FastAPI server and DuckDB connection status.
    """
    total_fact_rows = db.execute("SELECT count(*) FROM fact_cube_monthly").fetchone()[0]
    return StandardResponse(
        success=True,
        message="MB-OLAP V2 Analytical API is healthy",
        data={
            "status": "online",
            "database": "DuckDB connected (read-only)",
            "fact_records": total_fact_rows
        }
    )

from pydantic import BaseModel, Field
import os
import pandas as pd

class CreateStoreLocationRequest(BaseModel):
    admsite_code: int = Field(..., description="Store AdmSite Code (e.g. 950)")
    name: str = Field(..., description="Store Location Name (e.g. M Baazar - Howrah)")
    site_type: Optional[str] = Field("RETAIL_STORE", description="Site type: RETAIL_STORE or CENTRAL_WAREHOUSE")

@api_router.get("/locations", response_model=StandardResponse[list], tags=["Master Lookups"])
def get_locations(db: DuckDBPyConnection = Depends(get_db)):
    """
    Returns store location master lookup array [ADMSITE_CODE, Name].
    """
    locations = db.execute("SELECT ADMSITE_CODE, Name, SITE_TYPE FROM dim_location ORDER BY ADMSITE_CODE").fetchall()
    result = [{"admsite_code": loc[0], "name": loc[1], "site_type": loc[2]} for loc in locations]
    return StandardResponse(success=True, data=result)


@api_router.post("/locations", response_model=StandardResponse[dict], tags=["Master Lookups"])
def add_location(payload: CreateStoreLocationRequest):
    """
    Adds a new store location entry and saves directly to backend/db/parquet/dim_locations.parquet,
    data/locations.xlsx, and updates the active DuckDB table dim_location.
    """
    from backend.app.config import settings
    import duckdb

    code = payload.admsite_code
    name = payload.name.strip()
    site_type = (payload.site_type or "RETAIL_STORE").strip().upper()

    # Connect to DuckDB in read-write mode for mutation
    rw_conn = duckdb.connect(settings.DUCKDB_PATH, read_only=False)
    try:
        # Check if admsite_code already exists
        existing = rw_conn.execute("SELECT ADMSITE_CODE FROM dim_location WHERE ADMSITE_CODE = ?", [code]).fetchone()
        if existing:
            return StandardResponse(
                success=False,
                message=f"Store location with ADMSITE_CODE {code} already exists.",
                data={"admsite_code": code}
            )

        # 1. Update active DuckDB table
        rw_conn.execute(
            "INSERT INTO dim_location (ADMSITE_CODE, Name, SITE_TYPE) VALUES (?, ?, ?)",
            [code, name, site_type]
        )

        # 2. Persist directly to backend/db/parquet/dim_locations.parquet
        parquet_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../db/parquet/dim_locations.parquet"))
        clean_parquet_path = parquet_path.replace("\\", "/")
        all_locs = rw_conn.execute("SELECT ADMSITE_CODE, Name FROM dim_location ORDER BY ADMSITE_CODE").df()
        rw_conn.execute(f"COPY all_locs TO '{clean_parquet_path}' (FORMAT PARQUET, COMPRESSION SNAPPY)")
    finally:
        rw_conn.close()

    # 3. Trigger Automated ETL Views Regeneration in Background Thread
    import threading
    def trigger_etl_pipeline():
        try:
            from backend.etl.modules.store_allocation import run_store_allocation_etl
            from backend.etl.modules.category_performance import run_category_performance_etl
            run_store_allocation_etl()
            run_category_performance_etl()
            print(f"Automated ETL pipeline regenerated for new store: {name} ({code})")
        except Exception as err:
            print(f"Automated ETL background refresh warning: {err}")

    threading.Thread(target=trigger_etl_pipeline, daemon=True).start()

    # 4. Persist to source Excel file data/locations.xlsx for ETL repeatability
    excel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/locations.xlsx"))
    if os.path.exists(excel_path):
        try:
            excel_df = pd.read_excel(excel_path)
            if code not in excel_df["ADMSITE_CODE"].values:
                new_row = pd.DataFrame([{"ADMSITE_CODE": code, "Name": name}])
                updated_excel_df = pd.concat([excel_df, new_row], ignore_index=True)
                updated_excel_df.to_excel(excel_path, index=False)
        except Exception as e:
            print(f"Warning: Failed to update Excel file: {e}")

class UpdateStoreLocationRequest(BaseModel):
    name: str = Field(..., description="Updated Store Location Name")
    site_type: Optional[str] = Field("RETAIL_STORE", description="Site type: RETAIL_STORE or CENTRAL_WAREHOUSE")

@api_router.put("/locations/{admsite_code}", response_model=StandardResponse[dict], tags=["Master Lookups"])
def update_location(admsite_code: int, payload: UpdateStoreLocationRequest):
    """
    Modifies an existing store location name/site_type and updates dim_locations.parquet,
    data/locations.xlsx, active DuckDB table dim_location, and triggers pipeline re-indexes.
    """
    from backend.app.config import settings
    import duckdb

    name = payload.name.strip()
    site_type = (payload.site_type or "RETAIL_STORE").strip().upper()

    rw_conn = duckdb.connect(settings.DUCKDB_PATH, read_only=False)
    try:
        existing = rw_conn.execute("SELECT ADMSITE_CODE FROM dim_location WHERE ADMSITE_CODE = ?", [admsite_code]).fetchone()
        if not existing:
            return StandardResponse(
                success=False,
                message=f"Store location with ADMSITE_CODE {admsite_code} not found.",
                data={"admsite_code": admsite_code}
            )

        rw_conn.execute(
            "UPDATE dim_location SET Name = ?, SITE_TYPE = ? WHERE ADMSITE_CODE = ?",
            [name, site_type, admsite_code]
        )

        parquet_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../db/parquet/dim_locations.parquet"))
        clean_parquet_path = parquet_path.replace("\\", "/")
        all_locs = rw_conn.execute("SELECT ADMSITE_CODE, Name FROM dim_location ORDER BY ADMSITE_CODE").df()
        rw_conn.execute(f"COPY all_locs TO '{clean_parquet_path}' (FORMAT PARQUET, COMPRESSION SNAPPY)")
    finally:
        rw_conn.close()

    # Trigger Automated ETL Views Regeneration in Background Thread
    import threading
    def trigger_etl_pipeline():
        try:
            from backend.etl.modules.store_allocation import run_store_allocation_etl
            from backend.etl.modules.category_performance import run_category_performance_etl
            run_store_allocation_etl()
            run_category_performance_etl()
            print(f"Automated ETL pipeline updated for store ID: {admsite_code}")
        except Exception as err:
            print(f"Automated ETL background refresh warning: {err}")

    threading.Thread(target=trigger_etl_pipeline, daemon=True).start()

    # Persist to source Excel file data/locations.xlsx
    excel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/locations.xlsx"))
    if os.path.exists(excel_path):
        try:
            excel_df = pd.read_excel(excel_path)
            excel_df.loc[excel_df["ADMSITE_CODE"] == admsite_code, "Name"] = name
            excel_df.to_excel(excel_path, index=False)
        except Exception as e:
            print(f"Warning: Failed to update Excel file: {e}")

    return StandardResponse(
        success=True,
        message=f"Store ID {admsite_code} successfully updated to '{name}'.",
        data={"admsite_code": admsite_code, "name": name, "site_type": site_type}
    )


@api_router.delete("/locations/{admsite_code}", response_model=StandardResponse[dict], tags=["Master Lookups"])
def delete_location(admsite_code: int):
    """
    Deletes a store location from dim_location, rewrites dim_locations.parquet,
    data/locations.xlsx, and triggers pipeline re-indexes.
    """
    from backend.app.config import settings
    import duckdb

    rw_conn = duckdb.connect(settings.DUCKDB_PATH, read_only=False)
    try:
        existing = rw_conn.execute("SELECT ADMSITE_CODE, Name FROM dim_location WHERE ADMSITE_CODE = ?", [admsite_code]).fetchone()
        if not existing:
            return StandardResponse(
                success=False,
                message=f"Store location with ADMSITE_CODE {admsite_code} not found.",
                data={"admsite_code": admsite_code}
            )

        removed_name = existing[1]
        rw_conn.execute("DELETE FROM dim_location WHERE ADMSITE_CODE = ?", [admsite_code])

        parquet_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../db/parquet/dim_locations.parquet"))
        clean_parquet_path = parquet_path.replace("\\", "/")
        all_locs = rw_conn.execute("SELECT ADMSITE_CODE, Name FROM dim_location ORDER BY ADMSITE_CODE").df()
        rw_conn.execute(f"COPY all_locs TO '{clean_parquet_path}' (FORMAT PARQUET, COMPRESSION SNAPPY)")
    finally:
        rw_conn.close()

    # Trigger Automated ETL Views Regeneration in Background Thread
    import threading
    def trigger_etl_pipeline():
        try:
            from backend.etl.modules.store_allocation import run_store_allocation_etl
            from backend.etl.modules.category_performance import run_category_performance_etl
            run_store_allocation_etl()
            run_category_performance_etl()
            print(f"Automated ETL pipeline updated after deleting store ID: {admsite_code}")
        except Exception as err:
            print(f"Automated ETL background refresh warning: {err}")

    threading.Thread(target=trigger_etl_pipeline, daemon=True).start()

    # Update source Excel file data/locations.xlsx
    excel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/locations.xlsx"))
    if os.path.exists(excel_path):
        try:
            excel_df = pd.read_excel(excel_path)
            excel_df = excel_df[excel_df["ADMSITE_CODE"] != admsite_code]
            excel_df.to_excel(excel_path, index=False)
        except Exception as e:
            print(f"Warning: Failed to update Excel file: {e}")

    return StandardResponse(
        success=True,
        message=f"Store '{removed_name}' (ID: {admsite_code}) removed from Parquet & Database.",
        data={"admsite_code": admsite_code}
    )





@api_router.get("/months", response_model=StandardResponse[list], tags=["Master Lookups"])
def get_months(db: DuckDBPyConnection = Depends(get_db)):
    """
    Returns dynamic list of distinct operational months [YYYY-MM] present in the OLAP database.
    """
    query = """
    SELECT DISTINCT strftime(START_DATE, '%Y-%m') AS month_code
    FROM fact_cube_monthly
    WHERE START_DATE IS NOT NULL
    ORDER BY month_code ASC
    """
    months = [row[0] for row in db.execute(query).fetchall() if row[0]]
    return StandardResponse(success=True, data=months)

