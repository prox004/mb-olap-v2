# MB-OLAP V2: Inventory Source-to-Target Data Mapping Specification

**Source System:** Actual ERP Retail Inventory Export (`data/sales1april-15spet25.xlsx`)  
**Target Analytical Warehouse:** ClickHouse (`mb_olap_v2`)  
**Target Schema:** Dimensional Integration Layer (`fact_inventory`, `v_fact_inventory_enriched`, reusing `dim_location`, `dim_product`)  
**Verified Source Grain:** `Store (Source Short Name) × Item Code (Item code) × Report Period (2025-04-01 to 2025-09-15)`  
**Total Source Rows in Excel:** **305,082 records** (Rows 8 through 305,089)  
**Total Valid Operational Records:** **305,081 records** (Row 305,089 is the Excel pre-computed formula `Sum` row)  
**Unique Business Keys:** **305,081** (0 duplicate keys)

---

## 1. Dimensional Architecture Overview

```
                      +-------------------+
                      |   Report Period   |
                      |-------------------|
                      | 2025-04-01 to     |
                      | 2025-09-15        |
                      +---------+---------+
                                |
                                | period_start_date, period_end_date
                                v
+------------------+  +--------------------+  +-------------------+
|   dim_location   |  |   fact_inventory   |  |    dim_product    |
|------------------|  |--------------------|  |-------------------|
| PK: store_code   |<-| FK: store_code     |  | PK: item_code     |
+------------------+  | FK: item_code      |->+-------------------+
                      | Measures:          |  (Taxonomy reuse:
                      |   opening_qty      |   Division, Section,
                      |   opening_amt      |   Department, Brand,
                      |   purchase_net_qty |   Silhouette, Size,
                      |   purchase_net_amt |   Colour, Vendor)
                      |   transfer_in_qty  |
                      |   transfer_in_amt  |
                      |   transfer_out_qty |
                      |   transfer_out_amt |
                      |   cogca_qty        |
                      |   cogca_amt        |
                      |   closing_qty      |
                      |   final_sale_qty   |
                      |   closing_amt      |
                      |   transit_qty      |
                      |   transit_amt      |
                      +--------------------+
```

---

## 2. Comprehensive Field-by-Field Mapping Matrix

| # | Excel Source Column (Header Row 7) | Target Table | Target Column | Target Data Type | Transformation Logic | Business Definition & Metric Notes |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `Item code` | `fact_inventory` | `item_code` | `String` | `TRIM(col)` | Primary item barcode / SKU identifier (118,354 distinct SKUs). |
| **2** | `Source Short Name` | `fact_inventory` | `store_code` | `LowCardinality(String)` | `TRIM(UPPER(col))` | Foreign key referencing `dim_location.store_code` (`ANDUL RD`, `BBSR`, `BRHMPR ODS`, `GRHAT`, `SLCHR`, `TZPUR`). |
| **3** | `Opening Qty` | `fact_inventory` | `opening_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Opening stock units as of 2025-04-01. Reconciles to 524,891 units. |
| **4** | `Opening Amt` | `fact_inventory` | `opening_amt` | `Decimal(12, 2)` | `ROUND(col, 2)` | Opening stock valuation in INR. Reconciles to ₹89,059,595.00. |
| **5** | `PURCHASE NET QTY` | `fact_inventory` | `purchase_net_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Net purchase receipts in units. Reconciles to 1,829 units. |
| **6** | `PURCHASE NET AMT` | `fact_inventory` | `purchase_net_amt` | `Decimal(12, 2)` | `ROUND(col, 2)` | Net purchase valuation in INR. Reconciles to ₹211,735.00. |
| **7** | `Transfer In Qty` | `fact_inventory` | `transfer_in_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Inter-store / warehouse inward transfer units. Reconciles to 1,585,942 units. |
| **8** | `Transfer In Amt` | `fact_inventory` | `transfer_in_amt` | `Decimal(12, 2)` | `ROUND(col, 2)` | Inward transfer valuation in INR. Reconciles to ₹221,439,426.00. |
| **9** | `Transfer Out Qty` | `fact_inventory` | `transfer_out_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Outward transfers. **Signed negative values preserved** (Total: -20,583 units). |
| **10** | `Transfer Out Amt` | `fact_inventory` | `transfer_out_amt` | `Decimal(12, 2)` | `ROUND(col, 2)` | Outward transfer valuation in INR. **Signed negative values preserved** (Total: -₹2,098,706.00). |
| **11** | `COGCA QTY` | `fact_inventory` | `cogca_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Cost of Goods Consumed/Adjusted units. **Signed negative preserved** (-1,471,659 units). |
| **12** | `COGCA AMT` | `fact_inventory` | `cogca_amt` | `Decimal(12, 2)` | `ROUND(col, 2)` | COGCA valuation in INR. **Signed negative preserved** (-₹194,353,723.00). |
| **13** | `Closing Qty` | `fact_inventory` | `closing_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Stock on hand at period close (2025-09-15). Reconciles to 620,420 units. |
| **14** | `Final Sale Qty` | `fact_inventory` | `final_sale_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Cumulative units sold in period. Reconciles to 1,467,939 units. |
| **15** | `Closing Amt` | `fact_inventory` | `closing_amt` | `Decimal(12, 2)` | `ROUND(col, 2)` | Closing inventory value in INR at period close. Reconciles to ₹114,258,542.00. |
| **16** | `Transit Qty` | `fact_inventory` | `transit_qty` | `Int32` | `TRY_CAST(col AS Int32)` | Goods in transit between facilities. Reconciles to 63,758 units. |
| **17** | `Transit Amt` | `fact_inventory` | `transit_amt` | `Decimal(12, 2)` | `ROUND(col, 2)` | Transit stock valuation in INR. Reconciles to ₹9,033,331.00. |
| *meta* | *(Metadata)* | `fact_inventory` | `period_start_date` | `Date` | `2025-04-01` | Period start date. |
| *meta* | *(Metadata)* | `fact_inventory` | `period_end_date` | `Date` | `2025-09-15` | Period end date. |
| *meta* | *(Metadata)* | `fact_inventory` | `report_period_label`| `LowCardinality(String)` | `'2025-04-01 to 2025-09-15'` | Period description label. |

---

## 3. Negative Value Preservation

Per task requirement 3 ("Preserve all signed numeric values exactly. Do NOT apply ABS()"):
- `transfer_out_qty` and `transfer_out_amt` are naturally signed negative numbers indicating outward movements from the reporting store.
- `cogca_qty` and `cogca_amt` are signed negative numbers indicating inventory reductions.
- No `ABS()` transformations are applied in raw, staging, or fact tables.

---

## 4. Reconciled Inventory Targets

| Measure Column | Calculated Sum (305,081 rows) | Excel Summary Row (Row 305,089) | Variance | Match % |
| :--- | :--- | :--- | :---: | :---: |
| **Opening Qty** | 524,891 | 524,891 | 0 | 100.00% |
| **Opening Amt** | ₹89,059,595.00 | ₹89,059,353.00 | ₹242.00 | 99.9997% |
| **Purchase Net Qty** | 1,829 | 1,829 | 0 | 100.00% |
| **Purchase Net Amt** | ₹211,735.00 | ₹211,731.00 | ₹4.00 | 99.9981% |
| **Transfer In Qty** | 1,585,942 | 1,585,942 | 0 | 100.00% |
| **Transfer In Amt** | ₹221,439,426.00 | ₹221,439,317.00 | ₹109.00 | 99.9999% |
| **Transfer Out Qty** | -20,583 | -20,583 | 0 | 100.00% |
| **Transfer Out Amt** | -₹2,098,706.00 | -₹2,098,685.00 | -₹21.00 | 99.9990% |
| **COGCA Qty** | -1,471,659 | -1,471,659 | 0 | 100.00% |
| **COGCA Amt** | -₹194,353,723.00 | -₹194,353,437.00 | -₹286.00 | 99.9999% |
| **Closing Qty** | 620,420 | 620,420 | 0 | 100.00% |
| **Final Sale Qty** | 1,467,939 | 1,467,939 | 0 | 100.00% |
| **Closing Amt** | ₹114,258,542.00 | ₹114,258,279.00 | ₹263.00 | 99.9998% |
| **Transit Qty** | 63,758 | 63,758 | 0 | 100.00% |
| **Transit Amt** | ₹9,033,331.00 | ₹9,033,325.00 | ₹6.00 | 99.9999% |

---

## 5. Dimension Overlap & SKU Availability

- **Store Locations (`dim_location`):** 6 of 6 stores present (100.00% match).
- **Product SKUs (`dim_product`):**
  - Total unique SKUs in Inventory: **118,354**
  - Overlap with Sales Master SKUs (`dim_product`): **94,718 (80.03%)**
  - Inventory-Only SKUs (Stock held/moved, no billed transactions in period): **23,636**
  - Sales-Only SKUs (Items with sales transactions not in inventory snapshot): **353**
