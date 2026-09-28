# MB-OLAP V2: Deployment & Operations Guide

This guide details the deployment, environment configuration, database ingestion, testing, and operational management of the **MB-OLAP V2** retail analytics platform.

---

## 1. Prerequisites

Before deploying the application, ensure the host system has the following installed:

- **Git**: Version control client (`git --version`)
- **Python**: Version 3.10, 3.11, 3.12, or 3.13 (`python --version`)
- **Node.js & npm**: Node.js v18+ or v20+ (`node --version`, `npm --version`)
- **Docker Desktop** *(Required only for local ClickHouse containerization)*: Docker engine with Compose V2 support (`docker compose version`)

> [!NOTE]
> If deploying against a remote ClickHouse cluster or ClickHouse Cloud, Docker Desktop on the local host is **not required**. The backend connects over HTTP/HTTPS using standard TCP sockets.

---

## 2. Installation & Dependency Setup

### A. Python Backend Virtual Environment
Clone or navigate to the repository root:
```powershell
# Create virtual environment if not already present
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt
```

### B. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## 3. Environment Configuration

Copy the provided [.env.example](file:///.env.example) to `.env`:
```powershell
Copy-Item .env.example .env
```

Configure variables based on your deployment topology:

| Environment Variable | Description | Default / Example | Target Mode |
| :--- | :--- | :--- | :--- |
| `WAREHOUSE_BACKEND` | Active analytical engine (`clickhouse` or `duckdb`) | `clickhouse` | All |
| `CLICKHOUSE_HOST` | Hostname or IP of ClickHouse server | `localhost` | ClickHouse |
| `CLICKHOUSE_PORT` | HTTP interface port (8123 plain HTTP / 8443 HTTPS) | `8123` | ClickHouse |
| `CLICKHOUSE_DATABASE` | Target database catalog | `mb_olap_v2` | ClickHouse |
| `CLICKHOUSE_USER` | ClickHouse user account | `default` | ClickHouse |
| `CLICKHOUSE_PASSWORD` | ClickHouse user password | `""` (or secure password) | ClickHouse |
| `DUCKDB_PATH` | Path to legacy DuckDB database file | `backend/db/olap_warehouse.duckdb` | DuckDB |
| `REPORTS_DB_PATH` | Path to report configuration SQLite/DuckDB | `backend/db/reports.db` | All |

> [!IMPORTANT]
> Never commit `.env` or production passwords into version control. Real credentials must be injected via secure secret managers or container environment flags.

---

## 4. ClickHouse Startup (Local Docker)

When running ClickHouse locally via Docker Compose:
```bash
# Start ClickHouse container in background
docker compose up -d

# Verify container is healthy
docker compose ps

# Check HTTP ping endpoint
curl -s http://localhost:8123/ping
# Expected output: Ok.
```

The container automatically maps:
- `8123`: ClickHouse HTTP REST API & Web interface
- `9000`: ClickHouse Native TCP client port
- Persistent volume `clickhouse_data` for durable storage across restarts.
- Auto-initializes schema DDL from [sql/clickhouse_schema.sql](file:///sql/clickhouse_schema.sql).

---

## 5. Source Data Ingestion & Reconciliation

The platform ingests the actual retail dataset from `data/1april-15sept2025.xlsx`.

### A. Execute ClickHouse ETL Ingestion
```powershell
.venv\Scripts\python backend/etl/load_clickhouse.py
```

### B. Verified Data Totals & Grain Integrity
The ETL automatically reconciles extracted fact rows against verified source targets:

- **Source Dataset:** `data/1april-15sept2025.xlsx`
- **Time Coverage:** April 1, 2025 – September 15, 2025 (6 monthly cycles)
- **Fact Table Grain:** `Store (store_code) × Item Code (item_code) × Sales Month (period_start_date)`
- **Operational Records:** **397,805** (Rows 6 to 397,811; row 397,812 is summary total)
- **Fact Grain Uniqueness:** **397,805 unique combinations** (**0 duplicates**)
- **Catalog SKUs (`dim_product`):** **95,071** unique items
- **Physical Stores (`dim_location`):** **6** retail stores (Gariahat, Andul Road, Bhubaneswar, Berhampur City, Silchar, Tezpur)
- **Net Sales Revenue:** **₹331,367,606.00**
- **Billed Units Sold:** **1,234,990**
- **Cost of Goods Sold (COGS):** **₹190,626,225.00**
- **Gross Profit:** **₹140,741,381.00**
- **Gross Margin %:** **42.47%**
- **Average Selling Price (ASP):** **₹268.32**

### C. Negative Value & Return Logic
- Raw and fact storage preserves signed values:
  - Negative quantity records: **624** (-631 units)
  - Negative revenue records: **647** (-₹345,132.00)
  - Negative COGS records: **624** (-₹195,659.00)
- Preserves signed numbers in storage; `ABS()` is applied strictly at presentation where business rules require it.

---

## 6. Inventory Metric Guardrails (Crucial Data Policy)

> [!WARNING]
> The 2025 sales dataset is exclusively a **billed POS transaction ledger**. It does **not** contain Stock-On-Hand (SOH) balance snapshots, opening inventory, closing stock valuations, purchase order receipts, or promotional coupon breakdowns.

To prevent misinforming business stakeholders:
1. **GMROI (`/api/v1/financial/gmroi`):** Explicitly returns `supported: false` and `data: null`.
2. **Inventory KPIs (Sell-Through %, WOC, Closing Stock Valuation & Units):** Return `null` / `None`.
3. **No Fabrication:** The backend strictly forbids substituting `0.0`, `999.0`, or synthetic estimates for unavailable inventory metrics.
4. **UI Display:** Frontend components render `"N/A"` with the tooltip/notice: `"Not available — requires inventory/SOH data"`.

---

## 7. Starting the Application

### A. Run Backend in ClickHouse Mode
```powershell
$env:WAREHOUSE_BACKEND="clickhouse"
.venv\Scripts\uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### B. Run Backend in Legacy DuckDB Mode
```powershell
$env:WAREHOUSE_BACKEND="duckdb"
.venv\Scripts\uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### C. Run Frontend Application
```bash
cd frontend
npm run dev
# Accessible at: http://localhost:3000
```

### D. Build Frontend for Production
```bash
cd frontend
npm run build
npm run start
```

---

## 8. Verifying API Health & Available Endpoints

### A. Health Check Verification
```bash
curl -s http://localhost:8000/api/v1/health
```
**Expected Response (ClickHouse Online):**
```json
{
  "success": true,
  "message": "MB-OLAP V2 Analytical API is healthy",
  "data": {
    "status": "online",
    "warehouse_backend": "clickhouse",
    "database": "ClickHouse connected (mb_olap_v2)",
    "fact_records": 397805
  }
}
```

### B. Available API Endpoints

| Method | Endpoint | Description | ClickHouse Mode Behavior |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health & warehouse connection | Reports active backend and record count |
| `GET` | `/api/v1/months` | Distinct billing cycles | Returns 6 monthly cycles |
| `GET` | `/api/v1/locations` | Store locations lookup | Returns 6 retail stores |
| `GET` | `/api/v1/executive/kpis` | Executive summary KPIs | Reconciled sales metrics; inventory metrics `null` |
| `GET` | `/api/v1/executive/store-rankings`| Store revenue & margin ranking | 6 stores ranked; stock fields `null` |
| `GET` | `/api/v1/executive/top-bottom-skus`| Top and bottom revenue SKUs | Ranked by sales revenue; stock units `null` |
| `GET` | `/api/v1/executive/monthly-trends`| Monthly sales & profit trend | 6 months; `inventory_value: null` |
| `GET` | `/api/v1/category/matrix` | Category performance quadrant | Margin & volume driver analysis; stock `null` |
| `GET` | `/api/v1/category/growth` | Period-over-period category growth | Revenue & volume growth rates |
| `GET` | `/api/v1/financial/gmroi` | GMROI analysis | Returns `supported: false`, `data: null` |
| `GET` | `/api/v1/vendor/scorecard` | Vendor performance metrics | Revenue, units, profit, and margin % |

---

## 9. Automated Testing

Run the full automated test suite:
```powershell
.venv\Scripts\python -m unittest discover -s tests -v
```
**Expected Test Results:**
- `test_backend_integration.py`: 13 tests passed
- `test_clickhouse_pipeline.py`: 7 tests passed
- **Total: 20 passed, 0 failed, 0 errors (100% OK)**

---

## 10. Production / Remote ClickHouse Deployment

To connect to a managed ClickHouse cluster (e.g. ClickHouse Cloud, AWS, GCP, self-hosted Linux VM):

1. Set the connection variables in `.env` or container environment:
   ```ini
   WAREHOUSE_BACKEND=clickhouse
   CLICKHOUSE_HOST=your-cluster.clickhouse.cloud
   CLICKHOUSE_PORT=8443
   CLICKHOUSE_DATABASE=mb_olap_v2
   CLICKHOUSE_USER=default
   CLICKHOUSE_PASSWORD=your_secure_password
   ```
2. Run database migration / schema creation:
   ```bash
   clickhouse-client --host $CLICKHOUSE_HOST --port 9000 --user $CLICKHOUSE_USER --password $CLICKHOUSE_PASSWORD --queries-file sql/clickhouse_schema.sql
   ```
3. Ingest the dataset:
   ```powershell
   .venv\Scripts\python backend/etl/load_clickhouse.py --host $CLICKHOUSE_HOST --port 8443 --user $CLICKHOUSE_USER --password $CLICKHOUSE_PASSWORD
   ```
4. Start backend and frontend services.
