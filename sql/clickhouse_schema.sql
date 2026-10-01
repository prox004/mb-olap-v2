-- ============================================================================
-- MB-OLAP V2 ENTERPRISE RETAIL ANALYTICAL DATA WAREHOUSE (CLICKHOUSE DDL)
-- Source: Actual Retail Sales Dataset (1 April 2025 - 15 September 2025)
-- Verified Grain: Store x Item Code x Month (397,805 unique records)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS mb_olap_v2;
USE mb_olap_v2;

-- ----------------------------------------------------------------------------
-- 1. STAGING TABLE (Raw Ingestion Layer)
-- Preserves raw values, signed negatives, and uncast text fields
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stg_sales_excel_raw (
    source_state        String,
    source_short_name   String,
    bill_qty            Nullable(Int32),
    net_amt             Nullable(Decimal(12, 2)),
    cogs2               Nullable(Decimal(12, 2)),
    division            String,
    section             String,
    department          String,
    group_alias         String,
    article_name        String,
    item_code           String,
    category1           String,
    category2           String,
    category3           Nullable(String),
    category4           Nullable(String),
    category5           Nullable(String),
    category6           String,
    rsp                 Nullable(Decimal(10, 2)),
    desc1               Nullable(String),
    desc2               Nullable(String),
    desc3               Nullable(String),
    generated           Nullable(DateTime),
    last_stock_in_date  Nullable(DateTime),
    bill_date_month     String,
    ingested_at         DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (source_short_name, item_code, bill_date_month);

-- ----------------------------------------------------------------------------
-- 2. DIMENSION: DATE / MONTH (Calendar Dimension)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_date (
    date                Date,
    year                UInt16,
    quarter             UInt8,
    month               UInt8,
    month_name          LowCardinality(String),
    month_period_label  LowCardinality(String),
    day_of_month        UInt8,
    day_of_week         UInt8,
    day_name            LowCardinality(String),
    is_weekend          UInt8
) ENGINE = MergeTree()
ORDER BY date;

-- ----------------------------------------------------------------------------
-- 3. DIMENSION: LOCATION / STORE (Retail Network)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_location (
    store_code          LowCardinality(String),
    admsite_code        Nullable(Int32),
    store_name          String,
    state               LowCardinality(String),
    site_type           LowCardinality(String),
    Name                String ALIAS store_name,
    ADMSITE_CODE        Nullable(Int32) ALIAS admsite_code,
    SITE_TYPE           LowCardinality(String) ALIAS site_type
) ENGINE = MergeTree()
ORDER BY store_code;

-- ----------------------------------------------------------------------------
-- 4. DIMENSION: PRODUCT / ITEM MASTER (Taxonomy & Attributes)
-- 95,071 Unique Verified Items with 100% Deterministic Hierarchy
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_product (
    item_code           String,
    article_name        String,
    division            LowCardinality(String),
    section             LowCardinality(String),
    department          LowCardinality(String),
    group_alias         LowCardinality(String),
    category1           LowCardinality(String),
    category2           String,
    category3           Nullable(String),
    category4           Nullable(String),
    category5           Nullable(String),
    category6           LowCardinality(String),
    colour              LowCardinality(String),
    vendor_name         Nullable(String),
    style_code          Nullable(String),
    rsp                 Decimal(10, 2),
    generated_date      Nullable(Date),
    last_stock_in_date  Nullable(Date),
    updated_at          DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY item_code;

-- ----------------------------------------------------------------------------
-- 5. FACT TABLE: MONTHLY SALES (Fact Sales Core)
-- Fact Grain: Store x Item Code x Month
-- Partitioned by Month, Ordered by (store_code, item_code, period_start_date)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_sales_monthly (
    period_start_date   Date,
    period_end_date     Date,
    period_month_label  LowCardinality(String),
    store_code          LowCardinality(String),
    item_code           String,
    bill_qty            Int32,
    net_amount          Decimal(12, 2),
    cogs                Decimal(12, 2),
    gross_profit        Decimal(12, 2),
    unit_rsp            Decimal(10, 2),
    created_at          DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(period_start_date)
ORDER BY (store_code, item_code, period_start_date);

-- ----------------------------------------------------------------------------
-- 6. ANALYTICAL STAR-SCHEMA VIEWS
-- ----------------------------------------------------------------------------

-- Enriched Fact View joining Dimensions
CREATE OR REPLACE VIEW v_fact_sales_enriched AS
SELECT
    f.period_start_date AS period_start_date,
    f.period_end_date AS period_end_date,
    f.period_month_label AS period_month_label,
    f.store_code AS store_code,
    l.store_name AS store_name,
    l.state AS state,
    l.site_type AS site_type,
    f.item_code AS item_code,
    p.article_name AS article_name,
    p.division AS division,
    p.section AS section,
    p.department AS department,
    p.group_alias AS group_alias,
    p.category1 AS category1,
    p.category2 AS category2,
    p.category3 AS category3,
    p.category4 AS category4,
    p.category5 AS category5,
    p.category6 AS category6,
    p.colour AS colour,
    p.vendor_name AS vendor_name,
    p.style_code AS style_code,
    f.bill_qty AS bill_qty,
    f.net_amount AS net_amount,
    f.cogs AS cogs,
    f.gross_profit AS gross_profit,
    f.unit_rsp AS unit_rsp,
    CASE
        WHEN f.bill_qty != 0 THEN round(f.net_amount / f.bill_qty, 2)
        ELSE f.unit_rsp
    END AS effective_asp,
    CASE
        WHEN f.net_amount != 0 THEN round((f.gross_profit / f.net_amount) * 100.0, 2)
        ELSE 0.0
    END AS margin_pct
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
LEFT JOIN dim_location l ON f.store_code = l.store_code;

-- Category Hierarchy Performance Summary
CREATE OR REPLACE VIEW v_category_performance_summary AS
SELECT
    division,
    section,
    department,
    count(DISTINCT item_code) AS total_skus,
    sum(bill_qty)             AS total_sales_units,
    sum(net_amount)           AS total_net_revenue,
    sum(cogs)                 AS total_cogs,
    sum(gross_profit)         AS total_gross_profit,
    CASE 
        WHEN sum(net_amount) != 0 THEN round((sum(gross_profit) / sum(net_amount)) * 100.0, 2)
        ELSE 0.0 
    END                       AS gross_margin_pct
FROM v_fact_sales_enriched
GROUP BY division, section, department;

-- Category Hierarchy Summary (Compatibility view for self-service reporting)
CREATE OR REPLACE VIEW v_category_hierarchy_summary AS
SELECT
    division,
    section,
    department,
    department                AS department_alias,
    total_net_revenue         AS net_revenue,
    total_sales_units         AS sales_units,
    total_gross_profit        AS gross_profit,
    gross_margin_pct          AS margin_pct,
    0.0                       AS closing_stock_value,
    0.0                       AS closing_stock_units,
    0.0                       AS sell_through_pct,
    999.0                     AS woc
FROM v_category_performance_summary;

-- Store Performance Summary
CREATE OR REPLACE VIEW v_store_performance_summary AS
SELECT
    state,
    store_code,
    store_name,
    count(DISTINCT item_code) AS total_skus_sold,
    sum(bill_qty)             AS total_sales_units,
    sum(net_amount)           AS total_net_revenue,
    sum(cogs)                 AS total_cogs,
    sum(gross_profit)         AS total_gross_profit,
    CASE 
        WHEN sum(net_amount) != 0 THEN round((sum(gross_profit) / sum(net_amount)) * 100.0, 2)
        ELSE 0.0 
    END                       AS gross_margin_pct
FROM v_fact_sales_enriched
GROUP BY state, store_code, store_name;

-- Monthly Performance Trend
CREATE OR REPLACE VIEW v_monthly_sales_trend AS
SELECT
    period_start_date,
    period_month_label,
    sum(bill_qty)             AS total_sales_units,
    sum(net_amount)           AS total_net_revenue,
    sum(cogs)                 AS total_cogs,
    sum(gross_profit)         AS total_gross_profit,
    CASE 
        WHEN sum(net_amount) != 0 THEN round((sum(gross_profit) / sum(net_amount)) * 100.0, 2)
        ELSE 0.0 
    END                       AS gross_margin_pct
FROM fact_sales_monthly
GROUP BY period_start_date, period_month_label
ORDER BY period_start_date;

-- ----------------------------------------------------------------------------
-- 7. BACKWARD-COMPATIBLE STAR-SCHEMA VIEW FOR FASTAPI BACKEND
-- Enables existing analytical endpoints to query ClickHouse transparently
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_fact_item_location_monthly AS
SELECT 
    f.period_start_date       AS START_DATE,
    f.period_end_date         AS END_DATE,
    f.period_month_label      AS CUBENAME,
    f.store_code              AS STORE_CODE,
    l.admsite_code            AS ADMSITE_CODE,
    l.store_name              AS STORE_NAME,
    l.state                   AS STATE,
    l.site_type               AS SITE_TYPE,
    f.item_code               AS BARCODE,
    f.item_code               AS ICODE,
    p.article_name            AS ARTICLE_NAME,
    p.division                AS Division,
    p.section                 AS Section,
    p.department              AS Department,
    p.group_alias             AS "Department Allias",
    p.category1               AS CNAME1,
    p.category2               AS CNAME2,
    p.category3               AS CNAME3,
    p.category4               AS CNAME4,
    p.category5               AS CNAME5,
    p.category6               AS CNAME6,
    p.colour                  AS DESC1,
    p.vendor_name             AS DESC2,
    p.style_code              AS DESC3,
    p.vendor_name             AS PARTYNAME,
    p.rsp                     AS MRP,
    p.rsp                     AS RATE,
    p.last_stock_in_date      AS STOCKINDATE,
    f.bill_qty                AS NET_SALE_QUANTITY,
    f.bill_qty                AS RETAIL_SALE_QUANTITY,
    f.net_amount              AS NET_SALE_AMOUNT,
    f.net_amount              AS RETAIL_SALE_AMOUNT,
    f.cogs                    AS NET_SALE_COGS_AMOUNT,
    f.gross_profit            AS GP_AMOUNT,
    f.gross_profit            AS ADJUSTED_GP_AMOUNT,
    0.0                       AS OPENING_QUANTITY,
    0.0                       AS OPENING_AMOUNT,
    0.0                       AS GOODS_RECEIVE_QUANTITY,
    0.0                       AS GOODS_RECEIVE_AMOUNT,
    0.0                       AS GOODS_RETURN_QUANTITY,
    0.0                       AS GOODS_RETURN_AMOUNT,
    0.0                       AS SITE_TRANSFER_IN_QUANTITY,
    0.0                       AS SITE_TRANSFER_IN_AMOUNT,
    0.0                       AS SITE_TRANSFER_OUT_QUANTITY,
    0.0                       AS SITE_TRANSFER_OUT_AMOUNT,
    0.0                       AS CLOSING_STOCK_QUANTITY,
    0.0                       AS CLOSING_STOCK_AMOUNT,
    0.0                       AS SALE_TAX_AMOUNT,
    0.0                       AS SALE_PROMO_AMOUNT,
    0.0                       AS SALE_DISCOUNT_AMOUNT,
    0.0                       AS WAREHOUSE_TRANSFER_IN_QUANTITY,
    0.0                       AS WAREHOUSE_TRANSFER_IN_AMOUNT,
    0.0                       AS WH_TRANSFER_OUT_QUANTITY,
    0.0                       AS WH_TRANSFER_OUT_AMOUNT,
    0.0                       AS PENDING_PO_QUANTITY
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
LEFT JOIN dim_location l ON f.store_code = l.store_code;

-- ----------------------------------------------------------------------------
-- 8. VENDOR PERFORMANCE SUMMARY VIEW
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_vendor_scorecard AS
SELECT
    COALESCE(p.vendor_name, 'UNKNOWN_VENDOR') AS vendor_name,
    count(DISTINCT f.item_code)               AS total_skus_supplied,
    0.0                                       AS receive_units,
    0.0                                       AS receive_value,
    0.0                                       AS return_units,
    0.0                                       AS return_value,
    sum(f.bill_qty)                           AS sales_units,
    round(sum(f.net_amount), 2)               AS net_revenue,
    round(sum(f.gross_profit), 2)             AS gross_profit,
    0.0                                       AS current_stock_units,
    0.0                                       AS current_stock_value,
    0.0                                       AS sell_through_pct,
    CASE 
        WHEN sum(f.net_amount) > 0 THEN round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) 
        ELSE 0.0 
    END                                       AS margin_pct,
    0.0                                       AS return_rate_pct,
    CASE 
        WHEN sum(f.net_amount) > 0 THEN round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 1) 
        ELSE 0.0 
    END                                       AS vendor_score
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY p.vendor_name;

-- ----------------------------------------------------------------------------
-- 9. SIZE CURVE SALES DISTRIBUTION VIEW
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_size_curve_distribution AS
WITH size_sales AS (
    SELECT
        COALESCE(p.division, 'UNKNOWN')                                                       AS division,
        COALESCE(p.department, 'UNKNOWN')                                                     AS department,
        if(p.category5 IS NULL OR trim(p.category5) = '', 'FREE_SIZE', trim(p.category5))    AS size_code,
        0.0                                                                                   AS total_bought_units,
        toInt64(sum(f.bill_qty))                                                              AS total_sold_units,
        0.0                                                                                   AS current_stock_units,
        round(sum(f.net_amount), 2)                                                           AS net_revenue
    FROM fact_sales_monthly f
    LEFT JOIN dim_product p ON f.item_code = p.item_code
    GROUP BY p.division, p.department, p.category5
),
dept_totals AS (
    SELECT 
        department, 
        sum(total_sold_units) AS dept_sold_units
    FROM size_sales
    GROUP BY department
)
SELECT
    s.division,
    s.department,
    s.size_code,
    s.total_bought_units,
    s.total_sold_units,
    s.current_stock_units,
    s.net_revenue,
    multiIf(d.dept_sold_units > 0, round((s.total_sold_units / d.dept_sold_units) * 100.0, 2), 0.0) AS size_contribution_pct
FROM size_sales s
LEFT JOIN dept_totals d ON s.department = d.department;

-- ----------------------------------------------------------------------------
-- 10. PRICE LADDER PERFORMANCE VIEW
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_price_ladder_performance AS
WITH price_bucketed AS (
    SELECT
        f.item_code AS BARCODE,
        p.department AS department,
        COALESCE(p.rsp, 0.0) AS price_point,
        multiIf(
            COALESCE(p.rsp, 0.0) < 300, '< 300',
            COALESCE(p.rsp, 0.0) >= 300 AND COALESCE(p.rsp, 0.0) <= 500, '300 - 500',
            COALESCE(p.rsp, 0.0) > 500 AND COALESCE(p.rsp, 0.0) <= 1000, '500 - 1000',
            '> 1000'
        ) AS price_band,
        f.bill_qty AS NET_SALE_QUANTITY,
        f.net_amount AS NET_SALE_AMOUNT,
        f.gross_profit AS GP_AMOUNT,
        0.0 AS CLOSING_STOCK_QUANTITY
    FROM fact_sales_monthly AS f
    LEFT JOIN dim_product AS p ON f.item_code = p.item_code
)
SELECT
    price_band,
    department,
    count(DISTINCT BARCODE)                                                                    AS total_skus,
    toInt64(sum(NET_SALE_QUANTITY))                                                            AS total_sales_units,
    round(sum(NET_SALE_AMOUNT), 2)                                                             AS total_revenue,
    round(sum(GP_AMOUNT), 2)                                                                  AS total_gross_profit,
    multiIf(sum(NET_SALE_AMOUNT) > 0, round((sum(GP_AMOUNT) / sum(NET_SALE_AMOUNT)) * 100.0, 2), 0.0) AS margin_pct,
    sum(CLOSING_STOCK_QUANTITY)                                                                AS stock_units
FROM price_bucketed
GROUP BY price_band, department;

-- ----------------------------------------------------------------------------
-- 11. WREN AI COMPATIBILITY VIEWS (Semantic Layer Mappings)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW fact_cube_monthly AS
SELECT
    f.period_start_date AS REPORT_DATE,
    f.period_start_date AS START_DATE,
    f.period_end_date AS END_DATE,
    f.period_month_label AS CUBENAME,
    f.store_code AS STORE_CODE,
    l.admsite_code AS ADMSITE_CODE,
    f.item_code AS BARCODE,
    f.bill_qty AS NET_SALE_QUANTITY,
    f.bill_qty AS RETAIL_SALE_QUANTITY,
    -abs(f.net_amount) AS NET_SALE_AMOUNT,
    f.net_amount AS RETAIL_SALE_AMOUNT,
    f.cogs AS NET_SALE_COGS_AMOUNT,
    f.gross_profit AS GP_AMOUNT,
    f.gross_profit AS ADJUSTED_GP_AMOUNT,
    0.0 AS OPENING_QUANTITY,
    0.0 AS OPENING_AMOUNT,
    0.0 AS GOODS_RECEIVE_QUANTITY,
    0.0 AS GOODS_RECEIVE_AMOUNT,
    0.0 AS GOODS_RETURN_QUANTITY,
    0.0 AS GOODS_RETURN_AMOUNT,
    0.0 AS SITE_TRANSFER_IN_QUANTITY,
    0.0 AS SITE_TRANSFER_IN_AMOUNT,
    0.0 AS SITE_TRANSFER_OUT_QUANTITY,
    0.0 AS SITE_TRANSFER_OUT_AMOUNT,
    0.0 AS CLOSING_STOCK_QUANTITY,
    0.0 AS CLOSING_STOCK_AMOUNT
FROM fact_sales_monthly AS f
LEFT JOIN dim_location AS l ON f.store_code = l.store_code;

CREATE OR REPLACE VIEW dim_item AS
SELECT
    item_code AS ICODE,
    article_name AS DESC1,
    vendor_name AS DESC2,
    style_code AS DESC3,
    division AS Division,
    section AS Section,
    department AS Department,
    group_alias AS department_alias,
    category1 AS CNAME1,
    category2 AS CNAME2,
    category3 AS CNAME3,
    category4 AS CNAME4,
    category5 AS CNAME5,
    category6 AS CNAME6,
    colour AS COLOUR,
    vendor_name AS PARTYNAME,
    rsp AS MRP,
    rsp AS RATE
FROM dim_product;

-- ----------------------------------------------------------------------------
-- 12. CATEGORY HIERARCHY SUMMARY VIEW (Self-Service Reporting)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_category_hierarchy_summary AS
SELECT
    division,
    section,
    department,
    total_net_revenue AS net_revenue,
    total_sales_units AS sales_units,
    total_gross_profit AS gross_profit,
    gross_margin_pct AS margin_pct,
    total_skus
FROM v_category_performance_summary;

-- ----------------------------------------------------------------------------
-- 13. STAGING TABLE: INVENTORY EXCEL RAW
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stg_inventory_excel_raw (
    item_code           String,
    source_short_name   String,
    opening_qty         Nullable(Int32),
    opening_amt         Nullable(Decimal(12, 2)),
    purchase_net_qty    Nullable(Int32),
    purchase_net_amt    Nullable(Decimal(12, 2)),
    transfer_in_qty     Nullable(Int32),
    transfer_in_amt     Nullable(Decimal(12, 2)),
    transfer_out_qty    Nullable(Int32),
    transfer_out_amt    Nullable(Decimal(12, 2)),
    cogca_qty           Nullable(Int32),
    cogca_amt           Nullable(Decimal(12, 2)),
    closing_qty         Nullable(Int32),
    final_sale_qty      Nullable(Int32),
    closing_amt         Nullable(Decimal(12, 2)),
    transit_qty         Nullable(Int32),
    transit_amt         Nullable(Decimal(12, 2)),
    ingested_at         DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (source_short_name, item_code);

-- ----------------------------------------------------------------------------
-- 14. FACT TABLE: INVENTORY (Period Snapshot Movement Grain)
-- Grain: Store (store_code) x Item Code (item_code) x Report Period
-- Source: Actual Retail Inventory Report (1 April 2025 - 15 September 2025)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_inventory (
    period_start_date   Date,
    period_end_date     Date,
    report_period_label LowCardinality(String),
    store_code          LowCardinality(String),
    item_code           String,
    opening_qty         Int32,
    opening_amt         Decimal(12, 2),
    purchase_net_qty    Int32,
    purchase_net_amt    Decimal(12, 2),
    transfer_in_qty     Int32,
    transfer_in_amt     Decimal(12, 2),
    transfer_out_qty    Int32,
    transfer_out_amt    Decimal(12, 2),
    cogca_qty           Int32,
    cogca_amt           Decimal(12, 2),
    closing_qty         Int32,
    final_sale_qty      Int32,
    closing_amt         Decimal(12, 2),
    transit_qty         Int32,
    transit_amt         Decimal(12, 2),
    created_at          DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(created_at)
ORDER BY (store_code, item_code, period_start_date);

-- ----------------------------------------------------------------------------
-- 15. ENRICHED INVENTORY VIEW (Joining Dimensions)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_fact_inventory_enriched AS
SELECT
    i.period_start_date AS period_start_date,
    i.period_end_date AS period_end_date,
    i.report_period_label AS report_period_label,
    i.store_code AS store_code,
    l.admsite_code AS admsite_code,
    l.store_name AS store_name,
    l.state AS state,
    l.site_type AS site_type,
    i.item_code AS item_code,
    p.article_name AS article_name,
    p.division AS division,
    p.section AS section,
    p.department AS department,
    p.group_alias AS group_alias,
    p.category1 AS category1,
    p.category2 AS category2,
    p.category3 AS category3,
    p.category4 AS category4,
    p.category5 AS category5,
    p.category6 AS category6,
    p.colour AS colour,
    p.vendor_name AS vendor_name,
    p.style_code AS style_code,
    p.rsp AS rsp,
    i.opening_qty AS opening_qty,
    i.opening_amt AS opening_amt,
    i.purchase_net_qty AS purchase_net_qty,
    i.purchase_net_amt AS purchase_net_amt,
    i.transfer_in_qty AS transfer_in_qty,
    i.transfer_in_amt AS transfer_in_amt,
    i.transfer_out_qty AS transfer_out_qty,
    i.transfer_out_amt AS transfer_out_amt,
    i.cogca_qty AS cogca_qty,
    i.cogca_amt AS cogca_amt,
    i.closing_qty AS closing_qty,
    i.final_sale_qty AS final_sale_qty,
    i.closing_amt AS closing_amt,
    i.transit_qty AS transit_qty,
    i.transit_amt AS transit_amt,
    i.created_at AS created_at
FROM fact_inventory i
LEFT JOIN dim_product p ON i.item_code = p.item_code
LEFT JOIN dim_location l ON i.store_code = l.store_code;




