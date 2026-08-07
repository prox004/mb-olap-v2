import subprocess
import sys
import os
import time
import urllib.error
import urllib.request

def wait_for_backend(health_url: str, timeout_seconds: int = 90) -> bool:
    """Poll backend health until it responds or timeout."""
    print(f"   Waiting for backend at {health_url} ...")
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(health_url, timeout=3) as response:
                if response.status == 200:
                    print("   Backend is ready.")
                    return True
        except (urllib.error.URLError, TimeoutError, OSError):
            pass
        time.sleep(1)
    return False


def main():
    # Force UTF-8 output encoding for Windows terminal compatibility
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")

    print("==================================================")
    print("STARTING MB-OLAP V2 ENTERPRISE PLATFORM")
    print("==================================================")

    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    db_path = os.path.join(root_dir, "backend", "db", "olap_warehouse.duckdb")
    reports_db_path = os.path.join(root_dir, "backend", "db", "reports.db")
    health_url = "http://127.0.0.1:8000/api/v1/health"

    os.environ["PYTHONPATH"] = root_dir
    os.environ["DUCKDB_PATH"] = db_path
    os.environ["REPORTS_DB_PATH"] = reports_db_path

    if not os.path.isfile(db_path):
        print(f"ERROR: DuckDB warehouse not found at {db_path}")
        print("Run: python backend/etl/run_pipeline.py")
        sys.exit(1)

    processes = []

    try:
        print("1. Launching Backend FastAPI Server (http://localhost:8000)...")
        backend_proc = subprocess.Popen(
            [sys.executable, "backend/run.py"],
            cwd=root_dir,
            env=os.environ.copy(),
        )
        processes.append(backend_proc)

        if not wait_for_backend(health_url):
            print("ERROR: Backend did not become ready in time.")
            backend_proc.terminate()
            sys.exit(1)

        print("2. Launching Frontend Next.js Application (http://localhost:3000)...")
        frontend_proc = subprocess.Popen(
            "npm run dev",
            cwd=frontend_dir,
            shell=True,
            env=os.environ.copy(),
        )
        processes.append(frontend_proc)

        print("\n==================================================")
        print("SUCCESS: BOTH BACKEND AND FRONTEND ARE RUNNING!")
        print("   • Backend API Docs: http://localhost:8000/docs")
        print("   • Frontend Web App: http://localhost:3000")
        print("   • Report Builder: http://localhost:3000/report-builder")
        print("   Press CTRL+C to terminate both servers.")
        print("==================================================\n")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down services...")
        for p in processes:
            p.terminate()
        sys.exit(0)


if __name__ == "__main__":
    main()
