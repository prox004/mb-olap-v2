import subprocess
import sys
import os
import time

def main():
    # Force UTF-8 output encoding for Windows terminal compatibility
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")

    print("==================================================")
    print("STARTING MB-OLAP V2 ENTERPRISE PLATFORM")
    print("==================================================")

    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    processes = []

    try:
        # 1. Start Backend FastAPI Server
        print("1. Launching Backend FastAPI Server (http://localhost:8000)...")
        backend_proc = subprocess.Popen(
            [sys.executable, "backend/run.py"],
            cwd=root_dir,
            shell=True
        )
        processes.append(backend_proc)

        # 2. Start Frontend Next.js Dev Server
        print("2. Launching Frontend Next.js Application (http://localhost:3000)...")
        frontend_proc = subprocess.Popen(
            "npm run dev",
            cwd=frontend_dir,
            shell=True
        )
        processes.append(frontend_proc)

        print("\n==================================================")
        print("SUCCESS: BOTH BACKEND AND FRONTEND ARE RUNNING!")
        print("   • Backend API Docs: http://localhost:8000/docs")
        print("   • Frontend Web App: http://localhost:3000")
        print("   Press CTRL+C to terminate both servers.")
        print("==================================================\n")

        # Keep parent script alive to monitor sub-processes
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down services...")
        for p in processes:
            p.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
