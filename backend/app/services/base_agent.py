from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple

from backend.app.services.agent_tools import (
    get_schema,
    describe_object,
    execute_readonly_sql,
    inspect_result,
    semantic_lookup,
    search_entities,
    execute_sub_analysis,
    AUTHORITATIVE_BUSINESS_RULES,
    AUTHORITATIVE_CLICKHOUSE_CATALOG,
)
from backend.app.services.groq_llm_service import groq_service


class BaseAnalyticsAgent(ABC):
    """
    Unified Base Agent Architecture for M Baazar analytical capabilities:
      - Conversational Analytics Agent (Chat/Wren)
      - Recommendation Agent (Inventory Replenishment & Lateral Transfers)

    Shared Capabilities:
      1. Tool dispatching (schema discovery, object description, read-only SQL, result inspection, semantic lookup, entity resolution, sub-analysis).
      2. Safe read-only execution with row limit & timeout enforcement.
      3. Result structure inspection & completeness validation.
      4. Auto-correction & query refinement loop on warehouse exceptions.
      5. Bounded iteration execution limit (MAX_ITERATIONS).
      6. Authoritative ClickHouse catalog & business rules exposure.
    """

    MAX_ITERATIONS: int = 4

    def __init__(self):
        self.catalog = AUTHORITATIVE_CLICKHOUSE_CATALOG
        self.business_rules = AUTHORITATIVE_BUSINESS_RULES

    def execute_tool(self, tool_name: str, db: Any, **kwargs) -> Dict[str, Any]:
        """
        Shared agent tool dispatching interface.
        """
        clean_tool = tool_name.strip().lower()

        if clean_tool in ("execute_readonly_sql", "execute_sql", "sql"):
            sql = kwargs.get("sql") or kwargs.get("query", "")
            return execute_readonly_sql(db, sql)

        elif clean_tool in ("get_schema", "schema", "list_tables"):
            database = kwargs.get("database", "mb_olap_v2")
            return get_schema(db, database=database)

        elif clean_tool in ("describe_object", "describe_table", "describe"):
            object_name = kwargs.get("object_name") or kwargs.get("table", "")
            database = kwargs.get("database", "mb_olap_v2")
            return describe_object(db, object_name=object_name, database=database)

        elif clean_tool in ("semantic_lookup", "lookup_semantic", "semantic"):
            term = kwargs.get("term") or kwargs.get("metric") or kwargs.get("concept", "")
            return semantic_lookup(term=term)

        elif clean_tool in ("search_entities", "resolve_entity", "search_entity"):
            entity_name = kwargs.get("entity_name") or kwargs.get("name") or kwargs.get("query", "")
            entity_types = kwargs.get("entity_types")
            limit = kwargs.get("limit", 10)
            return search_entities(db=db, entity_name=entity_name, entity_types=entity_types, limit=limit)

        elif clean_tool in ("execute_sub_analysis", "sub_analysis", "drilldown"):
            dimension = kwargs.get("dimension", "store")
            metrics = kwargs.get("metrics")
            filters = kwargs.get("filters")
            comparison_context = kwargs.get("comparison_context")
            sort_by = kwargs.get("sort_by")
            sort_asc = kwargs.get("sort_asc", False)
            limit = kwargs.get("limit", 10)
            return execute_sub_analysis(
                db=db,
                dimension=dimension,
                metrics=metrics,
                filters=filters,
                comparison_context=comparison_context,
                sort_by=sort_by,
                sort_asc=sort_asc,
                limit=limit
            )

        elif clean_tool in ("inspect_result", "inspect"):
            data = kwargs.get("data", [])
            columns = kwargs.get("columns", [])
            intent = kwargs.get("intent")
            return inspect_result(data=data, columns=columns, intent=intent)

        else:
            return {
                "success": False,
                "error": f"Unknown tool: '{tool_name}'. Available tools: get_schema, describe_object, semantic_lookup, search_entities, execute_readonly_sql, inspect_result, execute_sub_analysis."
            }

    def execute_with_self_correction(
        self,
        db: Any,
        sql: str,
        intent: str,
        dialect: str = "clickhouse"
    ) -> Dict[str, Any]:
        """
        Executes analytical SQL with automated error handling and LLM self-correction.
        """
        res = self.execute_tool("execute_readonly_sql", db, sql=sql)
        if res["success"]:
            return res

        err_msg = res.get("error", "Unknown SQL execution error")
        try:
            refined_sql = groq_service.refine_sql_error(
                broken_sql=sql,
                error_trace=err_msg,
                user_prompt=intent,
                dialect=dialect
            )
            if refined_sql and refined_sql.strip() != sql.strip():
                retry_res = self.execute_tool("execute_readonly_sql", db, sql=refined_sql)
                if retry_res["success"]:
                    retry_res["self_corrected"] = True
                    return retry_res
        except Exception:
            pass

        return res

    def inspect_query_data(
        self,
        data: List[Dict[str, Any]],
        columns: List[str],
        intent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Shared result inspection wrapper.
        """
        return inspect_result(data, columns, intent=intent)

    def is_category_supported(self, category: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Checks whether a recommendation category is supported by available warehouse data.
        """
        if category and category.upper() == "MARKDOWN":
            return (
                False,
                "MARKDOWN recommendations require promotional price elasticity, historical clearance discount telemetry, "
                "and markdown budget schedules, which are not integrated into the active mb_olap_v2 warehouse schema. "
                "To maintain data integrity, markdown actions are not fabricated."
            )
        return (True, None)

    def is_metric_supported(self, prompt: str, dialect: str = "clickhouse") -> Tuple[bool, Optional[Dict[str, str]]]:
        """
        Shared check for unsupported analytical metrics across both agents.
        """
        p = prompt.lower()

        # 1. Vendor fill rate & lead times
        if any(k in p for k in ["fill rate", "vendor fill", "supplier fill", "lead time", "supplier delivery"]):
            return False, {
                "metric": "Vendor Fill Rate & Supplier Lead Times",
                "reason": (
                    "Supplier delivery performance, lead-time tracking, and vendor fill rates require Purchase Order "
                    "fulfillment schedules and goods-inward receipt logs not present in the merchandise OLAP schema of mb_olap_v2."
                ),
                "sql_comment": "-- Metric Unavailable: Supplier fill rates and lead times are not captured in mb_olap_v2."
            }

        # 2. Vendor returns
        if any(k in p for k in ["vendor return", "return to vendor", "rtv rate"]):
            return False, {
                "metric": "Vendor Returns (RTV)",
                "reason": (
                    "Return-To-Vendor (RTV) manifests and supplier debit notes are corporate supply-chain accounting documents "
                    "not captured in mb_olap_v2."
                ),
                "sql_comment": "-- Metric Unavailable: Vendor returns (RTV) are not captured in mb_olap_v2."
            }

        # 3. Daily inventory history
        if any(k in p for k in ["daily stock", "daily inventory", "stock on day", "inventory on day", "intraday stock"]):
            return False, {
                "metric": "Daily Inventory History",
                "reason": (
                    "Inventory snapshots in mb_olap_v2 are recorded at monthly accounting intervals (fact_inventory). "
                    "Daily stock level history is not tracked in the current warehouse."
                ),
                "sql_comment": "-- Metric Unavailable: Daily stock history is not tracked; stock is recorded at monthly snapshot grain."
            }

        # 4. Clearance markdown schedules & price elasticity
        if any(k in p for k in ["markdown schedule", "discount history", "clearance schedule", "price elasticity", "discount percentage", "discount applied", "sale discount"]):
            return False, {
                "metric": "Discount Schedules & Price Elasticity",
                "reason": (
                    "Individual transaction line discount percentages, promotional markdown calendars, and price elasticity modeling require marketing campaign feeds "
                    "not integrated into mb_olap_v2."
                ),
                "sql_comment": "-- Metric Unavailable: Individual transaction discount percentages and markdown schedules are not captured in mb_olap_v2."
            }

        # 5. Customer CRM & Personal Data
        if any(k in p for k in ["customer name", "customer email", "customer phone", "loyalty member", "customer retention", "churn rate"]):
            return False, {
                "metric": "Customer CRM & Loyalty Analytics",
                "reason": (
                    "Customer-level CRM records (such as individual shopper names, loyalty card numbers, "
                    "customer contact info, retention metrics, and churn rates) are not captured in mb_olap_v2."
                ),
                "sql_comment": "-- Metric Unavailable: Customer CRM & loyalty profiles are not captured in mb_olap_v2."
            }

        # 6. Store Footfall & Traffic
        if any(k in p for k in ["footfall", "foot traffic", "visitor count", "store traffic", "sensor count"]):
            return False, {
                "metric": "Store Footfall & Traffic Analytics",
                "reason": (
                    "Physical store footfall counters, sensor tracking, and footfall-to-sales conversion rates "
                    "are not integrated into mb_olap_v2."
                ),
                "sql_comment": "-- Metric Unavailable: Footfall sensor feeds are not integrated into mb_olap_v2."
            }

        # 7. OpEx & Payroll
        if any(k in p for k in ["payroll", "staff salary", "employee wage", "store rent", "lease cost", "electricity bill"]):
            return False, {
                "metric": "Operating Expenses & Payroll",
                "reason": (
                    "Store lease/rent overheads, utility bills, and staff payroll operational expenses (OpEx) "
                    "are corporate financial accounting feeds not present in mb_olap_v2 merchandise OLAP."
                ),
                "sql_comment": "-- Metric Unavailable: Store OpEx and payroll are not captured in mb_olap_v2."
            }

        # 8. Web Clickstream
        if any(k in p for k in ["clickstream", "website visit", "cart abandonment", "pageview", "bounce rate"]):
            return False, {
                "metric": "E-Commerce Clickstream & Web Analytics",
                "reason": (
                    "Web clickstream, browsing sessions, online cart abandonment, and digital web traffic "
                    "telemetry are not present in mb_olap_v2."
                ),
                "sql_comment": "-- Metric Unavailable: Web clickstream and digital telemetry are not present in mb_olap_v2."
            }

        return True, None
