import os
import json
import yaml
from typing import Dict, Any, List

class WrenContextEngine:
    """
    Wren AI Context Engine powering the 5-Layer GenBI Context Architecture:
      1. Structural: Tables, columns, OLAP data types, primary & foreign keys.
      2. Semantic: Business models, calculated metrics expressions.
      3. Business: Operational definitions (sign conventions, site classifications).
      4. Operational: Approved join paths and aggregate guidelines.
      5. Behavioral: Memory of golden SQL pairs.
    """

    def __init__(self, base_dir: str = "backend/semantic"):
        self.base_dir = base_dir
        self.models = self._load_yaml(os.path.join(base_dir, "models", "olap_cube.yml"))
        self.metrics = self._load_yaml(os.path.join(base_dir, "models", "metrics.yml"))
        self.business_rules = self._load_yaml(os.path.join(base_dir, "knowledge", "business_rules.yml"))
        self.golden_sql = self._load_json(os.path.join(base_dir, "memory", "golden_sql.json"))

    def _load_yaml(self, path: str) -> Dict[str, Any]:
        if not os.path.exists(path):
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def _load_json(self, path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f) or []

    def find_matching_golden_sql(self, prompt: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves relevant golden SQL pairs using keyword match scoring.
        """
        prompt_words = set(prompt.lower().split())
        scored_pairs = []

        for item in self.golden_sql:
            q_text = item.get("question", "").lower()
            q_words = set(q_text.split())
            overlap = len(prompt_words.intersection(q_words))
            if overlap >= 2:
                scored_pairs.append((overlap, item))

        scored_pairs.sort(key=lambda x: x[0], reverse=True)
        results = [pair[1] for pair in scored_pairs[:top_k]]

        return results

    def build_system_prompt_context(self, user_prompt: str, dialect: str = "clickhouse") -> str:
        """
        Formats structured system prompt context matching Wren AI's prompt specification.
        Directly targets the ClickHouse mb_olap_v2 analytical views and dialect rules.
        """
        return self._build_clickhouse_system_prompt_context(user_prompt)

    def _build_clickhouse_system_prompt_context(self, user_prompt: str) -> str:
        """
        Generates system prompt context for ClickHouse database mb_olap_v2.
        """
        context = []
        context.append("=== WREN AI CLICKHOUSE MODELING DEFINITION LANGUAGE (MDL) CONTEXT LAYER ===")
        context.append("Database: mb_olap_v2 (ClickHouse OLAP Warehouse)")

        context.append("\n--- PREFERRED ANALYTICAL OBJECTS & SCHEMAS (mb_olap_v2) ---")
        context.append(
            "1. v_fact_sales_enriched (Pre-joined sales fact with product & store dimensions - PREFERRED FOR SALES/REVENUE):\n"
            "   Columns:\n"
            "     - period_start_date (Date), period_end_date (Date), period_month_label (String, e.g. 'Apr Q2-25', 'May Q2-25')\n"
            "     - store_code (String, e.g. 'BHUBA', 'GRHAT', 'SILCH'), store_name (String, e.g. 'M Baazar - Bhubaneswar', 'M Baazar - Gariahat')\n"
            "     - state (String, e.g. 'Odisha', 'West Bengal', 'Assam'), site_type (String)\n"
            "     - item_code (String), article_name (String)\n"
            "     - division (String), section (String), department (String, e.g. 'T Shirts', 'Casual Shirts', 'Jeans', 'Salwar Suits')\n"
            "     - group_alias (String), category1 (String), category2 (String), colour (String), vendor_name (String), style_code (String)\n"
            "     - bill_qty (Int32, net sales units sold)\n"
            "     - net_amount (Decimal(12,2), net sales revenue)\n"
            "     - cogs (Decimal(12,2), cost of goods sold)\n"
            "     - gross_profit (Decimal(12,2), gross profit = net_amount - cogs)\n"
            "     - unit_rsp (Decimal(10,2), retail selling price)\n"
            "     - effective_asp (Decimal(12,2), average selling price)\n"
            "     - margin_pct (Float64, gross margin %)\n"
            "   SIGN CONVENTION: net_amount, bill_qty, gross_profit, and cogs are ALREADY POSITIVE in v_fact_sales_enriched. DO NOT use ABS()."
        )

        context.append(
            "\n2. v_monthly_sales_trend (Pre-aggregated monthly trend across entire chain - PREFERRED FOR MONTHLY SALES QUESTIONS):\n"
            "   Columns:\n"
            "     - period_start_date (Date)\n"
            "     - period_month_label (String, e.g. 'Apr Q2-25', 'May Q2-25')\n"
            "     - total_sales_units (Int64)\n"
            "     - total_net_revenue (Decimal(38,2))\n"
            "     - total_cogs (Decimal(38,2))\n"
            "     - total_gross_profit (Decimal(38,2))\n"
            "     - gross_margin_pct (Float64)"
        )

        context.append(
            "\n3. v_store_performance_summary (Pre-aggregated store-level metrics - PREFERRED FOR STORE COMPARISONS & RANKINGS):\n"
            "   Columns:\n"
            "     - state (String), store_code (String), store_name (String)\n"
            "     - total_skus_sold (UInt64), total_sales_units (Int64), total_net_revenue (Decimal(38,2))\n"
            "     - total_cogs (Decimal(38,2)), total_gross_profit (Decimal(38,2)), gross_margin_pct (Float64)"
        )

        context.append(
            "\n4. v_category_performance_summary (Pre-aggregated category/department summary - PREFERRED FOR CATEGORY COMPARISONS):\n"
            "   Columns:\n"
            "     - division (String), section (String), department (String)\n"
            "     - total_skus (UInt64), total_sales_units (Int64), total_net_revenue (Decimal(38,2))\n"
            "     - total_cogs (Decimal(38,2)), total_gross_profit (Decimal(38,2)), gross_margin_pct (Float64)"
        )

        context.append(
            "\n5. v_fact_inventory_enriched (Pre-joined monthly stock snapshots - PREFERRED FOR INVENTORY & SOH QUESTIONS):\n"
            "   Columns:\n"
            "     - period_start_date (Date), period_end_date (Date), report_period_label (String)\n"
            "     - store_code (String), store_name (String), state (String), site_type (String)\n"
            "     - item_code (String), article_name (String), division (String), section (String), department (String), category1 (String), category2 (String), vendor_name (String)\n"
            "     - opening_qty (Int32), opening_amt (Decimal(12,2))\n"
            "     - purchase_net_qty (Int32), purchase_net_amt (Decimal(12,2))\n"
            "     - transfer_in_qty (Int32), transfer_in_amt (Decimal(12,2))\n"
            "     - transfer_out_qty (Int32), transfer_out_amt (Decimal(12,2))\n"
            "     - closing_qty (Int32, closing stock units)\n"
            "     - closing_amt (Decimal(12,2), closing stock valuation)\n"
            "     - final_sale_qty (Int32), transit_qty (Int32), transit_amt (Decimal(12,2))"
        )

        context.append(
            "\n6. fact_sales_monthly (Base monthly sales fact):\n"
            "   period_start_date (Date), period_end_date (Date), period_month_label (String), store_code (String), item_code (String),\n"
            "   bill_qty (Int32), net_amount (Decimal(12,2)), cogs (Decimal(12,2)), gross_profit (Decimal(12,2)), unit_rsp (Decimal(10,2))"
        )

        context.append(
            "\n7. fact_inventory (Base monthly inventory fact):\n"
            "   period_start_date (Date), period_end_date (Date), report_period_label (String), store_code (String), item_code (String),\n"
            "   opening_qty (Int32), opening_amt (Decimal(12,2)), purchase_net_qty (Int32), purchase_net_amt (Decimal(12,2)),\n"
            "   transfer_in_qty (Int32), transfer_in_amt (Decimal(12,2)), transfer_out_qty (Int32), transfer_out_amt (Decimal(12,2)),\n"
            "   closing_qty (Int32), closing_amt (Decimal(12,2)), final_sale_qty (Int32), transit_qty (Int32), transit_amt (Decimal(12,2))"
        )

        context.append(
            "\n8. Dimension Tables:\n"
            "   - dim_product: item_code (String), article_name (String), division (String), section (String), department (String), category1 (String), category2 (String), colour (String), vendor_name (String), rsp (Decimal(10,2))\n"
            "   - dim_location: store_code (String), store_name (String), state (String), site_type (String), admsite_code (Int32), Name (String)\n"
            "   - dim_date: date (Date), year (UInt16), quarter (UInt8), month (UInt8), month_name (String), month_period_label (String)"
        )

        context.append(
            "\n9. Legacy Backward-Compatible Tables:\n"
            "   - fact_cube_monthly: REPORT_DATE (Date), STORE_CODE, ADMSITE_CODE, BARCODE, NET_SALE_QUANTITY, NET_SALE_AMOUNT, GP_AMOUNT, CLOSING_STOCK_QUANTITY, CLOSING_STOCK_AMOUNT\n"
            "   - dim_item: ICODE, DESC1, Division, Section, Department, CNAME1, CNAME2, PARTYNAME"
        )

        context.append("\n--- CLICKHOUSE GOLDEN SQL EXAMPLES ---")
        context.append(
            "Example 1: Top 5 departments by sales revenue:\n"
            "```sql\n"
            "SELECT department, round(sum(net_amount), 2) AS total_revenue\n"
            "FROM v_fact_sales_enriched\n"
            "GROUP BY department\n"
            "ORDER BY total_revenue DESC\n"
            "LIMIT 5;\n"
            "```"
        )
        context.append(
            "Example 2: Monthly sales and revenue trend:\n"
            "```sql\n"
            "SELECT period_month_label, total_sales_units, total_net_revenue, total_gross_profit, gross_margin_pct\n"
            "FROM v_monthly_sales_trend\n"
            "ORDER BY period_start_date ASC\n"
            "LIMIT 12;\n"
            "```"
        )
        context.append(
            "Example 3: Store revenue comparison:\n"
            "```sql\n"
            "SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct\n"
            "FROM v_store_performance_summary\n"
            "ORDER BY total_net_revenue DESC\n"
            "LIMIT 10;\n"
            "```"
        )
        context.append(
            "Example 4: Category / Department performance:\n"
            "```sql\n"
            "SELECT division, department, total_sales_units, total_net_revenue, gross_margin_pct\n"
            "FROM v_category_performance_summary\n"
            "ORDER BY total_net_revenue DESC\n"
            "LIMIT 10;\n"
            "```"
        )
        context.append(
            "Example 5: Inventory closing stock valuation by department:\n"
            "```sql\n"
            "SELECT department, sum(closing_qty) AS closing_units, round(sum(closing_amt), 2) AS closing_valuation\n"
            "FROM v_fact_inventory_enriched\n"
            "GROUP BY department\n"
            "ORDER BY closing_valuation DESC\n"
            "LIMIT 10;\n"
            "```"
        )
        context.append(
            "Example 6: Top 10 items/products by sales volume units:\n"
            "```sql\n"
            "SELECT item_code, article_name, department, sum(bill_qty) AS total_units, round(sum(net_amount), 2) AS total_revenue\n"
            "FROM v_fact_sales_enriched\n"
            "GROUP BY item_code, article_name, department\n"
            "ORDER BY total_units DESC\n"
            "LIMIT 10;\n"
            "```"
        )

        context.append("\n--- CRITICAL CLICKHOUSE SQL GENERATION RULES ---")
        context.append("1. Generate ONLY a valid, executable ClickHouse SQL query inside a ```sql ... ``` code block.")
        context.append("2. Target Database: mb_olap_v2. Table and view names exist directly in the database context.")
        context.append("3. Prefer the analytical views: v_fact_sales_enriched, v_category_performance_summary, v_store_performance_summary, v_monthly_sales_trend, and v_fact_inventory_enriched.")
        context.append("4. ClickHouse Dialect Functions (MANDATORY):")
        context.append("   - Date formatting: Use formatDateTime(col, '%Y-%m') or toYYYYMM(col) or toStartOfMonth(col). NEVER use DuckDB strftime().")
        context.append("   - Date extraction: Use toYear(col), toMonth(col), toDayOfMonth(col).")
        context.append("   - String matching: Use ILIKE or replaceRegexpAll(upper(toString(col)), '[^A-Z0-9]+', '').")
        context.append("   - Type casting: Use toString(), toInt64(), toFloat64(), toDate() or CAST(x AS ...).")
        context.append("   - Rounding: Use round(val, 2).")
        context.append("   - Null division safety: Use nullIf(val, 0) or if(denom = 0, NULL, num / denom).")
        context.append("5. SIGN RULE: All metrics in v_fact_sales_enriched, fact_sales_monthly, v_store_performance_summary, v_category_performance_summary, and v_monthly_sales_trend (net_amount, bill_qty, gross_profit, cogs) are ALREADY POSITIVE. DO NOT use ABS() on these columns.")
        context.append("6. For product queries, ALWAYS include item_code and article_name.")
        context.append("7. For store queries, use store_name ILIKE '%...%' or store_code.")
        context.append("8. Store location mapping:")
        context.append("   - 'Bhubaneswar' -> store_name ILIKE '%Bhubaneswar%' or store_code = 'BHUBA'")
        context.append("   - 'Gariahat' -> store_name ILIKE '%Gariahat%' or store_code = 'GRHAT'")
        context.append("   - 'Silchar' -> store_name ILIKE '%Silchar%' or store_code = 'SILCH'")
        context.append("   - 'VIP' -> store_name ILIKE '%VIP%' or store_code = 'VIPRD'")
        context.append("9. NEVER invent columns or tables. If data is not present in mb_olap_v2 (e.g. personal customer CRM details, footfall traffic sensors, payroll/rent expenses), do not invent schemas.")
        context.append("10. ALWAYS append a LIMIT clause (default LIMIT 500 if not specified).")

        return "\n".join(context)

wren_engine = WrenContextEngine()
