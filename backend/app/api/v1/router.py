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

api_router = APIRouter()

# Mount Feature Routers
api_router.include_router(executive_router, prefix="/executive", tags=["CEO Executive Dashboard"])
api_router.include_router(category_router, prefix="/category", tags=["Category Performance"])
api_router.include_router(merchandise_router, prefix="/merchandise", tags=["Merchandise Buying"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Size & Price Analytics"])
api_router.include_router(financial_router, prefix="/financial", tags=["Financial & GMROI"])
api_router.include_router(vendor_router, prefix="/vendor", tags=["Vendor Performance"])
api_router.include_router(colour_router, prefix="/colour", tags=["Colour Analytics"])

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

@api_router.get("/locations", response_model=StandardResponse[list], tags=["Master Lookups"])
def get_locations(db: DuckDBPyConnection = Depends(get_db)):
    """
    Returns store location master lookup array [ADMSITE_CODE, Name].
    """
    locations = db.execute("SELECT ADMSITE_CODE, Name FROM dim_location ORDER BY ADMSITE_CODE").fetchall()
    result = [{"admsite_code": loc[0], "name": loc[1]} for loc in locations]
    return StandardResponse(success=True, data=result)
