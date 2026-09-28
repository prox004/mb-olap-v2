# MB-OLAP V2: Backend Integration & Warehouse Selection Guide

This document describes how the MB-OLAP V2 FastAPI backend selects, queries, and switches between warehouse backends: **DuckDB** and **ClickHouse**.

---

## 1. Overview & Architectural Design

The backend database access layer has been unified through dependency injection in `backend/app/db/session.py`.

```
                    FastAPI Request
                          |
                          v
                 Depends(get_db)
                          |
             [ WAREHOUSE_BACKEND check ]
             /                         \
            /                           \
  WAREHOUSE_BACKEND=duckdb    WAREHOUSE_BACKEND=clickhouse
          |                               |
          v                               v
  DuckDB Connection            ClickHouse Warehouse Adapter
  (olap_warehouse.duckdb)       (clickhouse_connect client)
          |                               |
          v                               v
  Legacy ERP Cube Data          Actual 2025 Retail Dataset
  (3.27M rows, demo sites)      (397,805 rows, 6 cluster stores)
```

The database adapter implements the DB-API standard:
- `.execute(query, parameters)`
- `.fetchall()`
- `.fetchone()`
- `.df()`

This means FastAPI endpoint routers execute without requiring code modifications when switching backends.

---

## 2. Configuration & Environment Variables

The warehouse backend and connection details are managed entirely via environment variables. **No credentials or connection strings are hard-coded in the source code.**

| Environment Variable | Allowed Values | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `WAREHOUSE_BACKEND` | `duckdb`, `clickhouse` | `duckdb` | Controls which warehouse engine handles analytical queries |
| `CLICKHOUSE_HOST` | Hostname / IP | `localhost` | ClickHouse server host address |
| `CLICKHOUSE_PORT` | Port number | `8123` | ClickHouse HTTP interface port |
| `CLICKHOUSE_DATABASE`| Database name | `mb_olap_v2` | Target analytical warehouse database |
| `CLICKHOUSE_USER` | Username | `default` | ClickHouse authentication user |
| `CLICKHOUSE_PASSWORD`| Password string | `""` | ClickHouse password (empty for local dev) |
| `DUCKDB_PATH` | File path | `backend/db/olap_warehouse.duckdb` | Path to persistent DuckDB database |

---

## 3. How to Switch Warehouse Backends

### Mode 1: DuckDB Mode (Default)
In DuckDB mode, the backend connects to `backend/db/olap_warehouse.duckdb`:
```powershell
# Windows PowerShell
$env:WAREHOUSE_BACKEND = "duckdb"
python backend/run.py
```
- Health Check (`GET /api/v1/health`):
  ```json
  {
    "success": true,
    "data": {
      "status": "online",
      "warehouse_backend": "duckdb",
      "database": "DuckDB connected (read-only)",
      "fact_records": 3279190
    }
  }
  ```

### Mode 2: ClickHouse Mode
In ClickHouse mode, analytical queries are routed to ClickHouse:
```powershell
# Windows PowerShell
$env:WAREHOUSE_BACKEND = "clickhouse"
$env:CLICKHOUSE_HOST = "localhost"
$env:CLICKHOUSE_PORT = "8123"
$env:CLICKHOUSE_DATABASE = "mb_olap_v2"
python backend/run.py
```
- Health Check (`GET /api/v1/health`):
  ```json
  {
    "success": true,
    "data": {
      "status": "online",
      "warehouse_backend": "clickhouse",
      "database": "ClickHouse connected (localhost:8123)",
      "fact_records": 397805
    }
  }
  ```

---

## 4. How to Start ClickHouse Locally

### Using Docker Compose
From the project root:
```bash
docker compose up -d
```
Verify container status:
```bash
docker compose ps
curl http://localhost:8123/ping
# Response: Ok.
```

To load the 2025 actual dataset:
```bash
python backend/etl/load_clickhouse.py --rebuild-schema
```

---

## 5. Result & Scope Comparison: DuckDB vs. ClickHouse

| Business Dimension | DuckDB (Legacy Cube) | ClickHouse (Actual 2025 Dataset) | Reason for Difference |
| :--- | :--- | :--- | :--- |
| **Data Scope** | ERP Inventory Monthly Cube | Actual POS Billed Sales Ledger | Different operational sources |
| **Date Horizon** | Pre-2025 / Demo cycles | **1 April 2025 – 15 September 2025** | Target reporting period |
| **Operational Records** | 3,279,190 rows | **397,805 rows** | Actual 2025 sales grain |
| **Net Sales Revenue** | ₹88,594,010.36 | **₹331,367,606.00** | Full 6-month enterprise retail sales |
| **Total Units Sold** | 383,255 units | **1,234,990 units** | Full retail network volume |
| **Cost of Goods Sold (COGS)** | ₹56,351,673.79 | **₹190,626,225.00** | Landed product cost for 2025 |
| **Gross Profit** | ₹32,242,336.57 | **₹140,741,381.00** | Revenue minus COGS |
| **Gross Margin %** | 36.39% | **42.47%** | Margin performance in FY25-26 |
| **Active Retail Stores**| 4 stores | **6 stores** (`GRHAT`, `ANDUL RD`, `BBSR`, `BRHMPR ODS`, `SLCHR`, `TZPUR`) | Expanded store network |
| **Stock-on-Hand (SOH)**| Available (`CLOSING_STOCK_QUANTITY`)| **Unavailable** | Current Excel is sales-only; inventory KPIs blocked |

---

## 6. How to Run Validation

### Dry-Run ETL Pipeline Validation
You can validate the entire source Excel extraction, grain uniqueness, signed negative preservation, and financial reconciliation without needing an active ClickHouse server:
```powershell
python backend/etl/load_clickhouse.py --validate-only
```
This generates the full validation report at `docs/clickhouse_validation_report.md`.

### Run Test Suites
Run all backend integration and ClickHouse ETL unit tests:
```powershell
python -m unittest discover -s tests -v
```
To run specific test modules:
```powershell
# Backend integration & warehouse switching tests
python -m unittest tests.test_backend_integration -v

# ClickHouse ETL pipeline & financial reconciliation tests
python -m unittest tests.test_clickhouse_pipeline -v
```

---

## 7. Troubleshooting ClickHouse Connectivity

### Problem 1: `ConnectionError: ClickHouse connection failed (localhost:8123)`
- **Symptom:** Backend logs connection error or health check reports `status: degraded`.
- **Cause:** ClickHouse server is not running on port 8123.
- **Resolution:**
  1. Start ClickHouse via `docker compose up -d`.
  2. If running without Docker, switch to DuckDB mode:
     ```powershell
     $env:WAREHOUSE_BACKEND = "duckdb"
     ```

### Problem 2: Port Collision (Port 8123 in use)
- **Symptom:** Docker or ClickHouse fails to bind to port 8123.
- **Resolution:** Configure a custom port via `CLICKHOUSE_HTTP_PORT=8124` in `.env` and update `CLICKHOUSE_PORT=8124`.
