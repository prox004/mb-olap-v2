import os
import sys
import time
import threading
import webbrowser
import urllib.request
import urllib.error
import uvicorn

def get_base_dir() -> str:
    """Returns the base directory of the application (executable location or repo root)."""
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller executable
        return os.path.dirname(sys.executable)
    # Running in normal python script mode
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def get_bundle_dir() -> str:
    """Returns PyInstaller temporary unpack dir (_MEIPASS) or repo root."""
    if getattr(sys, 'frozen', False):
        return getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def open_browser_when_ready(health_url: str, app_url: str):
    """Poll health endpoint and open browser when server is ready."""
    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(health_url, timeout=2) as resp:
                if resp.status == 200:
                    print(f"\n[INFO] Backend API is ready! Opening MB-OLAP V2 in browser...")
                    webbrowser.open(app_url)
                    return
        except Exception:
            pass
        time.sleep(1)

def main():
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")

    base_dir = get_base_dir()
    bundle_dir = get_bundle_dir()

    db_path = os.path.join(base_dir, "db", "olap_warehouse.duckdb")
    reports_db_path = os.path.join(base_dir, "db", "reports.db")
    datasets_yaml_path = os.path.join(bundle_dir, "backend", "semantic", "reporting", "datasets.yml")

    # Fallback to bundle dir if db not in base_dir
    if not os.path.isfile(db_path):
        db_path = os.path.join(bundle_dir, "backend", "db", "olap_warehouse.duckdb")
    if not os.path.isfile(reports_db_path):
        reports_db_path = os.path.join(bundle_dir, "backend", "db", "reports.db")
    if not os.path.isfile(datasets_yaml_path):
        datasets_yaml_path = os.path.join(base_dir, "backend", "semantic", "reporting", "datasets.yml")

    os.environ["DUCKDB_PATH"] = db_path
    os.environ["REPORTS_DB_PATH"] = reports_db_path
    os.environ["DATASETS_YAML_PATH"] = datasets_yaml_path
    os.environ["PYTHONPATH"] = bundle_dir

    # Add bundle directory to sys.path
    if bundle_dir not in sys.path:
        sys.path.insert(0, bundle_dir)

    print("==================================================")
    print("      M BAAZAR OLAP V2 ENTERPRISE PLATFORM        ")
    print("==================================================")
    print(f" App Directory:  {base_dir}")
    print(f" DuckDB Path:    {db_path}")
    print(f" Reports DB:     {reports_db_path}")
    print(f" Datasets YAML:  {datasets_yaml_path}")
    print("==================================================")

    if not os.path.isfile(db_path):
        print(f"\n[ERROR] DuckDB database file not found at: {db_path}")
        print("Please place 'olap_warehouse.duckdb' inside the 'db' folder.")
        input("\nPress ENTER to exit...")
        sys.exit(1)

    port = 8000
    app_url = f"http://localhost:{port}"
    health_url = f"{app_url}/api/v1/health"

    # Start browser opener in background thread
    threading.Thread(target=open_browser_when_ready, args=(health_url, app_url), daemon=True).start()

    print(f"\n[INFO] Starting Server on {app_url} ...")
    print("[INFO] Do NOT close this window while using the application.\n")

    try:
        from backend.app.main import app
        uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped by user.")
    except Exception as e:
        print(f"\n[ERROR] Server error: {e}")
        input("\nPress ENTER to exit...")

if __name__ == "__main__":
    main()
