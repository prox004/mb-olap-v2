import os
import sys
import shutil
import subprocess
import zipfile
import time

def log(msg: str):
    print(f"[BUILD] {msg}")

def main():
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")

    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    frontend_out = os.path.join(frontend_dir, "out")
    backend_dir = os.path.join(root_dir, "backend")
    dist_root = os.path.join(root_dir, "dist")
    app_dist_dir = os.path.join(dist_root, "MB-OLAP-v2")

    log("==================================================")
    log("     BUILDING MB-OLAP V2 STANDALONE PACKAGE       ")
    log("==================================================")

    # 1. Check Frontend Static Export
    if not os.path.isdir(frontend_out) or not os.path.isfile(os.path.join(frontend_out, "index.html")):
        log("Building Frontend Static Export (npm run build)...")
        res = subprocess.run("npm run build", shell=True, cwd=frontend_dir)
        if res.returncode != 0:
            log("ERROR: Frontend build failed!")
            sys.exit(1)

    if not os.path.isdir(frontend_out):
        log(f"ERROR: Frontend out directory not found at {frontend_out}")
        sys.exit(1)

    log(f"Frontend static export verified at: {frontend_out}")

    # 2. Prepare PyInstaller Command / Spec
    launcher_script = os.path.join(backend_dir, "launcher.py")
    datasets_file = os.path.join(backend_dir, "semantic", "reporting", "datasets.yml")

    # Clean previous build/dist folders
    build_temp_dir = os.path.join(root_dir, "build_temp")
    if os.path.exists(build_temp_dir):
        shutil.rmtree(build_temp_dir, ignore_errors=True)
    if os.path.exists(app_dist_dir):
        shutil.rmtree(app_dist_dir, ignore_errors=True)

    # Data files to collect into PyInstaller bundle
    # Format: source;destination
    datas = [
        f"{frontend_out};frontend/out",
    ]
    if os.path.isfile(datasets_file):
        datas.append(f"{datasets_file};backend/semantic/reporting")

    data_args = []
    for d in datas:
        data_args.extend(["--add-data", d])

    log("Running PyInstaller to compile executable bundle...")
    pyinstaller_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=Start-MB-OLAP",
        "--onedir",
        "--console",
        "--noconfirm",
        f"--workpath={build_temp_dir}",
        f"--distpath={dist_root}",
        "--clean",
        "--collect-all=duckdb",
        "--collect-data=pandas",
        "--collect-binaries=pandas",
        "--collect-data=pyarrow",
        "--collect-binaries=pyarrow",
        "--collect-all=openpyxl",
        "--collect-all=fastapi",
        "--collect-all=uvicorn",
        "--collect-all=pydantic",
        "--collect-all=pydantic_settings",
        "--collect-all=groq",
        "--collect-all=yaml",
        "--exclude-module=pandas.tests",
        "--exclude-module=pyarrow.tests",
        "--exclude-module=numpy.tests",
    ] + data_args + [launcher_script]

    log(f"Executing: {' '.join(pyinstaller_cmd[:6])} ...")
    res = subprocess.run(pyinstaller_cmd, cwd=root_dir)
    if res.returncode != 0:
        log("ERROR: PyInstaller build failed!")
        sys.exit(1)

    # PyInstaller creates dist/Start-MB-OLAP folder when using --onedir
    compiled_folder = os.path.join(dist_root, "Start-MB-OLAP")
    if os.path.exists(compiled_folder):
        if os.path.exists(app_dist_dir):
            shutil.rmtree(app_dist_dir, ignore_errors=True)
        os.rename(compiled_folder, app_dist_dir)

    log(f"Executable bundle generated at: {app_dist_dir}")

    # 3. Copy Database Files and Datasets YAML to dist/MB-OLAP-v2/
    dist_db_dir = os.path.join(app_dist_dir, "db")
    os.makedirs(dist_db_dir, exist_ok=True)

    src_duckdb = os.path.join(backend_dir, "db", "olap_warehouse.duckdb")
    src_reports_db = os.path.join(backend_dir, "db", "reports.db")

    if os.path.isfile(src_duckdb):
        log(f"Copying DuckDB warehouse ({os.path.getsize(src_duckdb) // (1024*1024)} MB)...")
        shutil.copy2(src_duckdb, os.path.join(dist_db_dir, "olap_warehouse.duckdb"))
    else:
        log(f"WARNING: DuckDB file not found at {src_duckdb}")

    if os.path.isfile(src_reports_db):
        log("Copying SQLite reports database...")
        shutil.copy2(src_reports_db, os.path.join(dist_db_dir, "reports.db"))
    else:
        log(f"WARNING: Reports DB file not found at {src_reports_db}")

    # Copy semantic reporting datasets.yml as explicit fallback
    dist_semantic_dir = os.path.join(app_dist_dir, "backend", "semantic", "reporting")
    os.makedirs(dist_semantic_dir, exist_ok=True)
    if os.path.isfile(datasets_file):
        log("Copying semantic reporting datasets configuration...")
        shutil.copy2(datasets_file, os.path.join(dist_semantic_dir, "datasets.yml"))

    # 4. Create README.txt for non-technical user
    readme_path = os.path.join(app_dist_dir, "HOW_TO_RUN.txt")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("""==============================================================
   M BAAZAR OLAP V2 ENTERPRISE PLATFORM - USER GUIDE
==============================================================

HOW TO RUN:
1. Double-click "Start-MB-OLAP.exe" inside this folder.
2. The application server will start in a console window.
3. Your default web browser will open automatically to:
   http://localhost:8000

NOTE FOR TESTING:
- Do NOT close the console window while using MB-OLAP V2.
- When done, simply close the console window or press Ctrl+C.
- All your created reports are automatically saved in the "db" folder.
==============================================================
""")
    log("Created HOW_TO_RUN.txt instruction guide.")

    # 5. Create Standalone ZIP package
    zip_path = os.path.join(dist_root, "MB-OLAP-v2-Standalone.zip")
    log(f"Creating standalone ZIP archive at {zip_path} ...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(app_dist_dir):
            for file in files:
                abs_file = os.path.join(root, file)
                rel_file = os.path.relpath(abs_file, app_dist_dir)
                zipf.write(abs_file, os.path.join("MB-OLAP-v2", rel_file))

    # 6. Clean up intermediate build_temp directory
    if os.path.exists(build_temp_dir):
        log("Cleaning up temporary build files...")
        shutil.rmtree(build_temp_dir, ignore_errors=True)

    zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    log("==================================================")
    log(" SUCCESS: STANDALONE PACKAGE BUILT SUCCESSFULLY! ")
    log(f" Distribution Directory: {app_dist_dir}")
    log(f" Distribution ZIP File:  {zip_path} ({zip_size_mb:.1f} MB)")
    log("==================================================")

if __name__ == "__main__":
    main()
