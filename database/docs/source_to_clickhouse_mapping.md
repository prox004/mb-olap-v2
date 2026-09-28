# MB-OLAP V2: Source-to-Target Data Mapping Specification

**Source System:** Actual ERP Retail Sales Excel Export (`data/1april-15sept2025.xlsx`)  
**Target Analytical Warehouse:** ClickHouse (`mb_olap_v2`)  
**Target Schema:** Dimensional Star Schema (`fact_sales_monthly`, `dim_product`, `dim_location`, `dim_date`)  
**Verified Source Grain:** `Store (Source Short Name) × Item Code × Sales Month (Bill Date: Month)`  
**Total Valid Source Records:** **397,805 records** (0 duplicates)

---

## 1. Dimensional Architecture Overview

```
                      +-------------------+
                      |     dim_date      |
                      |-------------------|
                      | PK: date          |
                      +---------+---------+
                                |
                                | period_start_date
                                v
+------------------+  +--------------------+  +-------------------+
|   dim_location   |  | fact_sales_monthly |  |    dim_product    |
|------------------|  |--------------------|  |-------------------|
| PK: store_code   |<-| FK: store_code     |  | PK: item_code     |
+------------------+  | FK: item_code      |->+-------------------+
                      | Measures:          |
                      |   bill_qty         |
                      |   net_amount       |
                      |   cogs             |
                      |   gross_profit     |
                      |   unit_rsp         |
                      +--------------------+
```

---

## 2. Comprehensive Field-by-Field Mapping Matrix

| # | Excel Source Column (Header) | Target Table | Target Column | Target Data Type | Transformation Logic | Business Definition & Metric Notes |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `Source State` | `dim_location` | `state` | `LowCardinality(String)` | `TRIM(UPPER(col))` | State of the retail facility (`WEST BENGAL`, `ODISHA`, `ASSAM`). |
| **2** | `Source Short Name` | `dim_location` | `store_code` | `LowCardinality(String)` | `TRIM(UPPER(col))` | Primary unique store identifier (`GRHAT`, `ANDUL RD`, `BBSR`, `BRHMPR ODS`, `SLCHR`, `TZPUR`). |
| **2** | `Source Short Name` | `fact_sales_monthly` | `store_code` | `LowCardinality(String)` | `TRIM(UPPER(col))` | Foreign key referencing `dim_location.store_code`. |
| **3** | `Bill Qty ` | `fact_sales_monthly` | `bill_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Net units billed. **Signed negative values preserved** (624 rows = returns). |
| **4** | `Net Amt` | `fact_sales_monthly` | `net_amount` | `Decimal(12, 2)` | `ROUND(col, 2)` | Net Sales Revenue in INR. **Signed negative values preserved** (647 rows = credit notes). |
| **5** | `COGS2` | `fact_sales_monthly` | `cogs` | `Decimal(12, 2)` | `ROUND(col, 2)` | Cost of Goods Sold in INR. **Signed negative values preserved**. |
| *calc* | *(Calculated)* | `fact_sales_monthly` | `gross_profit` | `Decimal(12, 2)` | `net_amount - cogs` | Gross Profit generated in INR. Reconciles to ₹140,741,381.00. |
| **6** | `Division` | `dim_product` | `division` | `LowCardinality(String)` | `TRIM(col)` | Level 1 Merchandise Hierarchy (e.g. `Mens Wear`, `Ladies Wear`). |
| **7** | `Section` | `dim_product` | `section` | `LowCardinality(String)` | `TRIM(col)` | Level 2 Merchandise Hierarchy (e.g. `Mens Upper Wear`, `Sarees`). |
| **8** | `Department` | `dim_product` | `department` | `LowCardinality(String)` | `TRIM(col)` | Level 3 Merchandise Hierarchy (e.g. `Casual Shirts`, `Oral Care`). |
| **9** | `Group Alias` | `dim_product` | `group_alias` | `LowCardinality(String)` | `TRIM(col)` | Commercial product group alias (e.g. `Casual`, `Lowers`, `Acc 1`). |
| **10** | `Article Name` | `dim_product` | `article_name` | `String` | `TRIM(col)` | Full descriptive article classification title. |
| **11** | `Item code` | `dim_product` | `item_code` | `String` | `TRIM(col)` | Primary Key: SKU / Barcode identifier (95,071 distinct items). |
| **11** | `Item code` | `fact_sales_monthly` | `item_code` | `String` | `TRIM(col)` | Foreign key referencing `dim_product.item_code`. |
| **12** | `Category1` | `dim_product` | `category1` | `LowCardinality(String)` | `TRIM(col)` | Silhouette / Item Type Code (e.g. `H WIPES`, `H MSC`, `T MPC`). |
| **13** | `Category2` | `dim_product` | `category2` | `String` | `TRIM(col)` | Brand / Commercial Collection (e.g. `ZUDAAC`, `MOHI`, `SPARKY`). |
| **14** | `Category3` | `dim_product` | `category3` | `Nullable(String)` | `NULLIF(TRIM(col), '')` | Pattern / Fabric specification (e.g. `PRINTED`, `WET WIPES`). |
| **15** | `Category4` | `dim_product` | `category4` | `Nullable(String)` | `NULLIF(TRIM(col), '')` | Fit / Sub-group attribute (e.g. `BG`, `SYNTHETIC`, `DENIM`). |
| **16** | `Category5` | `dim_product` | `category5` | `Nullable(String)` | `NULLIF(TRIM(col), '')` | Sizing specification / curve (e.g. `32"`, `H 40/L`, `6.30 MTR`). |
| **17** | `Category6` | `dim_product` | `category6` | `LowCardinality(String)` | `TRIM(col)` | Packaging type / Launch model year (e.g. `BG 25`, `2026`). |
| **18** | `RSP` | `dim_product` | `rsp` | `Decimal(10, 2)` | `ROUND(col, 2)` | Standard Retail Selling Price / Tag MRP in INR. |
| **18** | `RSP` | `fact_sales_monthly` | `unit_rsp` | `Decimal(10, 2)` | `ROUND(col, 2)` | Transaction snapshot unit RSP. |
| **19** | `Desc1` | `dim_product` | `colour` | `LowCardinality(String)` | `COALESCE(TRIM(col), 'NA')` | Primary garment colourway / variant designation. |
| **20** | `Desc2` | `dim_product` | `vendor_name` | `Nullable(String)` | `NULLIF(TRIM(col), '')` | Commercial supplier / vendor name (sparse). |
| **21** | `Desc3` | `dim_product` | `style_code` | `Nullable(String)` | `NULLIF(TRIM(col), '')` | Style / Design / Work-order sub-code. |
| **22** | `Generated` | `dim_product` | `generated_date` | `Nullable(Date)` | `toDate(col)` | SKU creation / catalog introduction timestamp. |
| **23** | `Last Stock IN Date`| `dim_product` | `last_stock_in_date`| `Nullable(Date)` | `toDate(col)` | Timestamp of most recent inventory inward receipt. |
| **24** | `Bill Date: Month` | `fact_sales_monthly` | `period_month_label`| `LowCardinality(String)`| `TRIM(col)` | Original month label (e.g. `'Apr Q2-25'`). |
| **24** | `Bill Date: Month` | `fact_sales_monthly` | `period_start_date` | `Date` | Mapped via lookup table | Canonical period start date (`2025-04-01` to `2025-09-01`). |
| **24** | `Bill Date: Month` | `fact_sales_monthly` | `period_end_date` | `Date` | Mapped via lookup table | Canonical period end date (`2025-04-30` to `2025-09-15`). |
| **24** | `Bill Date: Month` | `dim_date` | `month_period_label`| `LowCardinality(String)`| `TRIM(col)` | Lookup link to date dimension. |

---

## 3. Negative Value Preservation & Metric Logic

### Operational Context
In ERP and Point-of-Sale systems, customer returns and credit notes generate negative quantities (`Bill Qty < 0`) and negative revenues (`Net Amt < 0`). 

In this dataset:
- **624 rows** contain negative billed quantities (-631 units total).
- **647 rows** contain negative net revenue (-₹345,132.00 total).
- **624 rows** contain negative COGS (-₹195,659.00 total).

### Warehouse Rules
1. **Raw & Fact Tables:** Negative signs are strictly preserved:
   ```sql
   net_amount = -2499.00
   cogs       = -1350.00
   gross_profit = -2499.00 - (-1350.00) = -1149.00
   ```
2. **Reporting Layer:** Standard business logic applies `SUM(ABS(net_amount))` only where dashboard metrics define gross retail volume rather than net fiscal revenue.

---

## 4. Reconciled Financial Target Summary

Every metric in the target warehouse must match the source data profile:

```
Net Sales Revenue : ₹331,367,606.00
Billed Quantity   : 1,234,990 units
Cost of Goods Sold: ₹190,626,225.00
Gross Profit      : ₹140,741,381.00
Gross Margin %    : 42.47%
```
