# MB-OLAP V2: ClickHouse ETL Pipeline Guide

## 1. Overview & Operational Principles

The MB-OLAP V2 ClickHouse ETL pipeline (`backend/etl/load_clickhouse.py`) is a reproducible, idempotent, and parametric data pipeline that loads the real retail sales dataset (`data/1april-15sept2025.xlsx`) into the ClickHouse analytical data warehouse (`mb_olap_v2`).

### Core Pipeline Capabilities
1. **Parametric Input:** Accepts any input path via `--input` CLI argument.
2. **Metadata & Header Auto-Detection:** Automatically skips Excel title rows (Rows 1–5), verifies column headers at Row 6, and safely terminates before grand total and empty padding rows.
3. **Signed Negative Value Preservation:** Faithfully ingests negative billed quantities and net sales amounts to preserve sales return semantics.
4. **Idempotent Loading:** Repeated executions truncate/replace target partitions, guaranteeing zero duplicate records.
5. **Strict Mathematical Reconciliation:** Validates record counts, billed units, net revenue, COGS, and gross profit against expected targets before completing.
6. **Rejection Logging:** Logs any malformed rows to `data/rejected_records.csv` without silently dropping records.

---

## 2. CLI Usage & Commands

### Prerequisites
Activate the project's virtual environment:
```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

### Full ETL Execution (Excel to ClickHouse)
```bash
python backend/etl/load_clickhouse.py --input data/1april-15sept2025.xlsx
```

### Validation & Dry-Run Mode (Without Live ClickHouse Server)
If running in an environment where ClickHouse server is not running locally, execute:
```bash
python backend/etl/load_clickhouse.py --input data/1april-15sept2025.xlsx --validate-only
```

### Command-Line Arguments Reference

| Argument | Type | Default | Description |
| :--- | :---: | :--- | :--- |
| `--input` | String | `data/1april-15sept2025.xlsx` | Path to the source retail Excel file |
| `--host` | String | `localhost` (or `$CLICKHOUSE_HOST`) | ClickHouse server host |
| `--port` | Int | `8123` (or `$CLICKHOUSE_PORT`) | ClickHouse HTTP interface port |
| `--database` | String | `mb_olap_v2` (or `$CLICKHOUSE_DATABASE`) | Target database name |
| `--user` | String | `default` (or `$CLICKHOUSE_USER`) | ClickHouse authentication user |
| `--password` | String | `""` (or `$CLICKHOUSE_PASSWORD`) | ClickHouse password |
| `--validate-only` | Flag | `False` | Run full parsing, grain validation and reconciliation without loading to ClickHouse |
| `--rebuild-schema` | Flag | `False` | Execute `sql/clickhouse_schema.sql` to recreate tables before loading |
| `--batch-size` | Int | `50000` | Chunk size for bulk data frame insertion |

---

## 3. Running ClickHouse Locally

### Option A: Docker Compose (Recommended)
1. Ensure Docker Desktop is installed and running.
2. Start the ClickHouse service from the project root:
   ```bash
   docker compose up -d
   ```
3. Check service health:
   ```bash
   docker compose ps
   ```
4. Verify HTTP connectivity:
   ```bash
   curl http://localhost:8123/ping
   # Output: Ok.
   ```
5. Run the ETL:
   ```bash
   python backend/etl/load_clickhouse.py --rebuild-schema
   ```

### Option B: ClickHouse Cloud / Remote Server
Set environment variables:
```bash
# Windows PowerShell
$env:CLICKHOUSE_HOST = "your-cloud-instance.clickhouse.cloud"
$env:CLICKHOUSE_PORT = "8443"
$env:CLICKHOUSE_USER = "default"
$env:CLICKHOUSE_PASSWORD = "your-secure-password"
$env:CLICKHOUSE_DATABASE = "mb_olap_v2"

# Run ETL
python backend/etl/load_clickhouse.py --rebuild-schema
```

---

## 4. Reconciliation Targets & Validation Assertions

The pipeline enforces strict equality assertions:

| Metric | Target Value | Validation Rule |
| :--- | :---: | :--- |
| **Operational Records** | 397,805 | `COUNT(*) == 397,805` |
| **Grain Uniqueness** | 397,805 | `COUNT(DISTINCT store_code \|\| item_code \|\| period_start_date) == 397,805` |
| **Duplicate Keys** | 0 | `Duplicates == 0` |
| **Total Billed Units** | 1,234,990 | `SUM(bill_qty) == 1,234,990` |
| **Total Net Revenue** | ₹331,367,606.00 | `SUM(net_amount) == 331,367,606.00` |
| **Total COGS** | ₹190,626,225.00 | `SUM(cogs) == 190,626,225.00` |
| **Gross Profit** | ₹140,741,381.00 | `SUM(gross_profit) == 140,741,381.00` |
| **Gross Margin %** | 42.47% | `(Gross Profit / Net Revenue) * 100 == 42.47%` |

If any assertion fails, the pipeline raises an exception and outputs the discrepancy.

---

## 5. Troubleshooting & FAQ

### 1. `ConnectionError: ClickHouse connection failed (localhost:8123)`
- **Cause:** ClickHouse server is not running locally on port 8123.
- **Remedy:** Start ClickHouse with `docker compose up -d` or use `--validate-only` for local offline verification.

### 2. `ValueError: Unknown month label: XYZ`
- **Cause:** An unexpected month format appeared in Column 24.
- **Remedy:** Ensure the input file follows the standard M Baazar billing periods (`Apr Q2-25` to `Sep Q3-25`).

### 3. Missing Inventory Metrics (Sell-Through %, WOC, GMROI)
- **Cause:** The input file is a sales ledger, not an inventory ledger.
- **Remedy:** SOH-based metrics require inventory snapshots (`CLOSING_STOCK_QUANTITY`). These are documented as blocked until the SOH feed is provided.
