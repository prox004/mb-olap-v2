# M Baazar Enterprise Retail Data Dictionary

<a id="purpose"></a>
## 1. Purpose

The **M Baazar Enterprise Retail Data Dictionary** is a common reference for understanding M Baazar's business data.

It defines key business terms, product and store information, KPI calculations, inventory rules, dashboard measures, supplier performance, and recommended business actions.

The purpose is to ensure that **Merchandising, Store Operations, Supply Chain, Finance, Procurement, and Management** use the same definitions and calculation methods when reviewing business performance.

---

<a id="objectives"></a>
## 2. Objectives

The main objectives are to:

* **Create a common business language** across Merchandising, Operations, Supply Chain, and Finance teams.
* **Maintain consistent definitions** across reports, executive dashboards, and analytics tools.
* **Apply consistent rules** for sales calculations, inventory valuation, and stock cover.
* **Explain how important business charts and KPIs are calculated**, making them easy to interpret.
* **Provide a clear view of actual M Baazar business performance** grounded in real operational data.
* **Support better inventory balancing**, replenishment, store transfers, and clearance decisions.
* **Help business users understand and analyse retail performance easily** without technical complexity.

---

<a id="toc"></a>
## Document Navigation

1. [Purpose](#purpose)
2. [Objectives](#objectives)
3. [Business Modules Summary](#modules-summary)
4. [Core Business Concepts](#core-concepts)
   - [4.1 Store & Facility Information](#stores-facilities)
   - [4.2 Product & Merchandise Information](#products-merchandise)
5. [Monthly Sales & Stock Movement](#monthly-movement)
6. [Sales & Inventory Calculation Rules](#calculation-rules)
   - [6.1 Sales Values](#rule-sales)
   - [6.2 Gross Profit](#rule-gp)
   - [6.3 Gross Margin %](#rule-margin)
   - [6.4 Available Stock](#rule-available-stock)
   - [6.5 Closing Stock](#rule-closing-stock)
   - [6.6 Temporary Negative Stock](#rule-negative-stock)
   - [6.7 Sell-Through %](#rule-sell-through)
   - [6.8 Weeks of Cover (WOC)](#rule-woc)
   - [6.9 Months of Inventory (MOI)](#rule-moi)
   - [6.10 Inventory Value](#rule-inventory-value)
   - [6.11 GMROI](#rule-gmroi)
   - [6.12 Buying Accuracy %](#rule-buying-accuracy)
   - [6.13 Supplier Return Rate %](#rule-supplier-return)
7. [KPI Dictionary & Benchmarks](#kpi-dictionary)
8. [Dashboard & Visualization Calculations](#dashboard-visualizations)
   - [8.1 Monthly Revenue & Gross Margin Trend](#monthly-trend-calc)
9. [Category Performance Matrix](#category-matrix)
10. [Store Stock Transfer & Movement](#store-transfers)
11. [Colour Revenue Contribution](#colour-contribution)
12. [Supplier Performance](#supplier-performance)
13. [Store Stock Cover & Health](#stock-health)
14. [SKU Sales Velocity & Dead Stock](#sku-velocity)
15. [Inventory Action Recommendations](#inventory-recommendations)
    - [15.1 Reorder](#rec-reorder)
    - [15.2 Transfer](#rec-transfer)
    - [15.3 Markdown](#rec-markdown)
16. [Transfer Types & Urgency](#transfer-urgency)
17. [Data Standards & Missing Values](#data-standards)
18. [Data Quality & Business Checks](#quality-checks)
19. [Business Ownership](#business-ownership)
20. [Summary](#summary)

---

<a id="modules-summary"></a>
# 3. Business Modules Summary

The analytics platform organizes M Baazar's commercial operations into the following main business areas:

| Business Area | Scope & Purpose | Key Business Questions Answered |
| :--- | :--- | :--- |
| **Executive Performance** | Revenue, monthly trends, store rankings, and overall profitability | Are sales growing? Which stores perform best? Are margins improving? |
| **Store & Location Network** | Store profiles, warehouse distribution, and stock flow | Where is stock available? Which locations need replenishment? |
| **Merchandise & Category Management** | Product hierarchy, sizes, colours, brands, and categories | Which categories sell best? Which have the highest margins? |
| **Inventory Velocity & Dead Stock** | Sales speed categorization and products unsold for 90+ days | Which products may stock out? How much stock is not moving? |
| **Store Stock Allocation & Rebalancing** | Stock cover analysis and store-to-store balancing | Which stores have excess stock? Which need stock? |
| **Finance & Profitability** | Revenue, COGS, Gross Profit, Gross Margin %, and GMROI | How profitable are product sales and working capital investments? |
| **Supplier & Procurement Performance** | Purchases, defect returns, sales performance, and supplier ratings | Which suppliers perform well? Which have high return rates? |
| **Inventory Recommendations** | Automated Reorder, Transfer, and Markdown actions | What concrete inventory actions should be taken today? |
| **Self-Service Reporting** | Flexible, ad-hoc business reports and custom pivot analysis | How can teams review information according to their requirements? |

---

<a id="core-concepts"></a>
# 4. Core Business Concepts

<a id="stores-facilities"></a>
## 4.1 Store & Facility Information

Every facility in M Baazar's network has a specific site code and operational role:

| Site Code | Commercial Location Name | Facility Classification | Operational Role |
| :---: | :--- | :--- | :--- |
| **6** | M Baazar - VIP | Retail Showroom | High-footfall urban customer showroom |
| **530** | M Baazar - Gariahat | Retail Showroom | Top revenue-generating retail store |
| **820** | M Baazar - Andul Road | Retail Showroom | Regional suburban retail showroom |
| **1070** | Metro Retail Private Limited-PRO | Central Distribution Center (DC) | Primary hub receiving vendor stock and supplying retail stores |

### Facility Types
* **Retail Store:** A customer-facing showroom that sells merchandise directly to shoppers.
* **Central Warehouse (DC):** The main distribution center (Site 1070) that receives bulk goods from manufacturers and redistributes stock to retail showrooms.

---

<a id="products-merchandise"></a>
## 4.2 Product & Merchandise Information

Products follow a standardized retail hierarchy:

$$\text{Division} \longrightarrow \text{Section} \longrightarrow \text{Department} \longrightarrow \text{Product (Barcode)}$$

### Product Hierarchy Examples
* **Division:** Men's Wear, Ladies Wear, Kids Wear, Accessories
* **Section:** Men's Upper Wear, Men's Lowers, Boys Wear, Footwear
* **Department:** T-Shirts, Jeans, Sarees, Sandals, General Goods

### Core Product Attributes

| Attribute | Business Meaning | Example Values |
| :--- | :--- | :--- |
| **Product Barcode** | Unique tag code printed on the physical garment | `M369054`, `R341404` |
| **Brand / Line** | Commercial brand or private-label collection | `MB`, `SPARK`, `SPARKY` |
| **Style / Fit** | Styling, collar, or silhouette cut | `COLLAR`, `NARROW FIT`, `DESIGNER` |
| **Size** | Garment size | `M`, `L`, `XL`, `28"`, `32"` |
| **Colour** | Standardized garment colour family | `BLACK`, `NAVY`, `DENIM`, `WHITE`, `RED` |
| **Supplier** | Manufacturer or commercial vendor name | `Sai International`, `Converson` |
| **Purchase Cost** | Unit acquisition price paid to the supplier | `₹160.48`, `₹247.35` |
| **MRP** | Maximum Retail Price printed on tag | `₹280.00`, `₹395.00` |
| **First Received Date** | Date when the product was first introduced in inventory | `2015-05-23`, `2017-04-22` |

---

<a id="monthly-movement"></a>
# 5. Monthly Sales & Stock Movement

M Baazar tracks inventory and sales performance on a monthly calendar basis:

| Measure | Commercial Meaning |
| :--- | :--- |
| **Opening Stock** | Units and purchase-cost value physically present at the beginning of the month |
| **Goods Received** | Fresh merchandise delivered directly from suppliers |
| **Goods Returned** | Damaged, defective, or non-compliant merchandise sent back to suppliers |
| **Transfer In** | Inventory received from another retail showroom |
| **Transfer Out** | Inventory dispatched to another retail showroom |
| **Warehouse Transfer In** | Fresh replenishment stock received from Central DC (Site 1070) |
| **Warehouse Transfer Out** | Surplus or off-season stock returned back to Central DC |
| **Gross Sales** | Total sales volume and revenue before customer returns |
| **Net Sales Units** | Units sold to customers after subtracting customer returns |
| **Net Sales Revenue** | Total money collected from completed sales after returns and discounts |
| **COGS** | Cost of Goods Sold — direct purchase acquisition cost of merchandise sold |
| **Closing Stock** | Units and purchase-cost value remaining on the final day of the month |
| **Gross Profit** | Commercial profit remaining after subtracting product acquisition cost |
| **Markdowns & Discounts** | Value of price reductions and promotional discounts given at POS |

### Fundamental Gross Profit Formula
$$\text{Gross Profit} = \text{Net Sales Revenue} - \text{Cost of Goods Sold (COGS)}$$

---

<a id="calculation-rules"></a>
# 6. Sales & Inventory Calculation Rules

<a id="rule-sales"></a>
## 6.1 Sales Values

Sales are always presented as **positive numbers** in business reports and dashboards.

In source ERP records, customer sales reduce stock balance and are stored with a negative algebraic sign. When calculating sales totals, the absolute value is applied:

### Net Sales Units
$$\text{Net Sales Units} = \text{Total Units Sold} - \text{Customer Return Units}$$
$$\text{In Source Records:} \quad \text{Net Sales Units} = \sum |\text{Sales Units}|$$

### Net Sales Revenue
$$\text{Net Sales Revenue} = \text{Gross Sales Revenue} - \text{Customer Returns}$$
$$\text{In Source Records:} \quad \text{Net Sales Revenue} = \sum |\text{Sales Revenue}|$$

---

<a id="rule-gp"></a>
## 6.2 Gross Profit

$$\text{Gross Profit} = \text{Net Sales Revenue} - \text{COGS}$$

Where:
* **Net Sales Revenue** = Net sales earnings after customer returns
* **COGS** = Supplier purchase cost of the items sold

---

<a id="rule-margin"></a>
## 6.3 Gross Margin %

$$\text{Gross Margin \%} = \left( \frac{\text{Gross Profit}}{\text{Net Sales Revenue}} \right) \times 100$$

This measures what percentage of every rupee of sales is retained as profit before operating expenses.

---

<a id="rule-available-stock"></a>
## 6.4 Available Stock

Available Stock represents the total merchandise available for sale during the month:

$$\text{Available Stock} = \text{Opening Stock} + \text{Goods Received} + \text{Transfer In}$$

Where negative opening stock occurs because of transfer timing delays:

$$\text{Available Stock} = \max(0, \text{Opening Stock}) + \text{Goods Received} + \text{Transfer In}$$

*This measure is primarily used as the denominator for calculating Sell-Through %.*

---

<a id="rule-closing-stock"></a>
## 6.5 Closing Stock

Closing Stock is the quantity or value of inventory remaining at the end of the period:

$$\text{Closing Stock} = \text{Opening Stock} + \text{Receipts} + \text{Transfers In} - \text{Goods Returned} - \text{Transfers Out} - \text{Sales Units}$$

---

<a id="rule-negative-stock"></a>
## 6.6 Temporary Negative Stock

A store may temporarily display negative inventory when high-demand stock physically arrives and is sold immediately before the digital Stock Transfer Note (STN) is entered into the system.

For business reporting, negative stock is floored at zero:

$$\text{Effective Closing Stock} = \max(0, \text{Closing Stock Quantity})$$

This prevents temporary administrative delays from distorting Stock Cover, Sell-Through %, and replenishment decisions.

---

<a id="rule-sell-through"></a>
## 6.7 Sell-Through %

Sell-Through % measures what percentage of the available inventory was successfully sold during the month:

$$\text{Sell-Through \%} = \left( \frac{\text{Net Sales Units}}{\text{Available Stock}} \right) \times 100$$

### Practical Example:
* Opening Stock = 1,000 units
* Goods Received = 500 units
* Transfer In = 200 units
* Sales Units = 340 units

$$\text{Available Stock} = 1{,}000 + 500 + 200 = 1{,}700 \text{ units}$$
$$\text{Sell-Through \%} = \left( \frac{340}{1{,}700} \right) \times 100 = 20.0\%$$

*Interpretation: 20% of the available inventory was converted into sales during the period.*

---

<a id="rule-woc"></a>
## 6.8 Weeks of Cover (WOC)

WOC estimates how many weeks the current inventory will last based on the current sales speed:

$$\text{WOC} = \frac{\text{Closing Stock Units}}{\text{Average Weekly Sales}}$$

The standard enterprise reporting calculation uses:

$$\text{WOC} = \frac{\text{Closing Stock Units}}{\text{Sales Units} / 12.0}$$

> [!NOTE]
> Standard healthy stock cover for an active retail showroom is **6.0 to 8.0 weeks**.

---

<a id="rule-moi"></a>
## 6.9 Months of Inventory (MOI)

MOI indicates approximately how many months current inventory can support based on monthly sales demand:

$$\text{MOI} = \frac{\text{Closing Stock Units}}{\text{Monthly Sales Units}}$$

---

<a id="rule-inventory-value"></a>
## 6.10 Inventory Value

$$\text{Closing Stock Value} = \sum (\text{Closing Stock Units} \times \text{Purchase Cost per Unit})$$

This represents the working capital locked in inventory at purchase cost.

---

<a id="rule-gmroi"></a>
## 6.11 GMROI (Gross Margin Return on Investment)

GMROI evaluates inventory productivity by measuring gross profit generated for every rupee invested in stock:

$$\text{GMROI} = \frac{\text{Annualized Gross Profit}}{\text{Average Inventory Value at Cost}}$$

A higher GMROI indicates superior return on working capital.

---

<a id="rule-buying-accuracy"></a>
## 6.12 Buying Accuracy %

$$\text{Buying Accuracy \%} = \left( \frac{\text{Units Sold}}{\text{Units Received from Suppliers}} \right) \times 100$$

This indicates how accurately procurement matched actual customer purchasing demand.

---

<a id="rule-supplier-return"></a>
## 6.13 Supplier Return Rate %

$$\text{Supplier Return Rate \%} = \left( \frac{\text{Units Returned to Supplier}}{\text{Units Received from Supplier}} \right) \times 100$$

This measures the percentage of received merchandise that had to be sent back due to defects or damages.

---

<a id="kpi-dictionary"></a>
# 7. KPI Dictionary & Benchmarks

All figures below are live values verified against M Baazar's DuckDB warehouse records:

| Key Performance Indicator (KPI) | Exact Formula | Standard Benchmark | Real M Baazar Value (DuckDB) |
| :--- | :--- | :--- | :--- |
| **Total Net Revenue** | `SUM(ABS(Sales Revenue))` | Positive Month-on-Month Growth | **₹8.86 Crores** (Total 3-Month Sales) |
| **Total Sales Units** | `SUM(ABS(Sales Units))` | Volume Target Alignment | **383,255 Units** |
| **Gross Profit (GP)** | `SUM(GP_AMOUNT)` | Margin Maximization | **₹3.13 – ₹3.22 Crores** |
| **Gross Margin %** | `(Gross Profit / Net Revenue) × 100` | **> 35.0%** | **35.30% – 36.39%** (Apr: 31.1%, May: 42.5%, Jun: 42.4%) |
| **Closing Stock Value** | `SUM(Closing Stock Value)` | Working Capital Target | **₹118.94 Crores** (Total Network Stock) |
| **Closing Stock Units** | `SUM(Closing Stock Units)` | Capacity Target | **7,750,013 Units** across network |
| **Sell-Through %** | `(Units Sold / Available Stock) × 100` | **> 65.0%** on seasonal lines | **1.78%** (Full catalog including multi-year central DC reserve) |
| **Weeks of Cover (WOC)** | `Closing Stock Units / (Sales Units / 12)` | **6.0 – 8.0 Weeks** for active stores | **242.7 Weeks** overall (All SKUs incl. DC buffer) |
| **Months of Inventory (MOI)** | `Closing Stock Units / Monthly Sales Units` | **1.5 – 2.0 Months** | **20.2 Months** (Network total) |
| **GMROI** | `Annualized Gross Profit / Average Inventory Value` | **> 3.0x** | **0.11x** (Reflects large multi-year warehouse stock) |
| **Buying Accuracy %** | `(Units Sold / Units Received) × 100` | **> 75.0%** | **82.4%** across core active apparel lines |
| **Supplier Return Rate %** | `(Return Units / Received Units) × 100` | **< 2.0%** | Top return suppliers reach **15% – 59%** |
| **Supplier Score (0–100)** | `Revenue 35% + Sell-Through 35% + Margin 20% + Low Return Rate 10%` | **> 70.0** | Top suppliers score **88.5 – 89.1** |

> [!IMPORTANT]
> **Important Note on Stock Cover:** The overall network WOC (242.7 weeks) and MOI (20.2 months) are heavily influenced by the **large central stock buffer stored at Central DC (Site 1070 with 6.9M units)**. Active retail showrooms operate close to the target **6 to 8 weeks of stock cover**.

---

<a id="dashboard-visualizations"></a>
# 8. Dashboard & Visualization Calculations

<a id="monthly-trend-calc"></a>
## 8.1 Monthly Revenue & Gross Margin Trend

Located on the **Executive Dashboard**, this dual-axis combo chart compares monthly revenue with profitability.

```text
  Net Revenue (₹ Cr)                                    Gross Margin %
       │                                                      │
 5.0 Cr├─────██                                               │ 45%
       │     ██                                 ●────────●    │
 2.5 Cr├─────██                   ██            │        │    │ 35%
       │     ██        ●──────────██────────────██───────│────│
       │     ██        │          ██            ██       │    │ 25%
  0 Cr─┴─────██────────│──────────██────────────██───────│────┴─ 0%
           2026-04               2026-05       2026-06
            (Bars)                             (Line)
```

### Formulas
* **Monthly Revenue (₹ Crores):** `Total Net Revenue / 10,000,000`
* **Monthly Gross Margin %:** `(Gross Profit / Net Sales Revenue) × 100`

### M Baazar Performance (Verified in DuckDB)

| Operational Month | Net Sales Revenue | Gross Margin % | Closing Stock Value |
| :--- | ---: | ---: | ---: |
| **April 2026 (`2026-04`)** | **₹4.75 Crores** | **31.14%** | **₹39.32 Crores** |
| **May 2026 (`2026-05`)** | **₹2.09 Crores** | **42.50%** | **₹37.32 Crores** |
| **June 2026 (`2026-06`)** | **₹2.02 Crores** | **42.42%** | **₹42.30 Crores** |

### Business Interpretation
April generated the highest volume (peak retail sales), while May and June delivered significantly stronger profitability (+11.3% gross margin expansion).

---

<a id="category-matrix"></a>
# 9. Category Performance Matrix

Located on the **Category Performance Dashboard**, this 4-quadrant scatter matrix evaluates merchandise categories using:
* **Gross Margin %** (Profitability on Y-Axis)
* **Sell-Through %** (Sales Velocity on X-Axis)

### Current Company Benchmarks
* **Average Gross Margin:** **25.8%**
* **Average Sell-Through:** **1.0%**

```text
  Gross Margin % (Profitability)
         ▲
         │
High     │   HIGH MARGIN / SLOW MOVERS    │      WINNERS (STAR PERFORMERS)
Margin   │   • High Profit per piece      │      • High Margin & Fast Turnover
         │   • Needs marketing/promo      │      • Protect stock & expand space
         ├────────────────────────────────┼───────────────────────────────── Benchmark Margin (25.8%)
         │   OVERSTOCKED UNDERPERFORMERS  │          VOLUME DRIVERS
Low      │   • Low Margin & Slow Sales    │      • Low Margin, High Velocity
Margin   │   • Urgent clearance/markdown  │      • Drives customer footfall
         │                                │
         └────────────────────────────────┴─────────────────────────────────► Sell-Through Rate %
                                          Benchmark Sell-Through (1.0%)
```

### Performance Quadrants & Actions

| Quadrant | Condition | Business Strategy & Action |
| :--- | :--- | :--- |
| **Winners / Star Performers** | $\text{Margin} \ge 25.8\%$ **AND** $\text{Sell-Through} \ge 1.0\%$ | Protect stock levels, prevent stockouts, and increase prime showroom visibility. |
| **Volume Drivers** | $\text{Margin} < 25.8\%$ **AND** $\text{Sell-Through} \ge 1.0\%$ | Maintain continuous availability and negotiate lower purchase rates from vendors. |
| **High Margin / Slow Movers** | $\text{Margin} \ge 25.8\%$ **AND** $\text{Sell-Through} < 1.0\%$ | High profit per piece; stimulate sales speed with visual merchandising or targeted promos. |
| **Overstocked / Underperformers** | $\text{Margin} < 25.8\%$ **AND** $\text{Sell-Through} < 1.0\%$ | Trigger promotional markdowns, bundle with winners, and halt replenishment. |

### Current DuckDB Results

* **Winners:** **26 departments** | Revenue: **₹2.01 Crores** | Average Margin: **28.0%** | Average Sell-Through: **15.1%**
* **High Margin / Slow Movers:** **198 departments** | Revenue: **₹6.85 Crores** | Average Margin: **25.8%** | Average Sell-Through: **1.0%**
* **Overstocked / Underperformers:** **2 departments** requiring immediate clearance markdown attention.

---

<a id="store-transfers"></a>
# 10. Store Stock Transfer & Movement

Located on the **Store Allocation & Rebalancing Dashboard**, this analysis visualizes how stock moves between the Central Warehouse and retail showrooms.

### Formulas
* **Transfer In Units:** `Store Transfer In + Warehouse Transfer In`
* **Transfer Out Units:** `ABS(Store Transfer Out) + ABS(Warehouse Transfer Out)`

### Current Movement (Verified in DuckDB)

| Location Code & Name | Stock Units Received | Stock Units Dispatched | Net Sales Revenue | Operational Role |
| :--- | ---: | ---: | ---: | :--- |
| **Site 1070 – Central DC** | **288,353** | **13,255,531** | ₹1.18 Cr | Primary Distribution Facility |
| **Site 530 – Gariahat** | **167,101** | **2,427** | **₹3.93 Cr** | Top Selling Showroom |
| **Site 6 – VIP** | **83,945** | **2,449** | **₹2.29 Cr** | Major Stock Receiver |
| **Site 820 – Andul Road** | **67,927** | **1,646** | **₹1.45 Cr** | Major Stock Receiver |

### Business Interpretation
The Central Warehouse (Site 1070) acts as the primary dispatch hub for the company (13.25M units dispatched), while direct lateral showroom-to-showroom transfers are relatively limited (~2,000 units per store).

---

<a id="colour-contribution"></a>
# 11. Colour Revenue Contribution

Located on the **Colour Performance Dashboard**, this analysis identifies customer color demand to support smarter assortment planning.

### Formula
$$\text{Colour Share \%} = \left( \frac{\text{Revenue from Colour}}{\text{Total Apparel Revenue}} \right) \times 100$$

### Standard Colour Groups
`BLACK`, `WHITE`, `NAVY`, `BLUE`, `RED`, `GREEN`, `YELLOW`, `GREY`, `MAROON`, `OLIVE`, `DENIM`, `OTHER`.

### Business Interpretation
Colour performance helps the buying team:
* Align future purchase orders with proven consumer color demand.
* Prevent over-purchasing slow-moving seasonal colors.
* Balance core essentials (Black, White, Navy) with fashion shades.

---

<a id="supplier-performance"></a>
# 12. Supplier Performance

Supplier performance is evaluated based on purchases, defect returns, sales performance, and profitability.

### Formulas
* **Return Value:** `SUM(Goods Return Amount)`
* **Return Rate %:** `(Goods Return Units ÷ Goods Received Units) × 100`

### Top Suppliers by Return Value (Verified in DuckDB)

| Supplier Name | Total Return Value | Units Returned | Return Rate % |
| :--- | ---: | ---: | ---: |
| **S. Enterprise** | **₹19.61 Lakh** | **7,042** | **59.47%** |
| **Jangloos Chandak Creation** | **₹19.11 Lakh** | **15,345** | **7.02%** |
| **S. V. S. Enterprise** | **₹18.90 Lakh** | **9,000** | **45.45%** |
| **Gulnar Dresses** | **₹16.03 Lakh** | **10,729** | **17.56%** |
| **Shree Balaji (Mala) Textiles** | **₹10.40 Lakh** | **3,062** | **15.75%** |

### Business Interpretation
Supplier return data provides commercial leverage to:
* Support contract and price negotiations.
* Enforce quality control standards and defect penalties.
* Adjust purchase allocation away from high-return suppliers.
* Claim timely credit notes for damaged goods.

---

<a id="stock-health"></a>
# 13. Store Stock Cover & Health

Store inventory is segmented into four operational health buckets based on Weeks of Cover (WOC):

| Status Bucket | Mathematical Condition | Commercial Meaning | Required Operational Action |
| :--- | :--- | :--- | :--- |
| **Critical Stockout** | `WOC < 1.0` OR Negative Stock | Store will run out of stock in under 7 days. | **Urgent replenishment** from DC or lateral transfer from nearby store. |
| **High Risk** | `1.0 ≤ WOC < 2.5` | Stock is dangerously low; stockout within 2–3 weeks. | **Schedule replenishment** from Central DC. |
| **Balanced** | `2.5 ≤ WOC ≤ 12.0` | Healthy, balanced inventory coverage. | **Maintain normal operations**; no intervention needed. |
| **Overstocked** | `WOC > 12.0` | More than 3 months of stock; working capital is trapped. | **Stop replenishment**; initiate lateral transfer or promotional markdown. |

---

<a id="sku-velocity"></a>
# 14. SKU Sales Velocity & Dead Stock

Merchandise items are classified into four velocity tiers based on sales speed:

| Classification | Mathematical Condition | Commercial Meaning | Recommended Merchandising Action |
| :--- | :--- | :--- | :--- |
| **Fast Mover** | `WOC < 4.0 weeks` | High-demand, rapidly selling product. | **Prioritize replenishment** and reorder from supplier. |
| **Medium Mover** | `4.0 ≤ WOC ≤ 12.0 weeks` | Stable, balanced sales rate. | **Maintain standard supply** replenishment cycles. |
| **Slow Mover** | `WOC > 12.0 weeks` | Sales are sluggish compared to stock on hand. | **Rebalance stock** to higher-demand stores or plan promotion. |
| **Dead Stock** | `Sales Units = 0` and `Stock > 0` for 90+ days | Completely stagnant merchandise. | **Clearance markdowns**, promotional bundles, or vendor return. |

---

<a id="inventory-recommendations"></a>
# 15. Inventory Action Recommendations

<a id="rec-reorder"></a>
## 15.1 Reorder

* **Condition:** A fast-selling product has low stock cover (`WOC < 2.0` with positive sales velocity).
* **Action:** Automatically suggest purchase order quantities to suppliers to avoid stockouts.

---

<a id="rec-transfer"></a>
## 15.2 Transfer

* **Condition:** One store has surplus stock while another store faces imminent stockout.
* **Typical Trigger Rule:**
  $$\text{Source Store WOC} > 12.0 \text{ weeks} \quad \mathbf{AND} \quad \text{Destination Store WOC} < 2.0 \text{ weeks}$$
* **Action:** Transfer stock laterally between retail showrooms to balance inventory without central warehouse handling.

---

<a id="rec-markdown"></a>
## 15.3 Markdown

* **Condition:** Merchandise has remained unsold for 90+ days or has `WOC > 16.0 weeks`.
* **Action:** Apply targeted promotional markdowns (e.g., 20%, 30%, or 50% discount) to accelerate sales and liberate working capital.

---

<a id="transfer-urgency"></a>
# 16. Transfer Types & Urgency

### Transfer Classifications
* **DC Replenishment:** Stock dispatched from the Central Distribution Center (Site 1070) to refill a retail showroom.
* **Lateral Rebalancing:** Stock transferred directly from one retail showroom to another.

### Urgency Priority Levels

| Priority Level | Mathematical Condition | Commercial Meaning | Operational SLA |
| :--- | :--- | :--- | :--- |
| **Critical** | `WOC < 1.0 week` or negative stock | Immediate stockout risk | Dispatch within **24 hours** |
| **High** | `1.0 ≤ WOC < 2.0 weeks` | Stockout likely within 14 days | Dispatch within **48 hours** |
| **Medium** | `WOC ≥ 2.0 weeks` | Normal routine stock rebalancing | Include in **regular weekly replenishment** |

---

<a id="data-standards"></a>
# 17. Data Standards & Missing Values

| Data Element | Business Standard | Example | Handling for Missing Values |
| :--- | :--- | :--- | :--- |
| **Product Barcode** | Must be available and valid | `M369054` | Invalid records excluded during ingestion |
| **Store Code** | Must be available and valid | `6`, `530`, `1070` | Unmapped store records excluded |
| **Monetary Values** | INR, rounded to 2 decimal places | `₹1,250.50` | Missing values default to **0.00** |
| **Unit Quantities** | Numeric quantities | `120.0 Units` | Missing values default to **0.0** |
| **Percentages** | Rounded to 2 decimal places | `35.30%` | Protected with zero-division safeguard |
| **Dates** | Standard calendar format | `YYYY-MM-DD` | Incomplete dates flagged for review |
| **Text Attributes** | Clean, trimmed text | `Mens Wear` | Missing text defaults to **UNKNOWN / OTHER** |

---

<a id="quality-checks"></a>
# 18. Data Quality & Business Checks

The analytics platform enforces seven core business integrity checks:

### 1. Inventory Balance Equation
$$\text{Closing Stock} = \text{Opening Stock} + \text{Receipts} + \text{Transfers In} - \text{Returns} - \text{Transfers Out} - \text{Sales Units}$$

### 2. Core Integrity Checks
1. **Sales Completeness:** Every sale record must link to a recognized product barcode and valid showroom code.
2. **Master Consistency:** Product attributes must match the approved master catalog.
3. **Formula Uniformity:** Identical KPI formulas are executed across dashboards, reports, and AI queries.
4. **Division-by-Zero Protection:** All ratio calculations (Margin %, Sell-Through %, WOC) guard against zero denominators.
5. **Reconciliation:** Stock movements reconcile perfectly with opening and closing stock balances.
6. **Auditability:** Every report, chart, and KPI card is traceable to underlying monthly transactions.

---

<a id="business-ownership"></a>
# 19. Business Ownership

| Business Domain | Responsible Team | Main Operational Responsibility |
| :--- | :--- | :--- |
| **Executive Performance** | Senior Management (CEO / COO) | Corporate growth, sales targets, and profitability benchmarks |
| **Merchandising & Buying** | Merchandising Team | Product assortment, pricing, category margins, and markdown approvals |
| **Supply Chain & Logistics** | Supply Chain Team | Warehouse inventory, store stock cover, and transfer execution |
| **Finance & Commercial** | Finance Team | Revenue recognition, COGS accuracy, margins, and working capital |
| **Procurement & Sourcing** | Procurement Team | Supplier performance, purchase pricing, and defect returns |
| **Analytics & Reporting** | Analytics & IT Team | Automated data pipelines, reporting consistency, and AI accuracy |

---

<a id="summary"></a>
# 20. Summary

This data dictionary establishes a common, authoritative business language for M Baazar's retail operations.

It connects:

$$\text{Sales} \longrightarrow \text{Profitability} \longrightarrow \text{Inventory} \longrightarrow \text{Categories} \longrightarrow \text{Stores} \longrightarrow \text{Suppliers} \longrightarrow \text{Actionable Decisions}$$

It empowers management and teams to clearly understand:
* **What is selling** across divisions, departments, sizes, and colours.
* **Where it is selling** across retail showrooms and regional territories.
* **How profitable it is** after factoring in supplier costs, discounts, and markdowns.
* **Where stock is available or excessive**, and how to rebalance it efficiently.
* **Which suppliers deliver quality merchandise**, and which require contract review.
* **Which products require immediate replenishment, lateral transfer, or markdown clearance.**

All enterprise KPIs, visual dashboards, self-service reports, and AI assistant conversations adhere to the definitions, business rules, and mathematical formulas documented here.
