# MB-OLAP V2: Actual Retail Dataset Profiling Report
**Source File:** `data/1april-15sept2025.xlsx`  
**Dataset Reporting Scope:** 1 April 2025 – 15 September 2025  
**Profile Date:** September 2026  
**Auditing Method:** Programmatic Streaming Inspection & In-Memory DuckDB Aggregations (Zero Truncation)

---

## 1. Executive Summary & Core File Metadata

| Parameter | Finding / Metric |
| :--- | :--- |
| **Workbook Filename** | `1april-15sept2025.xlsx` |
| **File Location** | `data/1april-15sept2025.xlsx` |
| **File Size** | 43,713,820 bytes (41.69 MB) |
| **Sheet Names** | `['Sheet1']` (Single sheet) |
| **Total Rows in Excel Sheet** | **1,048,230** rows (Standard Excel maximum boundary allocation) |
| **Header Row Position** | **Row 6** (Rows 1–5 are report metadata/title rows) |
| **Metadata Rows (Rows 1–5)** | Row 1: Title (`Sale Details Analysis`)<br>Row 2: Period filter (`FROM: '01-Apr-25', TO: '15-SEP-25'`)<br>Row 3: Blank<br>Row 4: Filter status (`Isvoid:No`)<br>Row 5: Blank |
| **Valid Operational Data Rows** | **397,805** rows (Rows 7 to 397,811) |
| **Summary / Total Row** | **Row 397,812**: Contains Excel Total `Net Amt = 331,367,606` |
| **Empty Trailing Rows** | **650,418** rows (Rows 397,813 to 1,048,230 — all null values) |
| **Total Columns** | **24 columns** |
| **Exact Source Data Grain** | **One record per Store (`Source Short Name`), Item (`Item code`), and Month (`Bill Date: Month`)** |
| **Key Uniqueness Verification** | `COUNT(*) = 397,805` and `COUNT(DISTINCT Store || Item || Month) = 397,805` (**100.0% Unique, 0 Duplicates**) |
| **Total Net Sales Revenue** | **₹331,367,606.00** (Exact match to Row 397,812 total) |
| **Total Billed Quantity** | **1,234,990 units** |
| **Total COGS (Cost of Goods Sold)**| **₹190,626,225.00** |
| **Calculated Gross Profit** | **₹140,741,381.00** (`Net Revenue - COGS`) |
| **Calculated Gross Margin %** | **42.47%** |

---

## 2. Exact Column Catalog & Schema Definition (Row 6 Headers)

| # | Excel Column Name (Exact) | Inferred Data Type | Null/Blank Count | Null % | Cardinality | Example Values |
| :- | :--- | :--- | :- | :- | :- | :--- |
| 1 | `Source State` | String | 0 | 0.00% | 3 | `WEST BENGAL`, `ODISHA`, `ASSAM` |
| 2 | `Source Short Name` | String | 0 | 0.00% | 6 | `GRHAT`, `ANDUL RD`, `BBSR`, `BRHMPR ODS`, `SLCHR`, `TZPUR` |
| 3 | `Bill Qty ` *(Note trailing space)* | Double / Int32 | 0 | 0.00% | 254 | `1`, `2`, `12`, `103`, `505`, `1102`, `-1` |
| 4 | `Net Amt` | Decimal(12,2) | 0 | 0.00% | 3,866 | `699.00`, `108920.00`, `-2499.00` |
| 5 | `COGS2` | Decimal(12,2) | 0 | 0.00% | 4,461 | `400.00`, `56202.00`, `-1350.00` |
| 6 | `Division` | LowCardinality(String) | 0 | 0.00% | 6 | `Mens Wear`, `Ladies Wear`, `Kids Wear`, `Accessories 1`, `Accessories 2`, `Winter Garments` |
| 7 | `Section` | LowCardinality(String) | 0 | 0.00% | 27 | `Mens Upper Wear`, `Mens Lowers`, `Sarees`, `Toiletories`, `Footwear` |
| 8 | `Department` | LowCardinality(String) | 0 | 0.00% | 173 | `Casual Shirts`, `Cotton Trousers`, `Synthetics Sarees`, `Oral Care` |
| 9 | `Group Alias` | LowCardinality(String) | 0 | 0.00% | 12 | `Casual`, `Lowers`, `Saree`, `Acc 1`, `T Shirts`, `Boys`, `Girls` |
| 10 | `Article Name` | String | 0 | 0.00% | 387 | `ACCESSORIES 1-TOILETORIES-ORAL CARE`, `MW - CASUAL SHIRTS - BG - 0 TO 9999` |
| 11 | `Item code` | String | 0 | 0.00% | 95,071 | `R118024`, `R215514`, `R264941`, `M767678` |
| 12 | `Category1` | LowCardinality(String) | 0 | 0.00% | 313 | `H WIPES`, `H MSC`, `H SRS`, `T MPC`, `H MTC` (Product silhouette / type) |
| 13 | `Category2` | String | 0 | 0.00% | 1,012 | `BIONECHRAL AQVVA`, `ZUDAAC`, `MOHI`, `LION FORCE` (Brand / collection) |
| 14 | `Category3` | String | 21,346 | 5.37% | 4,606 | `WET WIPES`, `PRINTED`, `SOFTY CONTRAST`, `FLAT FRONT` (Pattern/Fabric) |
| 15 | `Category4` | String | 72,949 | 18.34% | 415 | `PACK 03`, `BG`, `SYNTHETIC`, `DENIM` (Fit / sub-group) |
| 16 | `Category5` | String | 40,133 | 10.09% | 368 | `H 38"`, `32"`, `6.30 MTR`, `H 40/L` (Size spec / dimension) |
| 17 | `Category6` | LowCardinality(String) | 0 | 0.00% | 18 | `BG 25`, `BG 26`, `P 25`, `S 25`, `2026`, `OLD AGE` (Packaging / launch) |
| 18 | `RSP` | Decimal(10,2) | 0 | 0.00% | 289 | `99.00`, `135.00`, `699.00`, `1099.00` (Retail Selling Price / MRP) |
| 19 | `Desc1` | String | 85,796 | 21.57% | 39 | `MULTI`, `BLACK`, `BLUE`, `PINK`, `WHITE`, `NA` (Colour / base) |
| 20 | `Desc2` | String | 362,144 | 91.04% | 203 | Vendor / Manufacturer name (sparse) |
| 21 | `Desc3` | String | 139,372 | 35.04% | 15,303 | Style code / design identifier (sparse) |
| 22 | `Generated` | DateTime / Date | 0 | 0.00% | 1,433 | `2024-05-18`, `2025-03-13` (SKU introduction timestamp) |
| 23 | `Last Stock IN Date` | DateTime / Date | 202 | 0.05% | 1,574 | `2026-09-07`, `2025-07-27` (Last store receipt timestamp) |
| 24 | `Bill Date: Month (Mon "Q"Q-RR)` | LowCardinality(String) | 0 | 0.00% | 6 | `Apr Q2-25`, `May Q2-25`, `Jun Q2-25`, `Jul Q3-25`, `Aug Q3-25`, `Sep Q3-25` |

---

## 3. Geographic & Store Master Analysis

The actual dataset covers **3 States** and **6 Physical Retail Stores**:

| State (`Source State`) | Store Code (`Source Short Name`) | Commercial Store Name & City | Record Count | Total Billed Units | Total Net Sales (INR) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **WEST BENGAL** | `GRHAT` | M Baazar - Gariahat (Kolkata) | 96,890 | 332,525 | ₹98,526,645.00 |
| **WEST BENGAL** | `ANDUL RD` | M Baazar - Andul Road (Howrah) | 53,426 | 125,692 | ₹32,325,447.00 |
| **ODISHA** | `BBSR` | M Baazar - Bhubaneswar | 99,820 | 349,464 | ₹99,307,053.00 |
| **ODISHA** | `BRHMPR ODS` | M Baazar - Berhampur City | 47,755 | 102,354 | ₹26,222,471.00 |
| **ASSAM** | `SLCHR` | M Baazar - Silchar | 69,027 | 264,398 | ₹61,320,939.00 |
| **ASSAM** | `TZPUR` | M Baazar - Tezpur | 30,887 | 60,557 | ₹13,665,051.00 |
| **Total** | **6 Stores** | **Retail Store Network** | **397,805** | **1,234,990** | **₹331,367,606.00** |

*Note on Store Master Integration:*
- In DuckDB `dim_location`, sites `530` (Gariahat) and `820` (Andul Road) already exist.
- The real data introduces 4 additional high-volume cluster stores: `BBSR`, `BRHMPR ODS`, `SLCHR`, `TZPUR`.
- All 6 stores are classified as `RETAIL_STORE`.

---

## 4. Product Hierarchy & Taxonomy Breakdown

### Functional Dependency on `Item code`
Every single `item_code` is mathematically deterministic:
- `item_code -> Division`: 0 conflicts across 95,071 items.
- `item_code -> Section`: 0 conflicts across 95,071 items.
- `item_code -> Department`: 0 conflicts across 95,071 items.
- `item_code -> Article Name`: 0 conflicts across 95,071 items.
- `item_code -> RSP`: 0 conflicts across 95,071 items.
`Item code` serves as an immutable natural primary key for `dim_product`.

### Division Breakdown

| Division | Record Count | % of Records | Billed Units | Net Sales (INR) | % of Revenue |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Mens Wear** | 133,765 | 33.6% | 409,036 | ₹114,469,171.00 | 34.54% |
| **Ladies Wear** | 104,978 | 26.4% | 282,185 | ₹87,830,219.00 | 26.50% |
| **Kids Wear** | 101,647 | 25.6% | 306,478 | ₹80,753,215.00 | 24.37% |
| **Accessories 2** | 37,557 | 9.4% | 114,795 | ₹24,223,704.00 | 7.31% |
| **Accessories 1** | 19,761 | 5.0% | 122,253 | ₹24,013,488.00 | 7.25% |
| **Winter Garments** | 97 | 0.02% | 243 | ₹77,809.00 | 0.02% |
| **Total** | **397,805** | **100.0%** | **1,234,990** | **₹331,367,606.00** | **100.00%** |

---

## 5. Sales Period & Monthly Timeline Breakdown

The actual dataset covers 6 billing cycles from **1 April 2025 to 15 September 2025**:

| Billing Period Label | Standard Period Start | Records | Billed Units | Net Sales (INR) | COGS (INR) | Gross Profit (INR) | Margin % |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `Apr Q2-25` | 2025-04-01 | 78,531 | 266,059 | ₹67,246,828.00 | ₹38,956,583.00 | ₹28,290,245.00 | 42.07% |
| `May Q2-25` | 2025-05-01 | 65,748 | 203,474 | ₹53,148,667.00 | ₹30,440,567.00 | ₹22,708,100.00 | 42.73% |
| `Jun Q2-25` | 2025-06-01 | 67,492 | 221,912 | ₹56,894,989.00 | ₹32,734,167.00 | ₹24,160,822.00 | 42.47% |
| `Jul Q3-25` | 2025-07-01 | 57,771 | 161,765 | ₹38,094,786.00 | ₹22,695,399.00 | ₹15,399,387.00 | 40.42% |
| `Aug Q3-25` | 2025-08-01 | 71,841 | 223,814 | ₹62,894,910.00 | ₹36,029,805.00 | ₹26,865,105.00 | 42.71% |
| `Sep Q3-25` *(Partial to 15-Sep)* | 2025-09-01 | 56,422 | 157,966 | ₹53,087,426.00 | ₹29,769,704.00 | ₹23,317,722.00 | 43.92% |
| **Total** | | **397,805** | **1,234,990** | **₹331,367,606.00** | **₹190,626,225.00** | **₹140,741,381.00** | **42.47%** |

---

## 6. Numeric Distribution & Negative Values Analysis

In ERP retail systems, returns and credit memos produce negative entries. The data reflects real operational activity:

| Metric Column | Min Value | Max Value | Sum Total | Negative Rows | Negative Value Sum | Zero Rows | Positive Rows |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **`Bill Qty `** | -2.00 | 1,102.00 | 1,234,990.00 | **624** | -631 units | 4,759 | 392,422 |
| **`Net Amt`** | -2,499.00 | 108,920.00 | ₹331,367,606.00 | **647** | -₹345,132.00 | 5,161 | 391,997 |
| **`COGS2`** | -1,367.00 | 56,202.00 | ₹190,626,225.00 | **624** | -₹195,659.00 | 4,768 | 392,413 |
| **`RSP`** | 10.00 | 5,699.00 | ₹162,643,439.00 | **0** | 0.00 | 0 | 397,805 |

### Business Rule Compliance (Preserving Negatives)
1. **Raw Storage:** `Bill Qty`, `Net Amt`, and `COGS2` MUST be stored as signed numeric values (`Decimal(12,2)` / `Int32`) without converting negative signs during ingestion.
2. **Reporting Layer:** Standard business formulas use `SUM(ABS(Net Amt))` or `SUM(Net Amt)` according to defined dashboard rules in `Data_Dictionary.md`.

---

## 7. Business Metric Feasibility & Gap Assessment

| KPI / Metric | Calculation Formula | Supported in Actual Excel? | Notes / Dependencies |
| :--- | :--- | :---: | :--- |
| **Net Sales Revenue** | `SUM(Net Amt)` / `SUM(ABS(Net Amt))` | 🟢 **Fully Supported** | Directly derived from `Net Amt` |
| **Net Sales Units** | `SUM(Bill Qty)` / `SUM(ABS(Bill Qty))` | 🟢 **Fully Supported** | Directly derived from `Bill Qty` |
| **COGS** | `SUM(COGS2)` | 🟢 **Fully Supported** | Directly derived from `COGS2` |
| **Gross Profit** | `Net Revenue - COGS` | 🟢 **Fully Supported** | Mathematically verified across all records |
| **Gross Margin %** | `(Gross Profit / Net Revenue) * 100` | 🟢 **Fully Supported** | Baseline margin 42.47% |
| **Average Selling Price (ASP)** | `Net Revenue / Bill Qty` | 🟢 **Fully Supported** | Average ASP = ₹268.32 |
| **Sales Velocity / Rankings** | Top SKUs, Departments, Stores by Revenue | 🟢 **Fully Supported** | Multidimensional grouping |
| **Colour & Size Analytics** | Breakdown by `Desc1` and `Category5` | 🟢 **Fully Supported** | Colour and size attributes available |
| **Vendor Sales Analysis** | Breakdown by `Desc2` (Vendor name) | 🟡 **Partially Supported** | `Desc2` populated for 8.96% of items; vendor master join recommended |
| **Closing Stock Value / Units** | SOH snapshot at end of month | 🔴 **Not Supported** | Requires inventory ledger snapshot (`CLOSING_STOCK_QUANTITY`) |
| **Sell-Through %** | `Sales / (Opening + Receipts + Transfers)`| 🔴 **Not Supported** | Requires inward/opening stock balance |
| **Weeks of Cover (WOC)** | `Closing Stock / Weekly Sales Rate` | 🔴 **Not Supported** | Requires closing inventory stock |
| **GMROI** | `Gross Profit / Avg Inventory Value` | 🔴 **Not Supported** | Requires inventory holding valuation |
