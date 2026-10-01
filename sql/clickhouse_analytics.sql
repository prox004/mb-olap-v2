-- ============================================================================
-- MB-OLAP V2 CLICKHOUSE ANALYTICAL QUERY SUITE
-- Target Warehouse: mb_olap_v2
-- Model: Star-Schema (fact_sales_monthly, dim_product, dim_location, dim_date)
-- ============================================================================

USE mb_olap_v2;

-- ----------------------------------------------------------------------------
-- 1. TOTAL NET REVENUE, UNITS, COGS, GROSS PROFIT & GROSS MARGIN %
-- ----------------------------------------------------------------------------
SELECT
    count(*)                                  AS total_records,
    sum(bill_qty)                             AS total_units_sold,
    round(sum(net_amount), 2)                 AS total_net_revenue,
    round(sum(cogs), 2)                       AS total_cogs,
    round(sum(gross_profit), 2)               AS total_gross_profit,
    round((sum(gross_profit) / sum(net_amount)) * 100.0, 2) AS gross_margin_pct,
    round(sum(net_amount) / sum(bill_qty), 2) AS average_selling_price
FROM fact_sales_monthly;

-- ----------------------------------------------------------------------------
-- 2. MONTHLY SALES & MARGIN TREND (Timeline Performance)
-- ----------------------------------------------------------------------------
SELECT
    period_start_date,
    period_month_label,
    sum(bill_qty)                             AS sales_units,
    round(sum(net_amount), 2)                 AS net_revenue,
    round(sum(cogs), 2)                       AS cogs,
    round(sum(gross_profit), 2)               AS gross_profit,
    round((sum(gross_profit) / sum(net_amount)) * 100.0, 2) AS margin_pct
FROM fact_sales_monthly
GROUP BY period_start_date, period_month_label
ORDER BY period_start_date ASC;

-- ----------------------------------------------------------------------------
-- 3. STORE SALES & REVENUE RANKING
-- ----------------------------------------------------------------------------
SELECT
    l.state,
    f.store_code,
    l.store_name,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS net_revenue,
    round(sum(f.gross_profit), 2)             AS gross_profit,
    round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) AS margin_pct
FROM fact_sales_monthly f
LEFT JOIN dim_location l ON f.store_code = l.store_code
GROUP BY l.state, f.store_code, l.store_name
ORDER BY net_revenue DESC;

-- ----------------------------------------------------------------------------
-- 4. STATE-LEVEL REVENUE & UNIT CONTRIBUTION
-- ----------------------------------------------------------------------------
SELECT
    l.state,
    count(DISTINCT f.store_code)              AS active_stores,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS net_revenue,
    round((sum(f.net_amount) / 331367606.00) * 100.0, 2) AS state_revenue_share_pct
FROM fact_sales_monthly f
LEFT JOIN dim_location l ON f.store_code = l.store_code
GROUP BY l.state
ORDER BY net_revenue DESC;

-- ----------------------------------------------------------------------------
-- 5. DIVISION HIERARCHY SALES BREAKDOWN
-- ----------------------------------------------------------------------------
SELECT
    p.division,
    count(DISTINCT f.item_code)               AS active_skus,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS net_revenue,
    round(sum(f.gross_profit), 2)             AS gross_profit,
    round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) AS margin_pct
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY p.division
ORDER BY net_revenue DESC;

-- ----------------------------------------------------------------------------
-- 6. SECTION SALES BREAKDOWN (Top 10 Sections)
-- ----------------------------------------------------------------------------
SELECT
    p.division,
    p.section,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS net_revenue,
    round(sum(f.gross_profit), 2)             AS gross_profit,
    round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) AS margin_pct
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY p.division, p.section
ORDER BY net_revenue DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 7. DEPARTMENT PERFORMANCE (Top 10 Departments by Revenue)
-- ----------------------------------------------------------------------------
SELECT
    p.division,
    p.department,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS net_revenue,
    round(sum(f.gross_profit), 2)             AS gross_profit,
    round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) AS margin_pct
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY p.division, p.department
ORDER BY net_revenue DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 8. CATEGORY SILHOUETTE PERFORMANCE (Category1)
-- ----------------------------------------------------------------------------
SELECT
    p.category1                               AS item_type,
    count(DISTINCT f.item_code)               AS skus,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS net_revenue
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY p.category1
ORDER BY net_revenue DESC
LIMIT 15;

-- ----------------------------------------------------------------------------
-- 9. TOP 15 INDIVIDUAL ITEMS (SKUs) BY NET SALES REVENUE
-- ----------------------------------------------------------------------------
SELECT
    f.item_code,
    p.article_name,
    p.division,
    p.department,
    p.rsp,
    sum(f.bill_qty)                           AS total_units,
    round(sum(f.net_amount), 2)               AS total_revenue,
    round(sum(f.gross_profit), 2)             AS total_profit
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY f.item_code, p.article_name, p.division, p.department, p.rsp
ORDER BY total_revenue DESC
LIMIT 15;

-- ----------------------------------------------------------------------------
-- 10. TOP 15 ITEMS BY TOTAL QUANTITY SOLD
-- ----------------------------------------------------------------------------
SELECT
    f.item_code,
    p.article_name,
    p.division,
    p.department,
    sum(f.bill_qty)                           AS total_units,
    round(sum(f.net_amount), 2)               AS total_revenue
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY f.item_code, p.article_name, p.division, p.department
ORDER BY total_units DESC
LIMIT 15;

-- ----------------------------------------------------------------------------
-- 11. COLOUR VARIANT SALES CONTRIBUTION (Desc1 / Colour)
-- ----------------------------------------------------------------------------
SELECT
    p.colour,
    count(DISTINCT f.item_code)               AS sku_count,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS net_revenue
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
WHERE p.colour != 'NA' AND p.colour != ''
GROUP BY p.colour
ORDER BY net_revenue DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 12. PRICE BAND / RSP LADDER DISTRIBUTION
-- ----------------------------------------------------------------------------
SELECT
    CASE 
        WHEN p.rsp < 200 THEN 'Under ₹200'
        WHEN p.rsp BETWEEN 200 AND 499 THEN '₹200 - ₹499'
        WHEN p.rsp BETWEEN 500 AND 999 THEN '₹500 - ₹999'
        WHEN p.rsp BETWEEN 1000 AND 1999 THEN '₹1,000 - ₹1,999'
        ELSE '₹2,000 & Above'
    END                                       AS price_band,
    count(DISTINCT f.item_code)               AS skus,
    sum(f.bill_qty)                           AS units_sold,
    round(sum(f.net_amount), 2)               AS total_revenue,
    round((sum(f.gross_profit) / sum(f.net_amount)) * 100.0, 2) AS margin_pct
FROM fact_sales_monthly f
LEFT JOIN dim_product p ON f.item_code = p.item_code
GROUP BY price_band
ORDER BY total_revenue DESC;
