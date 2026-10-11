import re
from typing import Dict, Any, List, Optional
from backend.app.services.sql_validator import sql_validator

SAFE_IDENTIFIER_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")

# In-memory caching for schema introspection queries to prevent repeated ClickHouse metadata roundtrips
_SCHEMA_CACHE: Dict[str, Any] = {}
_DESCRIBE_CACHE: Dict[str, Any] = {}

# ---------------------------------------------------------------------------
# AUTHORITATIVE CLICKHOUSE CATALOG (mb_olap_v2)
# Verified against live ClickHouse system.columns and DESCRIBE TABLE
# ---------------------------------------------------------------------------
AUTHORITATIVE_CLICKHOUSE_CATALOG: Dict[str, Dict[str, Any]] = {
    "fact_sales_monthly": {
        "type": "TABLE",
        "description": "Core retail sales fact aggregated at Store × Item × Month grain.",
        "columns": [
            "period_start_date", "period_end_date", "period_month_label", "store_code",
            "item_code", "bill_qty", "net_amount", "cogs", "gross_profit", "unit_rsp", "created_at"
        ]
    },
    "fact_inventory": {
        "type": "TABLE",
        "description": "Monthly inventory snapshot fact at Store × Item × Month grain.",
        "columns": [
            "period_start_date", "period_end_date", "report_period_label", "store_code",
            "item_code", "opening_qty", "opening_amt", "purchase_net_qty", "purchase_net_amt",
            "transfer_in_qty", "transfer_in_amt", "transfer_out_qty", "transfer_out_amt",
            "cogca_qty", "cogca_amt", "closing_qty", "final_sale_qty", "closing_amt",
            "transit_qty", "transit_amt", "created_at"
        ]
    },
    "dim_product": {
        "type": "TABLE",
        "description": "Master merchandise hierarchy dimension for product items and SKUs.",
        "columns": [
            "item_code", "article_name", "division", "section", "department",
            "group_alias", "category1", "category2", "category3", "category4",
            "category5", "category6", "colour", "vendor_name", "style_code",
            "rsp", "generated_date", "last_stock_in_date", "updated_at"
        ]
    },
    "dim_location": {
        "type": "TABLE",
        "description": "Master physical store network and regional dimension.",
        "columns": [
            "store_code", "admsite_code", "store_name", "state", "site_type",
            "Name", "ADMSITE_CODE", "SITE_TYPE"
        ]
    },
    "dim_date": {
        "type": "TABLE",
        "description": "Retail calendar and date dimension.",
        "columns": [
            "date", "year", "quarter", "month", "month_name",
            "month_period_label", "day_of_month", "day_of_week", "day_name", "is_weekend"
        ]
    },
    "fact_cube_monthly": {
        "type": "TABLE",
        "description": "Compatibility enterprise OLAP cube fact table.",
        "columns": [
            "REPORT_DATE", "START_DATE", "END_DATE", "CUBENAME", "STORE_CODE",
            "ADMSITE_CODE", "BARCODE", "NET_SALE_QUANTITY", "RETAIL_SALE_QUANTITY",
            "NET_SALE_AMOUNT", "RETAIL_SALE_AMOUNT", "NET_SALE_COGS_AMOUNT", "GP_AMOUNT",
            "ADJUSTED_GP_AMOUNT", "OPENING_QUANTITY", "OPENING_AMOUNT",
            "GOODS_RECEIVE_QUANTITY", "GOODS_RECEIVE_AMOUNT", "GOODS_RETURN_QUANTITY",
            "GOODS_RETURN_AMOUNT", "SITE_TRANSFER_IN_QUANTITY", "SITE_TRANSFER_IN_AMOUNT",
            "SITE_TRANSFER_OUT_QUANTITY", "SITE_TRANSFER_OUT_AMOUNT",
            "CLOSING_STOCK_QUANTITY", "CLOSING_STOCK_AMOUNT"
        ]
    },
    "dim_item": {
        "type": "TABLE",
        "description": "Compatibility item dimension for legacy golden SQL lookups.",
        "columns": [
            "ICODE", "DESC1", "DESC2", "DESC3", "Division", "Section", "Department",
            "department_alias", "CNAME1", "CNAME2", "CNAME3", "CNAME4", "CNAME5",
            "CNAME6", "COLOUR", "PARTYNAME", "MRP", "RATE"
        ]
    },
    "v_fact_sales_enriched": {
        "type": "VIEW",
        "description": "Pre-joined retail sales fact enriched with product and store dimensions. Primary view for conversational revenue, units, and margin analytics.",
        "columns": [
            "period_start_date", "period_end_date", "period_month_label", "store_code",
            "store_name", "state", "site_type", "item_code", "article_name", "division",
            "section", "department", "group_alias", "category1", "category2", "category3",
            "category4", "category5", "category6", "colour", "vendor_name", "style_code",
            "bill_qty", "net_amount", "cogs", "gross_profit", "unit_rsp", "effective_asp", "margin_pct"
        ]
    },
    "v_category_performance_summary": {
        "type": "VIEW",
        "description": "Pre-aggregated department and division category performance summary.",
        "columns": [
            "division", "section", "department", "total_skus", "total_sales_units",
            "total_net_revenue", "total_cogs", "total_gross_profit", "gross_margin_pct"
        ]
    },
    "v_store_performance_summary": {
        "type": "VIEW",
        "description": "Pre-aggregated store-level performance, revenue, sales units, and profit rankings.",
        "columns": [
            "state", "store_code", "store_name", "total_skus_sold", "total_sales_units",
            "total_net_revenue", "total_cogs", "total_gross_profit", "gross_margin_pct"
        ]
    },
    "v_monthly_sales_trend": {
        "type": "VIEW",
        "description": "Pre-aggregated monthly sales and profit trends across the entire retail network.",
        "columns": [
            "period_start_date", "period_month_label", "total_sales_units", "total_net_revenue",
            "total_cogs", "total_gross_profit", "gross_margin_pct"
        ]
    },
    "v_fact_inventory_enriched": {
        "type": "VIEW",
        "description": "Pre-joined monthly stock snapshot enriched with product and store dimensions. Primary view for SOH, stock cover, replenishment, and lateral transfers.",
        "columns": [
            "period_start_date", "period_end_date", "report_period_label", "store_code",
            "admsite_code", "store_name", "state", "site_type", "item_code", "article_name",
            "division", "section", "department", "group_alias", "category1", "category2",
            "category3", "category4", "category5", "category6", "colour", "vendor_name",
            "style_code", "rsp", "opening_qty", "opening_amt", "purchase_net_qty",
            "purchase_net_amt", "transfer_in_qty", "transfer_in_amt", "transfer_out_qty",
            "transfer_out_amt", "cogca_qty", "cogca_amt", "closing_qty", "final_sale_qty",
            "closing_amt", "transit_qty", "transit_amt", "created_at"
        ]
    }
}

# ---------------------------------------------------------------------------
# AUTHORITATIVE BUSINESS RULES
# Shared governance definitions enforced across Conversational & Recommendation Agents
# ---------------------------------------------------------------------------
AUTHORITATIVE_BUSINESS_RULES: Dict[str, str] = {
    "signed_sales": "Preserve signed sales values. Do not automatically apply ABS() to sales or revenue.",
    "sales_grain": "Sales transactions are aggregated at Store x Item x Month grain (fact_sales_monthly, v_fact_sales_enriched).",
    "inventory_grain": "Inventory balances are snapshot balances at Store x Item x Month grain (fact_inventory, v_fact_inventory_enriched).",
    "distinguish_sales_vs_inventory": "Never confuse sales quantity (bill_qty / NET_SALE_QUANTITY) with inventory quantity (closing_qty / CLOSING_STOCK_QUANTITY).",
    "no_daily_inventory": "Daily inventory balance history is not available; stock snapshots are recorded on monthly accounting cycles.",
    "no_vendor_returns": "Vendor return rate telemetry is not captured in mb_olap_v2.",
    "no_fill_rate": "Supplier lead time, purchase order delivery time, and vendor fill rates are not tracked in the current warehouse.",
    "no_discount_markdown_history": "Clearance markdown schedules, promotional calendars, and price elasticity feeds are not present in mb_olap_v2.",
    "store_mappings": "Location mapping must use canonical store_code / admsite_code from dim_location.",
    "weeks_of_cover": "WOC is calculated as closing_qty / weekly_sales_run_rate where weekly_sales_run_rate = sum(bill_qty) / 24.0.",
}


def get_schema(db: Any, database: str = "mb_olap_v2") -> Dict[str, Any]:
    """
    Agent Tool: get_schema
    Retrieves the authoritative catalog of analytical tables, views, and columns.
    Results are cached in memory to optimize agent performance.
    """
    if database in _SCHEMA_CACHE:
        return _SCHEMA_CACHE[database]

    catalog = {
        "database": database,
        "authoritative_objects": list(AUTHORITATIVE_CLICKHOUSE_CATALOG.keys()),
        "analytical_views": [
            {
                "name": k,
                "description": v["description"],
                "key_columns": v["columns"][:10]
            }
            for k, v in AUTHORITATIVE_CLICKHOUSE_CATALOG.items() if v["type"] == "VIEW"
        ],
        "tables": [k for k, v in AUTHORITATIVE_CLICKHOUSE_CATALOG.items() if v["type"] == "TABLE"]
    }

    try:
        query = f"SELECT name, engine, total_rows FROM system.tables WHERE database = '{database}'"
        cursor = db.execute(query)
        rows = cursor.fetchall()
        catalog["live_tables"] = [{"name": r[0], "engine": r[1], "rows": r[2]} for r in rows]
    except Exception:
        pass

    _SCHEMA_CACHE[database] = catalog
    return catalog


def describe_object(db: Any, object_name: str, database: str = "mb_olap_v2") -> Dict[str, Any]:
    """
    Agent Tool: describe_object
    Inspects columns, types, and schema details for a specific table or view in mb_olap_v2.
    """
    clean_name = object_name.strip().strip("'\"`")
    cache_key = f"{database}.{clean_name}"
    if cache_key in _DESCRIBE_CACHE:
        return _DESCRIBE_CACHE[cache_key]

    if not SAFE_IDENTIFIER_PATTERN.match(clean_name):
        return {
            "success": False,
            "object_name": clean_name,
            "columns": [],
            "error": f"Invalid object identifier: '{clean_name}'. Only alphanumeric characters and underscores are allowed."
        }

    try:
        query = f"DESCRIBE TABLE {database}.{clean_name}"
        cursor = db.execute(query)
        rows = cursor.fetchall()
        columns_info = [
            {"name": r[0], "type": r[1], "default_type": r[2] if len(r) > 2 else ""}
            for r in rows
        ]
        res = {
            "success": True,
            "object_name": clean_name,
            "columns": columns_info,
            "column_count": len(columns_info),
            "error": None
        }
        _DESCRIBE_CACHE[cache_key] = res
        return res
    except Exception as e:
        return {
            "success": False,
            "object_name": clean_name,
            "columns": [],
            "error": str(e)
        }


def semantic_lookup(term: str) -> Dict[str, Any]:
    """
    Agent Tool: semantic_lookup
    Retrieves authoritative semantic metric definitions, formulas, business rules,
    sign conventions, and dialect guidelines from Wren AI MDL.
    """
    clean_term = term.strip().lower()
    matches = []

    # 1. Search in wren_context_engine
    try:
        from backend.app.services.wren_context_engine import wren_engine
        for m in wren_engine.metrics.get("metrics", []):
            m_name = str(m.get("name", "")).lower()
            m_desc = str(m.get("description", "")).lower()
            if clean_term in m_name or clean_term in m_desc or any(k in m_name for k in clean_term.split() if len(k) > 2):
                matches.append({
                    "type": "metric",
                    "name": m.get("name"),
                    "expression": m.get("expression"),
                    "description": m.get("description"),
                    "model": m.get("model")
                })
    except Exception:
        pass

    # 2. Search in AUTHORITATIVE_BUSINESS_RULES
    rules = []
    for r_id, r_text in AUTHORITATIVE_BUSINESS_RULES.items():
        if clean_term in r_id.lower() or any(w in r_text.lower() for w in clean_term.split() if len(w) > 3):
            rules.append({"id": r_id, "rule": r_text})

    # 3. Canonical retail formulas
    retail_terms = {
        "gmroi": {
            "name": "GMROI (Gross Margin Return on Investment)",
            "expression": "SUM(gross_profit) / NULLIF(AVG(closing_amt), 0)",
            "description": "Gross margin returned per currency unit of inventory cost. Higher indicates better inventory efficiency.",
            "preferred_view": "v_vendor_scorecard or v_fact_inventory_enriched"
        },
        "weeks_of_cover": {
            "name": "Weeks of Cover (WOC)",
            "expression": "closing_qty / NULLIF(sum(bill_qty) / 24.0, 0)",
            "description": "Stock cover expressed in operational weeks based on current sales velocity.",
            "preferred_view": "v_fact_inventory_enriched"
        },
        "sell_through": {
            "name": "Sell-Through Rate %",
            "expression": "(sales_units / NULLIF(receive_units + opening_units, 0)) * 100",
            "description": "Percentage of inventory received that was successfully sold.",
            "preferred_view": "v_vendor_scorecard"
        },
        "gross_margin": {
            "name": "Gross Margin %",
            "expression": "(total_gross_profit / NULLIF(total_net_revenue, 0)) * 100",
            "description": "Gross profit margin percentage relative to net revenue.",
            "preferred_view": "v_store_performance_summary / v_category_performance_summary"
        }
    }
    for k, v in retail_terms.items():
        if k in clean_term or clean_term in k:
            matches.append({"type": "retail_term", **v})

    return {
        "success": True,
        "term": term,
        "metrics": matches,
        "business_rules": rules,
        "count": len(matches) + len(rules)
    }


def search_entities(
    db: Any,
    entity_name: str,
    entity_types: Optional[List[str]] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Agent Tool: search_entities
    Dynamically searches and resolves entity mentions (stores, departments, categories,
    SKUs, vendors) against ClickHouse warehouse tables without fragile regexes.
    """
    clean_name = entity_name.strip()
    if not clean_name:
        return {"success": False, "query": entity_name, "matches": [], "count": 0}

    matches = []
    types_to_search = [t.lower() for t in entity_types] if entity_types else ["store", "department", "vendor", "sku", "category"]

    # 1. Store Search
    if "store" in types_to_search:
        # Check ordinal/rank store pattern: e.g. "Store 1", "Store 3", "Store 6"
        store_ordinal_match = re.search(r"\b(?:store|outlet|shop)\s*(\d+)\b", clean_name, re.IGNORECASE)
        ordinal_rank = int(store_ordinal_match.group(1)) if store_ordinal_match else None

        try:
            store_rows = db.execute(
                "SELECT store_code, store_name, state, "
                "row_number() OVER (ORDER BY total_net_revenue DESC) AS rev_rank "
                "FROM v_store_performance_summary"
            ).fetchall()

            for r in store_rows:
                s_code, s_name, s_state, s_rank = r[0], r[1], r[2], r[3]
                is_match = False
                match_reason = ""

                if ordinal_rank is not None and s_rank == ordinal_rank:
                    is_match = True
                    match_reason = f"Rank #{ordinal_rank} store by total revenue"
                elif clean_name.lower() in s_name.lower() or clean_name.lower() in s_code.lower():
                    is_match = True
                    match_reason = "Store name/code match"
                elif clean_name.lower() in s_state.lower():
                    is_match = True
                    match_reason = "Store state match"

                if is_match:
                    matches.append({
                        "entity_type": "store",
                        "canonical_name": s_name,
                        "code": s_code,
                        "state": s_state,
                        "rank": s_rank,
                        "sql_filter": f"(store_name = '{s_name}' OR store_code = '{s_code}')",
                        "match_reason": match_reason
                    })
        except Exception:
            pass

    # 2. Department Search
    if "department" in types_to_search and len(matches) < limit:
        try:
            dept_rows = db.execute(
                f"SELECT department, total_net_revenue FROM v_category_performance_summary "
                f"WHERE department ILIKE '%{clean_name}%' "
                f"ORDER BY total_net_revenue DESC LIMIT {limit}"
            ).fetchall()
            for r in dept_rows:
                d_name = r[0]
                matches.append({
                    "entity_type": "department",
                    "canonical_name": d_name,
                    "code": d_name,
                    "sql_filter": f"department = '{d_name}'",
                    "match_reason": "Department name match"
                })
        except Exception:
            pass

    # 3. Vendor Search
    if "vendor" in types_to_search and len(matches) < limit:
        try:
            vendor_rows = db.execute(
                f"SELECT vendor_name, net_revenue FROM v_vendor_scorecard "
                f"WHERE vendor_name ILIKE '%{clean_name}%' "
                f"ORDER BY net_revenue DESC LIMIT {limit}"
            ).fetchall()
            for r in vendor_rows:
                v_name = r[0]
                matches.append({
                    "entity_type": "vendor",
                    "canonical_name": v_name,
                    "code": v_name,
                    "sql_filter": f"vendor_name = '{v_name}'",
                    "match_reason": "Vendor scorecard match"
                })
        except Exception:
            pass

    # 4. SKU / Product Search
    if "sku" in types_to_search and len(matches) < limit:
        try:
            sku_rows = db.execute(
                f"SELECT item_code, article_name, department, sum(bill_qty) AS units "
                f"FROM v_fact_sales_enriched "
                f"WHERE item_code ILIKE '%{clean_name}%' OR article_name ILIKE '%{clean_name}%' "
                f"GROUP BY item_code, article_name, department "
                f"ORDER BY units DESC LIMIT {limit}"
            ).fetchall()
            for r in sku_rows:
                matches.append({
                    "entity_type": "sku",
                    "canonical_name": f"{r[0]} ({r[1]})",
                    "code": r[0],
                    "article_name": r[1],
                    "department": r[2],
                    "sql_filter": f"item_code = '{r[0]}'",
                    "match_reason": "Product item_code / article_name match"
                })
        except Exception:
            pass

    return {
        "success": True,
        "query": entity_name,
        "matches": matches[:limit],
        "count": len(matches)
    }


def execute_sub_analysis(
    db: Any,
    dimension: str,
    metrics: Optional[List[str]] = None,
    filters: Optional[Dict[str, Any]] = None,
    comparison_context: Optional[Dict[str, Any]] = None,
    sort_by: Optional[str] = None,
    sort_asc: bool = False,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Agent Tool: execute_sub_analysis
    Universal sub-analysis generator and executor for ClickHouse warehouse.
    Supports dimensions: 'store', 'department', 'category', 'sku', 'vendor', 'inventory', 'monthly_trend'.
    Dynamically generates governed read-only ClickHouse SQL, executes it, and inspects results.
    """
    dim = dimension.strip().lower()
    flts = filters or {}
    cmp = comparison_context or {}
    order_dir = "ASC" if sort_asc else "DESC"

    # Multi-Period Comparison Sub-Analysis
    if cmp.get("period_1") and cmp.get("period_2"):
        p1 = str(cmp["period_1"])
        p2 = str(cmp["period_2"])

        where_conds = [f"(period_month_label LIKE '{p1}%' OR period_month_label LIKE '{p2}%')"]
        for k, v in flts.items():
            if v:
                where_conds.append(f"{k} = '{v}'")
        where_clause = " WHERE " + " AND ".join(where_conds)

        if dim == "store":
            sql = (
                f"SELECT store_name, "
                f"round(sum(if(period_month_label LIKE '{p1}%', net_amount, 0)), 2) AS {p1[:3].lower()}_revenue, "
                f"round(sum(if(period_month_label LIKE '{p2}%', net_amount, 0)), 2) AS {p2[:3].lower()}_revenue, "
                f"round(sum(if(period_month_label LIKE '{p2}%', net_amount, 0)) - sum(if(period_month_label LIKE '{p1}%', net_amount, 0)), 2) AS revenue_variance "
                f"FROM v_fact_sales_enriched"
                f"{where_clause} "
                f"GROUP BY store_name "
                f"ORDER BY revenue_variance {order_dir} LIMIT {limit}"
            )
        elif dim == "department":
            sql = (
                f"SELECT department, "
                f"round(sum(if(period_month_label LIKE '{p1}%', net_amount, 0)), 2) AS {p1[:3].lower()}_revenue, "
                f"round(sum(if(period_month_label LIKE '{p2}%', net_amount, 0)), 2) AS {p2[:3].lower()}_revenue, "
                f"round(sum(if(period_month_label LIKE '{p2}%', net_amount, 0)) - sum(if(period_month_label LIKE '{p1}%', net_amount, 0)), 2) AS revenue_variance "
                f"FROM v_fact_sales_enriched"
                f"{where_clause} "
                f"GROUP BY department "
                f"ORDER BY revenue_variance {order_dir} LIMIT {limit}"
            )
        elif dim in ("sku", "product", "item"):
            sql = (
                f"SELECT item_code, article_name, department, "
                f"round(sum(if(period_month_label LIKE '{p1}%', net_amount, 0)), 2) AS {p1[:3].lower()}_revenue, "
                f"round(sum(if(period_month_label LIKE '{p2}%', net_amount, 0)), 2) AS {p2[:3].lower()}_revenue, "
                f"round(sum(if(period_month_label LIKE '{p2}%', net_amount, 0)) - sum(if(period_month_label LIKE '{p1}%', net_amount, 0)), 2) AS revenue_variance "
                f"FROM v_fact_sales_enriched"
                f"{where_clause} "
                f"GROUP BY item_code, article_name, department "
                f"ORDER BY revenue_variance {order_dir} LIMIT {limit}"
            )
        else:
            sql = (
                f"SELECT period_month_label, total_sales_units, total_net_revenue, total_gross_profit, gross_margin_pct "
                f"FROM v_monthly_sales_trend "
                f"WHERE period_month_label LIKE '{p1}%' OR period_month_label LIKE '{p2}%' "
                f"ORDER BY period_start_date ASC LIMIT {limit}"
            )

    # Standard Dimension Sub-Analysis
    else:
        where_conds = []
        for k, v in flts.items():
            if v:
                where_conds.append(f"{k} = '{v}'")
        where_clause = (" WHERE " + " AND ".join(where_conds)) if where_conds else ""

        if dim == "store":
            if where_clause:
                sql = (
                    f"SELECT store_name, round(sum(net_amount), 2) AS net_revenue, "
                    f"sum(bill_qty) AS sales_units, round(sum(gross_profit), 2) AS gross_profit "
                    f"FROM v_fact_sales_enriched"
                    f"{where_clause} "
                    f"GROUP BY store_name ORDER BY net_revenue {order_dir} LIMIT {limit}"
                )
            else:
                sort_col = sort_by or "total_net_revenue"
                sql = (
                    f"SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct "
                    f"FROM v_store_performance_summary "
                    f"ORDER BY {sort_col} {order_dir} LIMIT {limit}"
                )

        elif dim == "department":
            if where_clause:
                sql = (
                    f"SELECT department, round(sum(net_amount), 2) AS net_revenue, "
                    f"sum(bill_qty) AS sales_units, round(sum(gross_profit), 2) AS gross_profit "
                    f"FROM v_fact_sales_enriched"
                    f"{where_clause} "
                    f"GROUP BY department ORDER BY net_revenue {order_dir} LIMIT {limit}"
                )
            else:
                sort_col = sort_by or "total_net_revenue"
                sql = (
                    f"SELECT division, department, total_sales_units, total_net_revenue, gross_margin_pct "
                    f"FROM v_category_performance_summary "
                    f"ORDER BY {sort_col} {order_dir} LIMIT {limit}"
                )

        elif dim in ("sku", "product", "item"):
            sql = (
                f"SELECT item_code, article_name, department, "
                f"sum(bill_qty) AS total_units, round(sum(net_amount), 2) AS total_revenue "
                f"FROM v_fact_sales_enriched"
                f"{where_clause} "
                f"GROUP BY item_code, article_name, department "
                f"ORDER BY total_revenue {order_dir} LIMIT {limit}"
            )

        elif dim == "vendor":
            sql = (
                f"SELECT vendor_name, net_revenue, gross_profit, margin_pct, sell_through_pct, current_stock_units, vendor_score "
                f"FROM v_vendor_scorecard "
                f"ORDER BY net_revenue {order_dir} LIMIT {limit}"
            )

        elif dim == "inventory":
            group_col = "store_name" if "store" in flts or not where_clause else "department"
            sql = (
                f"SELECT {group_col}, sum(closing_qty) AS closing_units, round(sum(closing_amt), 2) AS closing_valuation "
                f"FROM v_fact_inventory_enriched"
                f"{where_clause} "
                f"GROUP BY {group_col} "
                f"ORDER BY closing_valuation {order_dir} LIMIT {limit}"
            )

        elif dim == "monthly_trend":
            sql = (
                f"SELECT period_month_label, total_sales_units, total_net_revenue, total_gross_profit, gross_margin_pct "
                f"FROM v_monthly_sales_trend "
                f"ORDER BY period_start_date ASC LIMIT {limit}"
            )

        else:
            sql = (
                f"SELECT department, round(sum(net_amount), 2) AS net_revenue "
                f"FROM v_fact_sales_enriched"
                f"{where_clause} "
                f"GROUP BY department ORDER BY net_revenue {order_dir} LIMIT {limit}"
            )

    exec_res = execute_readonly_sql(db, sql)
    if not exec_res["success"]:
        return {
            "success": False,
            "dimension": dim,
            "executed_sql": sql,
            "columns": [],
            "data": [],
            "row_count": 0,
            "inspection": None,
            "error": exec_res["error"]
        }

    inspection = inspect_result(exec_res["data"], exec_res["columns"], intent=f"{dim} sub-analysis")
    return {
        "success": True,
        "dimension": dim,
        "executed_sql": exec_res["executed_sql"],
        "columns": exec_res["columns"],
        "data": exec_res["data"],
        "row_count": exec_res["row_count"],
        "inspection": inspection,
        "error": None
    }


def execute_readonly_sql(db: Any, sql: str) -> Dict[str, Any]:
    """
    Agent Tool: execute_readonly_sql
    Validates read-only safety, applies LIMIT caps and timeout, and executes analytical SQL against ClickHouse.
    """
    try:
        secured_sql = sql_validator.enforce_security_and_limits(sql)
    except Exception as sec_err:
        return {
            "success": False,
            "executed_sql": sql,
            "columns": [],
            "data": [],
            "row_count": 0,
            "error": f"Security Validation Failed: {str(sec_err)}"
        }

    try:
        cursor = db.execute(secured_sql)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        return {
            "success": True,
            "executed_sql": secured_sql,
            "columns": columns,
            "data": data,
            "row_count": len(data),
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "executed_sql": secured_sql,
            "columns": [],
            "data": [],
            "row_count": 0,
            "error": str(e)
        }


def inspect_result(data: List[Dict[str, Any]], columns: List[str], intent: Optional[str] = None) -> Dict[str, Any]:
    """
    Agent Tool: inspect_result
    Inspects returned columns, row count, nulls, numerical metrics, and detects anomalies/variances.
    """
    row_count = len(data)
    is_empty = row_count == 0

    if is_empty:
        return {
            "row_count": 0,
            "is_empty": True,
            "has_nulls": False,
            "numeric_metrics": {},
            "findings": ["Query executed successfully but returned 0 rows."],
            "requires_followup": False,
            "anomaly_detected": False,
            "top_entity": None,
            "worst_entity": None
        }

    null_counts = {col: sum(1 for r in data if r.get(col) is None) for col in columns}
    has_nulls = any(cnt > 0 for cnt in null_counts.values())

    numeric_cols = []
    numeric_metrics = {}
    for col in columns:
        vals = []
        for r in data:
            v = r.get(col)
            if isinstance(v, (int, float)):
                vals.append(float(v))
            elif hasattr(v, "to_integral"):
                vals.append(float(v))
            elif isinstance(v, str):
                try:
                    vals.append(float(v.replace(",", "")))
                except ValueError:
                    pass

        if len(vals) == row_count and vals:
            numeric_cols.append(col)
            numeric_metrics[col] = {
                "min": min(vals),
                "max": max(vals),
                "sum": round(sum(vals), 2),
                "avg": round(sum(vals) / len(vals), 2)
            }

    findings = []
    findings.append(f"Result contains {row_count} rows across {len(columns)} columns.")

    diff_cols = [c for c in numeric_cols if any(k in c.lower() for k in ["diff", "change", "variance", "growth", "delta"])]
    anomaly_detected = False
    top_declining_entity = None

    if diff_cols:
        dcol = diff_cols[0]
        neg_rows = [r for r in data if float(r.get(dcol, 0) or 0) < 0]
        if neg_rows:
            anomaly_detected = True
            worst = min(neg_rows, key=lambda x: float(x.get(dcol, 0) or 0))
            entity_label = worst.get("store_name") or worst.get("department") or worst.get("item_code") or worst.get("article_name") or "Unknown"
            worst_diff = worst.get(dcol)
            top_declining_entity = {"entity": entity_label, "drop": worst_diff}
            findings.append(f"Detected decline in {len(neg_rows)} records. Top declining entity: '{entity_label}' with variance of {worst_diff}.")

    # Top & Worst Entity Detection
    top_entity = None
    worst_entity = None
    if numeric_cols and row_count > 0:
        primary_num_col = numeric_cols[0]
        sorted_by_val = sorted(data, key=lambda r: float(r.get(primary_num_col, 0) or 0), reverse=True)
        def _get_entity_label(r):
            return r.get("store_name") or r.get("department") or r.get("vendor_name") or r.get("article_name") or r.get("item_code") or str(list(r.values())[0])

        top_entity = {
            "entity": _get_entity_label(sorted_by_val[0]),
            "metric": primary_num_col,
            "value": sorted_by_val[0].get(primary_num_col)
        }
        worst_entity = {
            "entity": _get_entity_label(sorted_by_val[-1]),
            "metric": primary_num_col,
            "value": sorted_by_val[-1].get(primary_num_col)
        }

    return {
        "row_count": row_count,
        "is_empty": False,
        "has_nulls": has_nulls,
        "null_counts": null_counts,
        "numeric_metrics": numeric_metrics,
        "findings": findings,
        "anomaly_detected": anomaly_detected,
        "top_declining_entity": top_declining_entity,
        "top_entity": top_entity,
        "worst_entity": worst_entity
    }

