import os
import sys

# Add project root to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)

os.environ["PORT"] = "8001"
os.environ["WAREHOUSE_BACKEND"] = "duckdb"
os.environ["PYTHONPATH"] = root_dir

import uvicorn

if __name__ == "__main__":
    print(f"Starting DuckDB Backend on port 8001 with WAREHOUSE_BACKEND={os.environ.get('WAREHOUSE_BACKEND')}")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8001, reload=False)
