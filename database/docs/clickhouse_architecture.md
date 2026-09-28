# MB-OLAP V2: ClickHouse Analytical Warehouse Architecture

## 1. Architectural Philosophy & Objective

MB-OLAP V2 is an enterprise retail OLAP engine designed for high-concurrency analytical querying across multi-tier retail hierarchies (Divisions, Sections, Departments, SKUs) and geographic store clusters (West Bengal, Odisha, Assam).

To handle the scale of operational retail datasets with sub-second query latency, the warehouse extends from a file-based DuckDB engine to a distributed/columnar **ClickHouse** dimensional warehouse while maintaining seamless coexistence.

```
+-------------------------------------------------------------------------+
|                        MB-OLAP V2 SYSTEM ARCHITECTURE                   |
+-------------------------------------------------------------------------+

  [ Raw Data Sources ]
           |
           +---> Actual Retail Sales Ledger (`data/1april-15sept2025.xlsx`)
           |
           v
  [ Python ETL Pipeline (`backend/etl/load_clickhouse.py`) ]
           |
           +---> 1. Extraction & Validation (Zero-loss streaming)
           +---> 2. Pre-load Reconciliation against Mathematical Targets
           +---> 3. Dimension Extraction & Deduplication
           +---> 4. Idempotent Fact Partition Loading
           |
           v
  [ ClickHouse Analytical Data Warehouse (`mb_olap_v2`) ]
  +---------------------------------------------------------------------+
  |  Staging Layer:                                                     |
  |    • `stg_sales_excel_raw` (Raw audit mirror)                       |
  |                                                                     |
  |  Dimensional Star Schema:                                           |
  |    • `dim_date` (Calendar dimension)                                |
  |    • `dim_location` (6 Cluster stores across WB, ODS, ASSAM)        |
  |    • `dim_product` (95,071 Unique SKUs, 6 Divisions, 173 Depts)    |
  |    • `fact_sales_monthly` (397,805 records, Partitioned by Month)   |
  |                                                                     |
  |  Materialized / Star-Schema Views:                                  |
  |    • `v_fact_sales_enriched` (Enriched star-schema join)            |
  |    • `v_category_performance_summary` (Hierarchy rollups)           |
  |    • `v_store_performance_summary` (Store & State rollups)          |
  |    • `v_monthly_sales_trend` (Timeline sales & margins)             |
  +---------------------------------------------------------------------+
           |
           v
  [ Backend Access & API Layer (`backend/app/`) ]
           |
           +---> `backend/db/clickhouse.py` (Thread-safe connection pool)
           +---> FastAPI Analytical Endpoints (`/api/v1/executive`, etc.)
           +---> Dual-Warehouse fallback (ClickHouse primary, DuckDB local)
```

---

## 2. Dimensional Star Schema Design

### Fact Table: `fact_sales_monthly`
- **Business Grain:** Exactly **one record per Store (`store_code`), Item (`item_code`), and Billing Month (`period_start_date`)**.
- **Engine:** `MergeTree()`
- **Partition Key:** `toYYYYMM(period_start_date)`
  - *Rationale:* Divides the 397,805 records into 6 monthly data parts (`202504` to `202509`). This enables lightning-fast partition pruning during month-filtered queries and allows atomic `DROP PARTITION` or `REPLACE PARTITION` during incremental monthly ETL runs without touching historical data.
- **Sorting / Primary Key:** `(store_code, item_code, period_start_date)`
  - *Rationale:* Retail analytical queries are overwhelmingly filtered by store or rolled up by product. Colocating data physically on disk by `store_code` followed by `item_code` ensures primary index sparse lookups read minimal granules from disk.
- **Measures Stored:**
  - `bill_qty Int32`: Net units sold/returned (preserving signed negatives).
  - `net_amount Decimal(12, 2)`: Net billed sales revenue in INR.
  - `cogs Decimal(12, 2)`: Cost of Goods Sold in INR.
  - `gross_profit Decimal(12, 2)`: Calculated `net_amount - cogs`.
  - `unit_rsp Decimal(10, 2)`: Retail Selling Price / Tag MRP.

### Dimension Table: `dim_product`
- **Natural Primary Key:** `item_code`
- **Engine:** `ReplacingMergeTree(updated_at)`
- **Sorting / Primary Key:** `item_code`
- **Verified Record Count:** 95,071 unique items.
- **Attributes:**
  - Hierarchy: `division`, `section`, `department`, `group_alias`, `article_name`.
  - Classifications: `category1` (silhouette), `category2` (brand), `category3` (pattern), `category4` (fit), `category5` (size), `category6` (packaging).
  - Variant specs: `colour` (`Desc1`), `vendor_name` (`Desc2`), `style_code` (`Desc3`).
  - Pricing & Lifecycle: `rsp`, `generated_date`, `last_stock_in_date`.
- *Rationale for `ReplacingMergeTree`:* Allows background deduplication and seamless in-place attribute enrichment if new vendor names or sizing corrections are ingested.

### Dimension Table: `dim_location`
- **Natural Primary Key:** `store_code`
- **Engine:** `MergeTree()`
- **Sorting / Primary Key:** `store_code`
- **Verified Record Count:** 6 retail stores.
- **Attributes:** `store_code`, `admsite_code`, `store_name`, `state`, `site_type`.

### Dimension Table: `dim_date`
- **Natural Primary Key:** `date`
- **Engine:** `MergeTree()`
- **Sorting / Primary Key:** `date`
- **Attributes:** `date`, `year`, `quarter`, `month`, `month_name`, `month_period_label`, `day_of_month`, `day_of_week`, `day_name`, `is_weekend`.

---

## 3. Coexistence Strategy with DuckDB

1. **Zero Destructive Changes:** The existing database file `backend/db/olap_warehouse.duckdb` and all parquet files in `backend/db/parquet/` remain completely intact.
2. **Unified Backend Configuration:** In `backend/app/config.py`, the setting `WAREHOUSE_BACKEND` defaults to `"duckdb"` or `"clickhouse"` via the environment variable:
   ```bash
   WAREHOUSE_BACKEND=clickhouse
   ```
3. **Database Client Abstraction:** `backend/db/clickhouse.py` provides high-performance connection pooling via `clickhouse-connect`, while `backend/app/db/session.py` continues to provide DuckDB sessions for legacy features.

---

## 4. Performance & Scalability Considerations

- **Column Compression:** ClickHouse automatically applies `LZ4` / `ZSTD` compression on MergeTree columns. For low-cardinality string columns (`state`, `division`, `section`, `department`, `store_code`), `LowCardinality(String)` applies dictionary encoding, shrinking memory footprint by 85–90%.
- **Financial Precision:** Financial amounts use `Decimal(12, 2)` instead of `Float64`, completely preventing IEEE 754 floating-point rounding anomalies across millions of transactions.
