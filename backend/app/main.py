import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": f"Server Error: {str(exc)}",
            "data": None,
            "meta": None
        }
    )

# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Locate static frontend directory (dev vs PyInstaller frozen mode)
def get_frontend_out_dir() -> str | None:
    if getattr(sys, 'frozen', False):
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    else:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    
    out_dir = os.path.join(base_dir, "frontend", "out")
    if os.path.isdir(out_dir):
        return out_dir
    return None

frontend_out = get_frontend_out_dir()

if frontend_out:
    # Mount _next static files
    _next_dir = os.path.join(frontend_out, "_next")
    if os.path.isdir(_next_dir):
        app.mount("/_next", StaticFiles(directory=_next_dir), name="next-static")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_frontend(full_path: str):
        # Do not intercept API or docs routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        target_file = os.path.join(frontend_out, full_path)

        # 1. Exact file match (e.g. favicon.ico, images, .js, .css)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)

        # 2. Match path.html (e.g. /report-builder -> report-builder.html)
        html_file = f"{target_file}.html"
        if os.path.isfile(html_file):
            return FileResponse(html_file)

        # 3. Match path/index.html
        index_in_dir = os.path.join(target_file, "index.html")
        if os.path.isdir(target_file) and os.path.isfile(index_in_dir):
            return FileResponse(index_in_dir)

        # 4. Root path / -> index.html
        root_index = os.path.join(frontend_out, "index.html")
        if not full_path or full_path == "/":
            if os.path.isfile(root_index):
                return FileResponse(root_index)

        # 5. SPA Fallback / 404
        if os.path.isfile(root_index):
            return FileResponse(root_index)

        return JSONResponse({"detail": "Not Found"}, status_code=404)
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "message": "Welcome to MB-OLAP V2 Analytical API",
            "docs": "/docs",
            "health": f"{settings.API_V1_STR}/health"
        }
