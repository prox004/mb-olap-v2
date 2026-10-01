# MB-OLAP V2: ClickHouse Warehouse Data Validation & Reconciliation Report
**Dataset Source:** `data/1april-15sept2025.xlsx`  
**Execution Timestamp:** 2026-09-24 01:30:34  
**Audit Status:** 🟢 **PASS (100.00% Reconciled)**

---

## 1. Executive Reconciliation Summary

All operational sales and financial measures have been reconciled between the source Excel workbook and the analytical warehouse model.

| Metric | Source Excel Verified Total | Target Warehouse Reconciled | Variance | Audit Status |
| :--- | :--- | :--- | :---: | :---: |
| **Total Operational Rows** | 397,805 | 397,805 | **0** | 🟢 **PASS** |
| **Unique Fact Grain Keys** | 397,805 | 397,805 | **0** | 🟢 **PASS** |
| **Duplicate Fact Keys** | 0 | 0 | **0** | 🟢 **PASS** |
| **Total Billed Units** | 1,234,990 | 1,234,990 | **0** | 🟢 **PASS** |
| **Net Sales Revenue** | ₹331,367,606.00 | ₹331,367,606.00 | **₹0.00** | 🟢 **PASS** |
| **Cost of Goods Sold (COGS)** | ₹190,626,225.00 | ₹190,626,225.00 | **₹0.00** | 🟢 **PASS** |
| **Gross Profit** | ₹140,741,381.00 | ₹140,741,381.00 | **₹0.00** | 🟢 **PASS** |
| **Gross Margin %** | 42.47% | 42.47% | **0.00%** | 🟢 **PASS** |
| **Distinct Product Items** | 95,071 | 95,071 | **0** | 🟢 **PASS** |
| **Distinct Store Locations**| 6 | 6 | **0** | 🟢 **PASS** |

---

## 2. Business Grain Integrity
- **Fact Table:** `fact_sales_monthly`
- **Grain:** `Store (store_code) × Item Code (item_code) × Sales Month (period_start_date)`
- **Total Keys:** 397,805
- **Distinct Keys:** 397,805
- **Duplicate Keys:** 0 (**Zero duplicate combinations**)

---

## 3. Negative Value / Return Handling Audit
- **Negative Billed Quantity Records:** 624 records (-631 units total)
- **Negative Revenue Records:** 647 records (-₹345,132.00 total)
- **Negative COGS Records:** 624 records (-₹195,659.00 total)
- **Handling:** All signed negative values are stored faithfully in the raw/staging/fact tables without sign alteration. ABS is applied strictly at the reporting/KPI calculation layer where defined by business rules.

---

## 4. KPI Availability Status
- **🟢 Supported & Verified:** Net Sales Revenue, Sales Units, Cost of Goods Sold, Gross Profit, Gross Margin %, Average Selling Price (ASP), Top/Bottom Item Rankings, Store Rankings, Category/Division Performance, Monthly Sales Trend.
- **🔴 Unavailable / Blocked:** Sell-Through %, Weeks of Cover (WOC), GMROI, Closing Stock Valuation. These metrics require monthly stock-on-hand (SOH) inventory snapshot balance feeds, which are not present in the billed sales ledger.
