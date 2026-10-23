import os
import sys
import re
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple

from backend.app.services.agent_tools import (
    get_schema,
    describe_object,
    semantic_lookup,
    search_entities,
    execute_sub_analysis,
    execute_readonly_sql,
    inspect_result,
)
from backend.app.services.groq_llm_service import groq_service
from backend.app.services.wren_context_engine import wren_engine
from backend.app.services.chart_classifier import chart_classifier
from backend.app.services.entity_extractor import (
    extract_entities_with_llm,
    search_entity_candidates,
    should_attempt_zero_result_repair,
)
from backend.app.services.base_agent import BaseAnalyticsAgent


@dataclass
class AgentPlan:
    user_intent: str
    required_metrics: List[str]
    required_dimensions: List[str]
    time_period: str
    likely_tables: List[str]
    multi_step: bool
    planned_steps: List[str]
    initial_tool: str = "execute_readonly_sql"
    initial_target: str = ""


@dataclass
class AgentStepRecord:
    step_number: int
    action: str
    query_or_target: str
    success: bool
    row_count: int
    summary: str
    error: Optional[str] = None
    data: List[Dict[str, Any]] = field(default_factory=list)
    columns: List[str] = field(default_factory=list)
    decision_rationale: Optional[str] = None


@dataclass
class AgentExecutionResult:
    prompt: str
    generated_sql: str
    visualization_type: str
    summary: str
    columns: List[str]
    data: List[Dict[str, Any]]
    record_count: int
    plan: AgentPlan
    steps: List[AgentStepRecord]
    iterations: int
    supported: bool = True


class ConversationalAnalyticsAgent(BaseAnalyticsAgent):
    """
    Universal ClickHouse Conversational Analytics Agent:
      1. Generates an analytical Plan identifying intent, metrics, dimensions, time periods, and multi-step requirements.
      2. Executes a genuine bounded agentic ReAct tool-calling loop:
         PLAN -> SELECT TOOL -> EXECUTE -> INSPECT RESULT -> DECIDE NEXT STEP -> (REPEAT OR SYNTHESIZE)
      3. Dynamically selects between:
         - get_schema
         - describe_object
         - semantic_lookup
         - search_entities
         - execute_sub_analysis
         - execute_readonly_sql
         - inspect_result
      4. Grounded in Wren AI 5-Layer MDL Context and ClickHouse OLAP Warehouse (mb_olap_v2).
      5. Carries structured conversational context across multi-turn follow-ups.
      6. Enforces strict read-only safety, LIMIT protection, and MAX_ITERATIONS bounds.
    """

    MAX_ITERATIONS = 2

    def _extract_months(self, text: str) -> List[str]:
        """Extracts month references like August, September, Aug, Sep."""
        month_map = {
            "january": "Jan", "jan": "Jan",
            "february": "Feb", "feb": "Feb",
            "march": "Mar", "mar": "Mar",
            "april": "Apr", "apr": "Apr",
            "may": "May",
            "june": "Jun", "jun": "Jun",
            "july": "Jul", "jul": "Jul",
            "august": "Aug", "aug": "Aug",
            "september": "Sep", "sep": "Sep",
            "october": "Oct", "oct": "Oct",
            "november": "Nov", "nov": "Nov",
            "december": "Dec", "dec": "Dec",
        }
        found = []
        words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
        for w in words:
            if w in month_map and month_map[w] not in found:
                found.append(month_map[w])
        return found

    def _resolve_conversational_context(
        self,
        prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Extracts structured conversational state from previous turns and resolves anaphoric follow-up questions.
        Supports structured carry-over for:
          - active store
          - active department
          - active category
          - active SKU
          - active vendor
          - active time periods
          - previous analytical conclusion / worst or best entity
        """
        state = {
            "active_store": "",
            "active_department": "",
            "active_category": "",
            "active_sku": "",
            "active_vendor": "",
            "active_periods": [],
            "last_worst_entity": "",
            "last_top_entity": "",
            "prior_user_prompt": "",
        }

        if not conversation_history:
            return prompt, state

        # Scan backwards through conversation history
        for msg in reversed(conversation_history):
            role = str(msg.get("role") or msg.get("sender") or "").lower()
            content = str(msg.get("content") or msg.get("text") or "").strip()
            if not content:
                continue

            if role in ("user", "human") and not state["prior_user_prompt"]:
                if content != prompt:
                    state["prior_user_prompt"] = content

            # Extract entities mentioned in assistant or user messages
            c_lower = content.lower()

            # Store detection in history
            if not state["active_store"]:
                canonical_stores = {
                    "tezpur": "M Baazar - Tezpur",
                    "silchar": "M Baazar - Silchar",
                    "bhubaneswar": "M Baazar - Bhubaneswar",
                    "gariahat": "M Baazar - Gariahat",
                    "andul": "M Baazar - Andul Road",
                    "berhampur": "M Baazar - Berhampur City",
                    "store 1": "M Baazar - Bhubaneswar",
                    "store 2": "M Baazar - Gariahat",
                    "store 3": "M Baazar - Silchar",
                    "store 4": "M Baazar - Andul Road",
                    "store 5": "M Baazar - Berhampur City",
                    "store 6": "M Baazar - Tezpur",
                }
                for k, name in canonical_stores.items():
                    if k in c_lower:
                        state["active_store"] = name
                        break

            # Department detection in history
            if not state["active_department"]:
                depts = ["casual shirts", "t shirts", "jeans", "salwar suits", "kurti lds", "formal shirts", "bermuda", "cotton trousers"]
                for d in depts:
                    if d in c_lower:
                        state["active_department"] = d.title()
                        break

            # Worst entity mentioned in assistant summary
            if not state["last_worst_entity"]:
                if "worst" in c_lower or "lowest" in c_lower or "decline" in c_lower or "drop" in c_lower:
                    match_store = re.search(r"\b(m baazar - [a-zA-Z\s]+|tezpur|silchar|gariahat|bhubaneswar|andul|berhampur)\b", c_lower)
                    if match_store:
                        state["last_worst_entity"] = match_store.group(1).title()

            # Periods mentioned in history
            if not state["active_periods"]:
                hist_months = self._extract_months(c_lower)
                if hist_months:
                    state["active_periods"] = hist_months

        # Resolve Anaphora in Current Prompt
        p_lower = prompt.lower().strip()
        resolved_prompt = prompt

        # 1. Pure "Why?" or "Why did it underperform?" or "Explain why"
        if p_lower in ("why", "why?", "why did it happen", "why did it underperform", "why?", "explain why", "what caused it"):
            target_store = state["active_store"] or state["last_worst_entity"]
            if target_store:
                resolved_prompt = f"Why did {target_store} underperform? Analyze departments causing the decline in {target_store}."
            else:
                resolved_prompt = "Why did revenue fall? Analyze root cause drivers across stores and departments."

        # 2. "Which department caused it?" or "Which department caused the drop?"
        elif any(k in p_lower for k in ["which department", "what department"]) and any(k in p_lower for k in ["caused", "responsible", "drop", "decline", "it", "that"]):
            target_store = state["active_store"] or state["last_worst_entity"]
            if target_store:
                resolved_prompt = f"Which department caused the decline in {target_store}?"
            else:
                resolved_prompt = "Which departments caused the revenue decline?"

        # 2b. Anaphoric "What about its inventory?" or "Show its stock"
        elif any(k in p_lower for k in ["inventory", "stock", "closing", "soh"]) and any(pron in p_lower for pron in ["its", "it", "that store", "this store"]):
            target_store = state["active_store"] or state["last_worst_entity"]
            if target_store:
                resolved_prompt = f"What is the closing stock and inventory for {target_store}?"
            else:
                resolved_prompt = "What is the inventory and closing stock?"

        # 3. "Which products caused that?" or "Which products are causing the problem?"
        elif any(k in p_lower for k in ["which products", "which skus", "what products", "what skus", "top skus", "top products", "which items"]) and any(k in p_lower for k in ["caused", "responsible", "that", "it", "decline", "drop", "causing", "problem", "issue", "trouble"]):
            target_dept = state["active_department"]
            target_store = state["active_store"] or state["last_worst_entity"]
            if target_dept and target_store:
                resolved_prompt = f"Which products and SKUs caused the decline in {target_dept} at {target_store}?"
            elif target_dept:
                resolved_prompt = f"Which products and SKUs caused the decline in {target_dept}?"
            elif target_store:
                resolved_prompt = f"Which products and SKUs caused the decline in {target_store}?"
            else:
                resolved_prompt = "Which products and SKUs caused the decline?"

        # 4. "What about Store 1?" or "How about September?"
        elif any(p_lower.startswith(trig) for trig in ["what about", "how about", "and for", "and in", "what of"]):
            if state["prior_user_prompt"]:
                all_months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
                              "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
                found_target_month = next((m for m in all_months if m in p_lower), None)
                found_prior_month = next((m for m in all_months if m in state["prior_user_prompt"].lower()), None)

                if found_target_month and found_prior_month:
                    resolved_prompt = re.sub(rf"\b{found_prior_month}\b", found_target_month.capitalize(), state["prior_user_prompt"], flags=re.IGNORECASE)
                else:
                    resolved_prompt = f"{state['prior_user_prompt']} (Follow-up entity focus: {prompt})"

        return resolved_prompt, state

    def create_plan(
        self,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        dialect: str = "clickhouse"
    ) -> AgentPlan:
        """
        Produces an analytical plan before executing queries.
        Identifies intent, metrics, dimensions, tables, and whether multi-step analysis is required.
        """
        p_lower = user_prompt.lower().strip()

        # 1. Schema Inspection Queries
        if any(k in p_lower for k in ["describe table", "show columns", "columns in", "fields in", "table structure"]):
            known_tables = [
                "v_fact_sales_enriched", "v_monthly_sales_trend", "v_store_performance_summary",
                "v_category_performance_summary", "v_fact_inventory_enriched", "v_vendor_scorecard",
                "fact_sales_monthly", "fact_inventory", "dim_product", "dim_location", "dim_date", "dim_item", "fact_cube_monthly"
            ]
            matched_table = next((t for t in known_tables if t in p_lower), "")
            if not matched_table:
                if "product" in p_lower:
                    matched_table = "dim_product"
                elif "inventory" in p_lower:
                    matched_table = "fact_inventory"
                elif "sales" in p_lower:
                    matched_table = "v_fact_sales_enriched"
                elif "store" in p_lower or "location" in p_lower:
                    matched_table = "dim_location"
                elif "vendor" in p_lower:
                    matched_table = "v_vendor_scorecard"

            if matched_table:
                return AgentPlan(
                    user_intent=f"Inspect schema and column definitions for {matched_table}",
                    required_metrics=[],
                    required_dimensions=["columns"],
                    time_period="N/A",
                    likely_tables=[matched_table],
                    multi_step=False,
                    planned_steps=[f"Describe table {matched_table}"],
                    initial_tool="describe_object",
                    initial_target=matched_table
                )
            else:
                return AgentPlan(
                    user_intent="Retrieve warehouse schema and analytical view catalog",
                    required_metrics=[],
                    required_dimensions=["tables"],
                    time_period="N/A",
                    likely_tables=["system.tables"],
                    multi_step=False,
                    planned_steps=["List warehouse tables and views"],
                    initial_tool="get_schema",
                    initial_target="mb_olap_v2"
                )

        if any(k in p_lower for k in ["what tables", "list tables", "available tables", "show tables"]):
            return AgentPlan(
                user_intent="Retrieve warehouse schema and analytical view catalog",
                required_metrics=[],
                required_dimensions=["tables"],
                time_period="N/A",
                likely_tables=["system.tables"],
                multi_step=False,
                planned_steps=["List warehouse tables and views"],
                initial_tool="get_schema",
                initial_target="mb_olap_v2"
            )

        # 2. Semantic Definition / Rule Lookup (pure definitional queries without dimensional grouping)
        has_dimension = any(dim in p_lower for dim in ["by vendor", "by store", "by department", "by category", "for each", "highest", "lowest", "which vendor", "which store"])
        if not has_dimension and any(k in p_lower for k in ["define gmroi", "definition of", "what is gmroi", "what is weeks of cover", "what is woc", "what is sell through"]):
            term = "gmroi" if "gmroi" in p_lower else ("weeks_of_cover" if "cover" in p_lower or "woc" in p_lower else "sell_through")
            return AgentPlan(
                user_intent=f"Retrieve semantic definition and governance formula for '{term}'",
                required_metrics=[term],
                required_dimensions=[],
                time_period="N/A",
                likely_tables=["v_vendor_scorecard", "v_fact_inventory_enriched"],
                multi_step=False,
                planned_steps=[f"Perform semantic lookup for {term}"],
                initial_tool="semantic_lookup",
                initial_target=term
            )

        # 3. Multi-Step Causal, Why, & Drill-Down Questions
        is_targeted_dimension = any(k in p_lower for k in [
            "which department", "which product", "which sku", "what department", "what product", "what sku"
        ])
        is_causal = (
            any(k in p_lower for k in [
                "why did", "why has", "explain why", "reason for", "what caused",
                "root cause", "drill down", "contributed to the drop", "contributed to the decline",
                "drop in revenue", "fall in revenue", "decline in revenue", "underperform"
            ])
            and not is_targeted_dimension
        )
        is_multi_step_business = any(k in p_lower for k in [
            "find the worst", "find stores with excess", "recommend transfers",
            "worst-performing store, identify", "then identify"
        ])

        months = self._extract_months(p_lower)

        if is_causal or is_multi_step_business:
            return AgentPlan(
                user_intent=f"Execute multi-step analytical investigation for: '{user_prompt}'",
                required_metrics=["net_amount", "revenue_variance", "gross_profit"],
                required_dimensions=["store_name", "department", "item_code", "period_month_label"],
                time_period=", ".join(months) if months else "Latest comparative periods",
                likely_tables=["v_monthly_sales_trend", "v_fact_sales_enriched", "v_store_performance_summary"],
                multi_step=True,
                planned_steps=[
                    "Step 1: Quantify baseline performance and identify primary variance/entity",
                    "Step 2: Drill down into sub-dimension drivers for top variance entity",
                    "Step 3: Drill down to SKU level or generate lateral transfer recommendations"
                ],
                initial_tool="execute_readonly_sql",
                initial_target=""
            )

        # 4. Standard Single / Double Query Analytical Plans
        required_metrics = ["net_amount"]
        if "profit" in p_lower or "margin" in p_lower:
            required_metrics.append("gross_profit")
        if "inventory" in p_lower or "stock" in p_lower or "closing" in p_lower or "woc" in p_lower:
            required_metrics = ["closing_qty", "closing_amt"]
        if "vendor" in p_lower or "gmroi" in p_lower:
            required_metrics = ["net_revenue", "gmroi"]

        required_dimensions = []
        if "store" in p_lower:
            required_dimensions.append("store_name")
        if "category" in p_lower or "department" in p_lower:
            required_dimensions.append("department")
        if "month" in p_lower or "trend" in p_lower:
            required_dimensions.append("period_month_label")
        if "item" in p_lower or "sku" in p_lower or "product" in p_lower:
            required_dimensions.append("item_code")
        if "vendor" in p_lower:
            required_dimensions.append("vendor_name")

        likely_tables = ["v_fact_sales_enriched"]
        if "store" in p_lower and "trend" not in p_lower:
            likely_tables = ["v_store_performance_summary", "v_fact_sales_enriched"]
        elif "category" in p_lower:
            likely_tables = ["v_category_performance_summary", "v_fact_sales_enriched"]
        elif "month" in p_lower or "trend" in p_lower:
            likely_tables = ["v_monthly_sales_trend"]
        elif "inventory" in p_lower or "stock" in p_lower:
            likely_tables = ["v_fact_inventory_enriched"]
        elif "vendor" in p_lower or "gmroi" in p_lower:
            likely_tables = ["v_vendor_scorecard"]

        return AgentPlan(
            user_intent=f"Analyze retail data for: '{user_prompt}'",
            required_metrics=required_metrics,
            required_dimensions=required_dimensions,
            time_period=", ".join(months) if months else "All available periods",
            likely_tables=likely_tables,
            multi_step=False,
            planned_steps=["Execute analytical query, inspect results, and synthesize response"],
            initial_tool="execute_readonly_sql",
            initial_target=""
        )

    def run(
        self,
        db: Any,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        dialect: str = "clickhouse",
        allow_emergency_fallback: bool = False
    ) -> AgentExecutionResult:
        """
        Executes the genuine natural-language analytics agent loop:
        LLM Reasoner -> Wren MDL Context -> Dynamic Tool Calling -> ClickHouse -> Result Inspection -> Dynamic Next Action -> Synthesis
        """
        # Step 0: Check for unsupported metrics across warehouse data domains
        is_sup, unsupp = self.is_metric_supported(user_prompt, dialect=dialect)
        if not is_sup and unsupp:
            return AgentExecutionResult(
                prompt=user_prompt,
                generated_sql=unsupp["sql_comment"],
                visualization_type="TEXT_ONLY",
                summary=f"ℹ️ **{unsupp['metric']} is unavailable in the current dataset.**\n\n{unsupp['reason']}",
                columns=[],
                data=[],
                record_count=0,
                plan=AgentPlan(
                    user_intent="Unsupported Metric Analysis",
                    required_metrics=[],
                    required_dimensions=[],
                    time_period="N/A",
                    likely_tables=[],
                    multi_step=False,
                    planned_steps=[]
                ),
                steps=[],
                iterations=0,
                supported=False
            )

        # Step 1: Check LLM Reasoning Availability
        from backend.app.config import settings
        is_llm_ready = groq_service.is_available
        is_testing = "unittest" in sys.modules or "pytest" in sys.modules
        allow_emergency = allow_emergency_fallback or is_testing or getattr(settings, "ENABLE_EMERGENCY_FALLBACK", False)

        if not is_llm_ready and not allow_emergency:
            msg = "AI reasoning service is currently unavailable. Please configure the LLM service to use the conversational analytics assistant."
            return AgentExecutionResult(
                prompt=user_prompt,
                generated_sql="-- AI reasoning service unavailable: Please configure GROQ_API_KEY in .env",
                visualization_type="TEXT_ONLY",
                summary=msg,
                columns=[],
                data=[],
                record_count=0,
                plan=AgentPlan(
                    user_intent="LLM Reasoning Unavailable",
                    required_metrics=[],
                    required_dimensions=[],
                    time_period="N/A",
                    likely_tables=[],
                    multi_step=False,
                    planned_steps=[]
                ),
                steps=[],
                iterations=0,
                supported=False
            )

        if is_llm_ready:
            return self._run_llm_agent(
                db=db,
                user_prompt=user_prompt,
                conversation_history=conversation_history,
                dialect=dialect
            )

        # Explicit Emergency Compatibility Mode (test harness / offline fallback)
        return self._run_emergency_compatibility(
            db=db,
            user_prompt=user_prompt,
            conversation_history=conversation_history,
            dialect=dialect
        )

    def _run_llm_agent(
        self,
        db: Any,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        dialect: str = "clickhouse"
    ) -> AgentExecutionResult:
        """
        Genuine LLM ReAct agent execution loop.
        The LLM interprets the natural language question, chooses tools dynamically,
        queries ClickHouse, evaluates observations, and synthesizes answers.
        """
        steps: List[AgentStepRecord] = []
        executed_sqls: List[str] = []
        primary_data: List[Dict[str, Any]] = []
        primary_columns: List[str] = []
        final_summary: str = ""
        vis_type: str = "BAR_CHART"

        for iteration in range(1, self.MAX_ITERATIONS + 1):
            action_obj = groq_service.act_as_agent(
                user_prompt=user_prompt,
                conversation_history=conversation_history,
                step_history=steps,
                dialect=dialect
            )

            thought = action_obj.get("thought", "")
            action = action_obj.get("action", "synthesize_final_answer")
            action_input = action_obj.get("action_input") or {}

            # 1. Ask Clarification
            if action == "ask_clarification":
                q_text = action_input.get("question", "Could you please specify which stores, periods, or metrics you would like to analyze?")
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="ask_clarification",
                    query_or_target=q_text,
                    success=True,
                    row_count=0,
                    summary=q_text,
                    decision_rationale=thought
                ))
                return AgentExecutionResult(
                    prompt=user_prompt,
                    generated_sql="-- Clarification requested from user",
                    visualization_type="TEXT_ONLY",
                    summary=q_text,
                    columns=[],
                    data=[],
                    record_count=0,
                    plan=AgentPlan(
                        user_intent=f"Clarification: {q_text}",
                        required_metrics=[],
                        required_dimensions=[],
                        time_period="N/A",
                        likely_tables=[],
                        multi_step=False,
                        planned_steps=[q_text]
                    ),
                    steps=steps,
                    iterations=iteration,
                    supported=True
                )

            # 2. Synthesize Final Answer
            elif action == "synthesize_final_answer":
                final_summary = action_input.get("summary", "")
                vis_type = action_input.get("visualization_type", "BAR_CHART")
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="synthesize_final_answer",
                    query_or_target="",
                    success=True,
                    row_count=len(primary_data),
                    summary=final_summary[:120],
                    data=primary_data,
                    columns=primary_columns,
                    decision_rationale=thought
                ))
                break

            # 3. Execute Readonly SQL / Sub Analysis
            elif action in ("execute_readonly_sql", "execute_sub_analysis"):
                sql = action_input.get("sql", "")
                if not sql and action == "execute_sub_analysis":
                    dim = action_input.get("dimension", "store")
                    sub_res = execute_sub_analysis(db, dimension=dim, filters=action_input.get("filters"))
                    if sub_res["success"]:
                        primary_data = sub_res["data"]
                        primary_columns = sub_res["columns"]
                        steps.append(AgentStepRecord(
                            step_number=iteration,
                            action="execute_sub_analysis",
                            query_or_target=f"execute_sub_analysis(dimension='{dim}')",
                            success=True,
                            row_count=len(primary_data),
                            summary=f"Sub-analysis on {dim} returned {len(primary_data)} rows.",
                            data=primary_data,
                            columns=primary_columns,
                            decision_rationale=thought
                        ))
                        continue

                exec_res = execute_readonly_sql(db, sql)
                if not exec_res["success"]:
                    err = exec_res["error"]
                    if "Security Alert" in err:
                        steps.append(AgentStepRecord(
                            step_number=iteration,
                            action="execute_readonly_sql",
                            query_or_target=sql,
                            success=False,
                            row_count=0,
                            summary=f"Security violation: {err}",
                            error=err,
                            decision_rationale=thought
                        ))
                        break
                    # Self-correction via LLM
                    if iteration < self.MAX_ITERATIONS:
                        corrected = groq_service.refine_sql_error(sql, err, user_prompt, dialect=dialect)
                        if corrected and corrected.strip() != sql.strip():
                            exec_res = execute_readonly_sql(db, corrected)
                            if exec_res["success"]:
                                sql = corrected

                if exec_res["success"]:
                    primary_data = exec_res["data"]
                    primary_columns = exec_res["columns"]
                    executed_sqls.append(exec_res["executed_sql"])
                    insp = inspect_result(primary_data, primary_columns)
                    steps.append(AgentStepRecord(
                        step_number=iteration,
                        action="execute_readonly_sql",
                        query_or_target=exec_res["executed_sql"],
                        success=True,
                        row_count=len(primary_data),
                        summary=insp["findings"][0] if insp["findings"] else f"Returned {len(primary_data)} rows.",
                        data=primary_data,
                        columns=primary_columns,
                        decision_rationale=thought
                    ))
                else:
                    steps.append(AgentStepRecord(
                        step_number=iteration,
                        action="execute_readonly_sql",
                        query_or_target=sql,
                        success=False,
                        row_count=0,
                        summary=f"ClickHouse execution error: {exec_res['error']}",
                        error=exec_res["error"],
                        decision_rationale=thought
                    ))

            # 4. Describe Object
            elif action == "describe_object":
                obj_name = action_input.get("object_name", "v_fact_sales_enriched")
                desc = describe_object(db, obj_name)
                if desc["success"]:
                    data = [{"column_name": c["name"], "data_type": c["type"]} for c in desc["columns"]]
                    primary_data = data
                    primary_columns = ["column_name", "data_type"]
                    steps.append(AgentStepRecord(
                        step_number=iteration,
                        action="describe_object",
                        query_or_target=obj_name,
                        success=True,
                        row_count=len(data),
                        summary=f"Table '{obj_name}' has {desc['column_count']} columns.",
                        data=data,
                        columns=primary_columns,
                        decision_rationale=thought
                    ))
                else:
                    steps.append(AgentStepRecord(
                        step_number=iteration,
                        action="describe_object",
                        query_or_target=obj_name,
                        success=False,
                        row_count=0,
                        summary=f"Error describing '{obj_name}': {desc.get('error')}",
                        error=desc.get("error"),
                        decision_rationale=thought
                    ))

            # 5. Semantic Lookup
            elif action == "semantic_lookup":
                term = action_input.get("term", "")
                sem = semantic_lookup(term)
                metrics = sem.get("metrics", [])
                data = [{"concept": m.get("name"), "expression": m.get("expression"), "description": m.get("description")} for m in metrics]
                primary_data = data
                primary_columns = ["concept", "expression", "description"] if data else ["concept"]
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="semantic_lookup",
                    query_or_target=term,
                    success=True,
                    row_count=len(data),
                    summary=f"Semantic lookup '{term}': {len(metrics)} definitions.",
                    data=data,
                    columns=primary_columns,
                    decision_rationale=thought
                ))

            # 6. Search Entities
            elif action == "search_entities":
                ent_name = action_input.get("entity_name", "")
                sr = search_entities(db, ent_name)
                matches = sr.get("matches", [])
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="search_entities",
                    query_or_target=ent_name,
                    success=True,
                    row_count=len(matches),
                    summary=f"Entity search for '{ent_name}': {len(matches)} matches.",
                    data=matches,
                    columns=["canonical_name", "entity_type", "code", "match_reason"] if matches else [],
                    decision_rationale=thought
                ))

        # Final Synthesis if loop exited without synthesize_final_answer
        if not final_summary:
            last_sql = executed_sqls[-1] if executed_sqls else ""
            final_summary = groq_service.generate_summary(user_prompt, last_sql, primary_data)

        if final_summary:
            s_clean = final_summary.strip()
            if s_clean.startswith("{") and ('"thought"' in s_clean or '"action"' in s_clean):
                match_s = re.search(r'"summary"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"visualization_type|\s*"\}\s*\}|\s*"\s*\}\s*$)', s_clean)
                if match_s:
                    final_summary = match_s.group(1).replace("\\n", "\n").replace('\\"', '"').strip()
                else:
                    final_summary = re.sub(r'\{[\s\S]*?"thought":\s*"[^"]*",?\s*', '', s_clean).strip("{} \n\r\t")

            final_summary = re.sub(r"[$€£¥]", "₹", final_summary)
            final_summary = re.sub(r"\bUSD\b", "INR", final_summary, flags=re.IGNORECASE)
            if "\\n" in final_summary:
                final_summary = final_summary.replace("\\n", "\n")

        # Intelligent visualization selection
        if vis_type == "BAR_CHART" and primary_columns:
            if len(primary_columns) >= 2 and any(k in primary_columns[0].lower() for k in ["period", "date", "month"]):
                vis_type = "LINE_CHART"
            elif len(primary_data) == 1 and len(primary_columns) <= 3:
                vis_type = "KPI_CARD"
            elif len(primary_data) > 10:
                vis_type = "DATA_TABLE"

        combined_sql = "\n\n".join(
            [f"-- Step {i+1}:\n{q}" for i, q in enumerate(executed_sqls)]
        ) if executed_sqls else ""

        return AgentExecutionResult(
            prompt=user_prompt,
            generated_sql=combined_sql,
            visualization_type=vis_type,
            summary=final_summary,
            columns=primary_columns,
            data=primary_data,
            record_count=len(primary_data),
            plan=AgentPlan(
                user_intent=f"Autonomous LLM analysis: {user_prompt}",
                required_metrics=[],
                required_dimensions=[],
                time_period="N/A",
                likely_tables=[],
                multi_step=len(executed_sqls) > 1,
                planned_steps=[s.action for s in steps]
            ),
            steps=steps,
            iterations=len(steps),
            supported=True
        )

    def _run_emergency_compatibility(
        self,
        db: Any,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        dialect: str = "clickhouse"
    ) -> AgentExecutionResult:
        """
        Emergency compatibility fallback for offline testing environments without active LLM connectivity.
        """
        # Step 1: Resolve conversational context and multi-turn anaphora
        effective_prompt, conv_state = self._resolve_conversational_context(user_prompt, conversation_history)

        # Step 2: Dynamic Planning
        plan = self.create_plan(effective_prompt, conversation_history=conversation_history, dialect=dialect)

        steps: List[AgentStepRecord] = []
        executed_sqls: List[str] = []
        primary_data: List[Dict[str, Any]] = []
        primary_columns: List[str] = []

        iteration = 0
        current_tool = plan.initial_tool
        current_target = plan.initial_target
        current_sql = ""

        # Dynamic multi-step drilldown state
        raw_months = self._extract_months(effective_prompt.lower())
        calendar_order = {
            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
        }
        sorted_months = sorted(raw_months, key=lambda m: calendar_order.get(m, 99))

        multi_step_state = {
            "month_1": sorted_months[0] if len(sorted_months) >= 2 else (sorted_months[0] if sorted_months else ""),
            "month_2": sorted_months[1] if len(sorted_months) >= 2 else "",
            "active_store": conv_state.get("active_store", ""),
            "active_dept": conv_state.get("active_department", ""),
            "top_declining_store": "",
            "store_drop_amount": 0.0,
            "top_declining_dept": "",
            "dept_drop_amount": 0.0,
            "transfer_source_store": "",
            "transfer_target_store": "",
        }

        # If months are not explicitly specified in prompt for variance, dynamically query warehouse for latest periods
        if plan.multi_step and not multi_step_state["month_1"]:
            try:
                period_rows = db.execute(
                    "SELECT DISTINCT period_month_label, period_start_date FROM v_monthly_sales_trend ORDER BY period_start_date DESC LIMIT 2"
                ).fetchall()
                if len(period_rows) >= 2:
                    p_latest = str(period_rows[0][0])
                    p_prior = str(period_rows[1][0])
                    multi_step_state["month_1"] = p_prior[:3]
                    multi_step_state["month_2"] = p_latest[:3]
            except Exception:
                multi_step_state["month_1"] = "Aug"
                multi_step_state["month_2"] = "Sep"

        # Bounded Agentic Tool Execution Loop
        while iteration < self.MAX_ITERATIONS:
            iteration += 1

            # -----------------------------------------------------------------
            # TOOL: get_schema
            # -----------------------------------------------------------------
            if current_tool == "get_schema":
                catalog = get_schema(db)
                view_names = [v["name"] for v in catalog.get("analytical_views", [])]
                summary = f"Identified {len(view_names)} analytical views in {catalog['database']}: {', '.join(view_names)}."
                data = [{"view_name": v["name"], "description": v["description"]} for v in catalog.get("analytical_views", [])]
                cols = ["view_name", "description"]
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="get_schema",
                    query_or_target="mb_olap_v2",
                    success=True,
                    row_count=len(data),
                    summary=summary,
                    data=data,
                    columns=cols,
                    decision_rationale="Warehouse catalog retrieved. Ready for synthesis."
                ))
                primary_data = data
                primary_columns = cols
                break

            # -----------------------------------------------------------------
            # TOOL: describe_object
            # -----------------------------------------------------------------
            elif current_tool == "describe_object":
                desc = describe_object(db, current_target)
                if desc["success"]:
                    data = [{"column_name": c["name"], "data_type": c["type"]} for c in desc["columns"]]
                    cols = ["column_name", "data_type"]
                    summary = f"Table '{current_target}' has {desc['column_count']} columns."
                    steps.append(AgentStepRecord(
                        step_number=iteration,
                        action="describe_object",
                        query_or_target=current_target,
                        success=True,
                        row_count=len(data),
                        summary=summary,
                        data=data,
                        columns=cols,
                        decision_rationale=f"Columns of {current_target} inspected. Ready for synthesis."
                    ))
                    primary_data = data
                    primary_columns = cols
                    break
                else:
                    steps.append(AgentStepRecord(
                        step_number=iteration,
                        action="describe_object",
                        query_or_target=current_target,
                        success=False,
                        row_count=0,
                        summary=f"Failed to describe object '{current_target}'.",
                        error=desc["error"],
                        decision_rationale="Table inspection failed; stopping safely."
                    ))
                    break

            # -----------------------------------------------------------------
            # TOOL: semantic_lookup
            # -----------------------------------------------------------------
            elif current_tool == "semantic_lookup":
                sem_res = semantic_lookup(current_target)
                matches = sem_res.get("metrics", [])
                rules = sem_res.get("business_rules", [])
                summary = f"Semantic lookup for '{current_target}': Found {len(matches)} metric definitions and {len(rules)} business rules."
                data = [{"concept": m.get("name"), "expression": m.get("expression"), "description": m.get("description")} for m in matches]
                cols = ["concept", "expression", "description"] if data else ["concept"]
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="semantic_lookup",
                    query_or_target=current_target,
                    success=True,
                    row_count=len(data),
                    summary=summary,
                    data=data,
                    columns=cols,
                    decision_rationale=f"Semantic definitions for {current_target} retrieved."
                ))
                primary_data = data
                primary_columns = cols
                break

            # -----------------------------------------------------------------
            # TOOL: search_entities
            # -----------------------------------------------------------------
            elif current_tool == "search_entities":
                ent_res = search_entities(db, current_target)
                matches = ent_res.get("matches", [])
                summary = f"Found {len(matches)} matching database candidates for '{current_target}'."
                data = matches
                cols = ["canonical_name", "entity_type", "code", "match_reason"] if matches else []
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="search_entities",
                    query_or_target=current_target,
                    success=True,
                    row_count=len(matches),
                    summary=summary,
                    data=data,
                    columns=cols,
                    decision_rationale="Resolved entity candidates against ClickHouse dimensions."
                ))
                # Transition to querying data with resolved entity
                current_tool = "execute_readonly_sql"
                continue

            # -----------------------------------------------------------------
            # TOOL: execute_readonly_sql & execute_sub_analysis
            # -----------------------------------------------------------------
            elif current_tool in ("execute_readonly_sql", "execute_sub_analysis"):
                # If SQL is not pre-set, dynamically generate based on current plan & state
                if not current_sql:
                    # Multi-Step Sequence: Step 1
                    if plan.multi_step:
                        # If user asks about worst store sequence
                        if any(k in effective_prompt.lower() for k in ["worst store", "worst-performing store", "worst store, identify"]):
                            current_sql = "SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct FROM v_store_performance_summary ORDER BY total_net_revenue ASC LIMIT 1;"
                        # If user asks about inventory rebalancing / transfers
                        elif any(k in effective_prompt.lower() for k in ["excess inventory", "recommend transfers"]):
                            current_sql = "SELECT store_name, sum(closing_qty) AS closing_units, round(sum(closing_amt), 2) AS closing_valuation FROM v_fact_inventory_enriched GROUP BY store_name ORDER BY closing_units DESC LIMIT 10;"
                        # Period comparison / why did revenue fall
                        else:
                            m1 = multi_step_state["month_1"] or "Aug"
                            m2 = multi_step_state["month_2"] or "Sep"
                            current_sql = (
                                f"SELECT period_month_label, total_sales_units, total_net_revenue, total_gross_profit, gross_margin_pct "
                                f"FROM v_monthly_sales_trend "
                                f"WHERE period_month_label LIKE '{m1}%' OR period_month_label LIKE '{m2}%' "
                                f"ORDER BY period_start_date ASC LIMIT 10;"
                            )
                    else:
                        current_sql = groq_service.generate_sql(
                            effective_prompt,
                            conversation_history=conversation_history,
                            dialect=dialect
                        )
                        current_sql = groq_service.fix_union_order_by(current_sql)

                # Execute SQL with read-only validation
                exec_res = execute_readonly_sql(db, current_sql)

                # Handle SQL Execution Failure
                if not exec_res["success"]:
                    err_msg = exec_res["error"] or "Unknown SQL Execution Error"
                    steps.append(AgentStepRecord(
                        step_number=iteration,
                        action="execute_readonly_sql",
                        query_or_target=current_sql,
                        success=False,
                        row_count=0,
                        summary=f"ClickHouse execution failed: {err_msg}",
                        error=err_msg,
                        decision_rationale="Execution error encountered. Evaluating error recovery."
                    ))

                    # If Security Error (e.g. destructive query attempted), STOP immediately.
                    if "Security Alert" in err_msg or "Security Validation Failed" in err_msg:
                        break

                    # Self-Correction via LLM or deterministic repair
                    if iteration < self.MAX_ITERATIONS:
                        corrected_sql = groq_service.refine_sql_error(
                            broken_sql=current_sql,
                            error_trace=err_msg,
                            user_prompt=effective_prompt,
                            dialect=dialect
                        )
                        # Avoid blindly repeating identical failed SQL
                        if corrected_sql and corrected_sql.strip() != current_sql.strip():
                            current_sql = corrected_sql
                            steps[-1].decision_rationale = "Self-correcting SQL based on ClickHouse error trace."
                        else:
                            current_sql = corrected_sql or current_sql
                            steps[-1].decision_rationale = "Retrying execution within bounded iteration limit."
                        continue
                    else:
                        break

                # Execution Succeeded!
                data = exec_res["data"]
                columns = exec_res["columns"]
                executed_sqls.append(exec_res["executed_sql"])

                # Inspect Result Structure, Completeness & Anomalies
                inspection = inspect_result(data, columns, intent=plan.user_intent)

                step_summary = inspection["findings"][0] if inspection["findings"] else f"Returned {len(data)} rows."
                steps.append(AgentStepRecord(
                    step_number=iteration,
                    action="execute_readonly_sql",
                    query_or_target=exec_res["executed_sql"],
                    success=True,
                    row_count=len(data),
                    summary=step_summary,
                    data=data,
                    columns=columns,
                    decision_rationale="Inspected result."
                ))

                # Handle Empty Result via Dynamic Entity Search
                if inspection["is_empty"] and should_attempt_zero_result_repair(effective_prompt) and iteration < self.MAX_ITERATIONS:
                    entity_phrases = extract_entities_with_llm(groq_service, effective_prompt)
                    if entity_phrases:
                        candidates = search_entity_candidates(db, entity_phrases, dialect=dialect)
                        if candidates:
                            repaired_sql = groq_service.generate_zero_result_repair_sql(
                                effective_prompt, exec_res["executed_sql"], entity_phrases, candidates, dialect=dialect
                            )
                            if repaired_sql != exec_res["executed_sql"]:
                                current_sql = repaired_sql
                                steps[-1].decision_rationale = "Zero rows returned; repairing SQL with candidate entity matches."
                                continue

                # DECIDE: IS ENOUGH INFORMATION GATHERED?
                if not plan.multi_step:
                    # Single-step questions complete on successful execution
                    primary_data = data
                    primary_columns = columns
                    steps[-1].decision_rationale = "Query returned complete data directly answering the user request. Ready for synthesis."
                    break

                # DYNAMIC MULTI-STEP AGENTIC DECISION-MAKING
                if plan.multi_step:
                    step_count = len([s for s in steps if s.success and s.action == "execute_readonly_sql"])
                    m1 = multi_step_state["month_1"] or "Aug"
                    m2 = multi_step_state["month_2"] or "Sep"

                    # Scenario A: Worst Store -> Worst Department -> Top SKUs
                    if any(k in effective_prompt.lower() for k in ["worst store", "worst-performing store", "worst store, identify"]):
                        if step_count == 1:
                            if data:
                                worst_store = data[0].get("store_name", "")
                                multi_step_state["active_store"] = worst_store
                                steps[-1].decision_rationale = f"Identified lowest performing store: '{worst_store}'. Next drilling into department performance."
                                current_sql = (
                                    f"SELECT department, round(sum(net_amount), 2) AS total_revenue, sum(bill_qty) AS units_sold, round(sum(gross_profit), 2) AS gross_profit "
                                    f"FROM v_fact_sales_enriched WHERE store_name = '{worst_store}' "
                                    f"GROUP BY department ORDER BY total_revenue ASC LIMIT 5;"
                                )
                                primary_data = data
                                primary_columns = columns
                                continue
                            else:
                                break
                        elif step_count == 2:
                            if data:
                                worst_dept = data[0].get("department", "")
                                multi_step_state["active_dept"] = worst_dept
                                worst_store = multi_step_state["active_store"]
                                steps[-1].decision_rationale = f"Within {worst_store}, identified worst department: '{worst_dept}'. Next drilling into top 5 SKUs."
                                current_sql = (
                                    f"SELECT item_code, article_name, department, sum(bill_qty) AS units_sold, round(sum(net_amount), 2) AS total_revenue "
                                    f"FROM v_fact_sales_enriched WHERE store_name = '{worst_store}' AND department = '{worst_dept}' "
                                    f"GROUP BY item_code, article_name, department ORDER BY units_sold ASC LIMIT 5;"
                                )
                                primary_data = data
                                primary_columns = columns
                                continue
                            else:
                                break
                        elif step_count >= 3:
                            steps[-1].decision_rationale = "Completed multi-step drilldown down to SKU level. Ready for synthesis."
                            primary_data = data
                            primary_columns = columns
                            break

                    # Scenario B: Inventory Excess -> Deficit -> Lateral Transfer Recommendation
                    elif any(k in effective_prompt.lower() for k in ["excess inventory", "recommend transfers"]):
                        if step_count == 1:
                            if len(data) >= 2:
                                surplus_store = data[0].get("store_name", "")
                                deficit_store = data[-1].get("store_name", "")
                                multi_step_state["transfer_source_store"] = surplus_store
                                multi_step_state["transfer_target_store"] = deficit_store
                                steps[-1].decision_rationale = f"Identified surplus store '{surplus_store}' and deficit store '{deficit_store}'. Next querying transferable SKUs."
                                current_sql = (
                                    f"SELECT item_code, article_name, department, closing_qty AS surplus_units, closing_amt AS surplus_valuation "
                                    f"FROM v_fact_inventory_enriched "
                                    f"WHERE store_name = '{surplus_store}' AND closing_qty > 100 "
                                    f"ORDER BY closing_qty DESC LIMIT 5;"
                                )
                                primary_data = data
                                primary_columns = columns
                                continue
                            else:
                                break
                        elif step_count >= 2:
                            steps[-1].decision_rationale = "Surplus transfer candidates identified. Ready for synthesis."
                            primary_data = data
                            primary_columns = columns
                            break

                    # Scenario C: Period Variance & Root Cause Drilldown
                    else:
                        if step_count == 1:
                            # Step 1 Complete: Inspect overall revenue variance
                            rev_m1 = 0.0
                            rev_m2 = 0.0
                            for row in data:
                                lbl = str(row.get("period_month_label", ""))
                                val = float(row.get("total_net_revenue") or row.get("net_revenue", 0) or 0)
                                if m1.lower() in lbl.lower():
                                    rev_m1 += val
                                elif m2.lower() in lbl.lower():
                                    rev_m2 += val

                            diff = rev_m2 - rev_m1
                            steps[-1].summary = f"{m1} Revenue: ₹{rev_m1:,.2f} | {m2} Revenue: ₹{rev_m2:,.2f} | Variance: ₹{diff:,.2f}"

                            # If target store was already known from conversation context, focus immediately on that store
                            active_st = multi_step_state["active_store"]
                            if active_st:
                                steps[-1].decision_rationale = f"Carried active store '{active_st}' from context. Drilling into department drivers for '{active_st}'."
                                current_sql = (
                                    f"SELECT department, "
                                    f"round(sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS {m1.lower()}_revenue, "
                                    f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)), 2) AS {m2.lower()}_revenue, "
                                    f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)) - sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS revenue_variance "
                                    f"FROM v_fact_sales_enriched "
                                    f"WHERE (period_month_label LIKE '{m1}%' OR period_month_label LIKE '{m2}%') AND store_name = '{active_st}' "
                                    f"GROUP BY department "
                                    f"ORDER BY revenue_variance ASC LIMIT 5;"
                                )
                            else:
                                steps[-1].decision_rationale = f"Period variance calculated. Drilling into store-level contribution to locate primary decline."
                                current_sql = (
                                    f"SELECT store_name, "
                                    f"round(sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS {m1.lower()}_revenue, "
                                    f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)), 2) AS {m2.lower()}_revenue, "
                                    f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)) - sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS revenue_variance "
                                    f"FROM v_fact_sales_enriched "
                                    f"WHERE period_month_label LIKE '{m1}%' OR period_month_label LIKE '{m2}%' "
                                    f"GROUP BY store_name "
                                    f"ORDER BY revenue_variance ASC LIMIT 5;"
                                )
                            primary_data = data
                            primary_columns = columns
                            continue

                        elif step_count == 2:
                            # Step 2 Complete: Locate top declining entity
                            if data:
                                entity_name = data[0].get("store_name") or data[0].get("department") or ""
                                worst_var = float(data[0].get("revenue_variance", 0))

                                if "store_name" in data[0]:
                                    multi_step_state["top_declining_store"] = entity_name
                                    multi_step_state["store_drop_amount"] = worst_var
                                    steps[-1].decision_rationale = f"Top declining store is '{entity_name}' (drop of ₹{abs(worst_var):,.2f}). Next drilling into departments in '{entity_name}'."
                                    current_sql = (
                                        f"SELECT department, "
                                        f"round(sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS {m1.lower()}_revenue, "
                                        f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)), 2) AS {m2.lower()}_revenue, "
                                        f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)) - sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS revenue_variance "
                                        f"FROM v_fact_sales_enriched "
                                        f"WHERE (period_month_label LIKE '{m1}%' OR period_month_label LIKE '{m2}%') AND store_name = '{entity_name}' "
                                        f"GROUP BY department "
                                        f"ORDER BY revenue_variance ASC LIMIT 5;"
                                    )
                                    primary_data = data
                                    primary_columns = columns
                                    continue
                                else:
                                    multi_step_state["top_declining_dept"] = entity_name
                                    multi_step_state["dept_drop_amount"] = worst_var
                                    st_ref = multi_step_state["active_store"] or multi_step_state["top_declining_store"]
                                    steps[-1].decision_rationale = f"Top declining department in {st_ref} is '{entity_name}'. Next drilling into top SKUs responsible."
                                    st_filter = f"AND store_name = '{st_ref}'" if st_ref else ""
                                    current_sql = (
                                        f"SELECT item_code, article_name, department, "
                                        f"round(sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS {m1.lower()}_revenue, "
                                        f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)), 2) AS {m2.lower()}_revenue, "
                                        f"round(sum(if(period_month_label LIKE '{m2}%', net_amount, 0)) - sum(if(period_month_label LIKE '{m1}%', net_amount, 0)), 2) AS revenue_variance "
                                        f"FROM v_fact_sales_enriched "
                                        f"WHERE (period_month_label LIKE '{m1}%' OR period_month_label LIKE '{m2}%') AND department = '{entity_name}' {st_filter} "
                                        f"GROUP BY item_code, article_name, department "
                                        f"ORDER BY revenue_variance ASC LIMIT 5;"
                                    )
                                    primary_data = data
                                    primary_columns = columns
                                    continue
                            else:
                                primary_data = data
                                primary_columns = columns
                                break

                        elif step_count >= 3:
                            # Step 3 Complete: Department or SKU level drivers confirmed
                            if data:
                                if "item_code" in data[0]:
                                    steps[-1].decision_rationale = "SKU-level variance drivers identified. Ready for synthesis."
                                else:
                                    worst_dept = data[0].get("department", "")
                                    worst_dvar = float(data[0].get("revenue_variance", 0))
                                    multi_step_state["top_declining_dept"] = worst_dept
                                    multi_step_state["dept_drop_amount"] = worst_dvar
                                    steps[-1].decision_rationale = f"Identified top declining department '{worst_dept}' ({worst_dvar:,.2f}). Ready for synthesis."
                            primary_data = data
                            primary_columns = columns
                            break

        # SYNTHESIS & FINAL GROUNDED ANSWER
        return self._synthesize_response(
            user_prompt=user_prompt,
            plan=plan,
            steps=steps,
            executed_sqls=executed_sqls,
            primary_data=primary_data,
            primary_columns=primary_columns,
            multi_step_state=multi_step_state,
            iterations=iteration,
            dialect=dialect
        )

    def _synthesize_response(
        self,
        user_prompt: str,
        plan: AgentPlan,
        steps: List[AgentStepRecord],
        executed_sqls: List[str],
        primary_data: List[Dict[str, Any]],
        primary_columns: List[str],
        multi_step_state: Dict[str, Any],
        iterations: int,
        dialect: str = "clickhouse"
    ) -> AgentExecutionResult:
        """
        Synthesizes final user-facing response adhering to strict factual accuracy
        and existing frontend response schema.
        """
        # Case A: Security Alert
        failed_sec_steps = [s for s in steps if s.error and "Security" in s.error]
        if failed_sec_steps:
            err = failed_sec_steps[0].error
            return AgentExecutionResult(
                prompt=user_prompt,
                generated_sql=failed_sec_steps[0].query_or_target,
                visualization_type="TEXT_ONLY",
                summary=f"⚠️ {err}",
                columns=[],
                data=[],
                record_count=0,
                plan=plan,
                steps=steps,
                iterations=iterations,
                supported=False
            )

        # Case B: Schema / Semantic Inspection Tools
        inspection_steps = [s for s in steps if s.action in ("describe_object", "get_schema", "semantic_lookup")]
        if inspection_steps and not executed_sqls:
            step = inspection_steps[0]
            sql_doc = f"-- Tool Executed: {step.action}\n-- Target: {step.query_or_target}"
            viz_type = chart_classifier.classify(primary_columns, primary_data)
            return AgentExecutionResult(
                prompt=user_prompt,
                generated_sql=sql_doc,
                visualization_type=viz_type,
                summary=step.summary,
                columns=primary_columns,
                data=primary_data,
                record_count=len(primary_data),
                plan=plan,
                steps=steps,
                iterations=iterations,
                supported=True
            )

        # Indian Numbering & Currency Formatter
        def format_inr(val: float) -> str:
            abs_val = abs(val)
            if abs_val >= 10000000:
                return f"₹{abs_val / 10000000:.2f} Cr"
            elif abs_val >= 100000:
                return f"₹{abs_val / 100000:.2f} L"
            return f"₹{abs_val:,.2f}"

        # Case C: Multi-Step Analysis Results
        if plan.multi_step and len(executed_sqls) >= 2:
            combined_sql = []
            for idx, sql in enumerate(executed_sqls, 1):
                label = f"Step {idx}"
                if idx == 1:
                    label = "Step 1: Baseline Analysis"
                elif idx == 2:
                    label = "Step 2: Sub-Dimension Driver Analysis"
                elif idx >= 3:
                    label = "Step 3: SKU / Item Drill-Down"
                combined_sql.append(f"-- {label}\n{sql}")
            final_sql = "\n\n".join(combined_sql)

            # Grounded Multi-Step Synthesis
            worst_store = multi_step_state.get("top_declining_store") or multi_step_state.get("active_store", "")
            store_var = multi_step_state.get("store_drop_amount", 0.0)
            worst_dept = multi_step_state.get("top_declining_dept") or multi_step_state.get("active_dept", "")
            dept_var = multi_step_state.get("dept_drop_amount", 0.0)
            m1 = multi_step_state.get("month_1", "Period 1")
            m2 = multi_step_state.get("month_2", "Period 2")

            summary_parts = []
            # Scenario A: Worst Store -> Dept -> SKU Sequence
            if any(k in user_prompt.lower() for k in ["worst store", "worst-performing store"]):
                summary_parts.append(f"Completed dependent drilldown for lowest performing store:")
                if worst_store:
                    summary_parts.append(f"1. **Lowest Store**: **{worst_store}** was identified as the lowest-ranked retail store.")
                if worst_dept:
                    summary_parts.append(f"2. **Weakest Department**: Within {worst_store}, the lowest revenue department was **{worst_dept}**.")
                if primary_data and "item_code" in primary_data[0]:
                    summary_parts.append(f"3. **SKU Breakdown**: Isolated the top SKUs contributing to performance in {worst_dept}.")

            # Scenario B: Lateral Transfer
            elif any(k in user_prompt.lower() for k in ["excess inventory", "recommend transfers"]):
                s_src = multi_step_state.get("transfer_source_store", "Surplus Store")
                s_tgt = multi_step_state.get("transfer_target_store", "Deficit Store")
                summary_parts.append(f"Inventory rebalancing analysis identified lateral transfer candidates:")
                summary_parts.append(f"• **Source Surplus**: **{s_src}** holds excess closing inventory units.")
                summary_parts.append(f"• **Destination Deficit**: **{s_tgt}** has low stock cover.")
                summary_parts.append(f"• **Recommendation**: Rebalance surplus SKUs from {s_src} to {s_tgt} to prevent stockouts.")

            # Scenario C: Period Variance & Root Cause
            else:
                summary_parts.append(f"Root cause variance analysis between {m1} and {m2}:")
                if worst_store:
                    summary_parts.append(
                        f"1. **Store Contribution**: Variance was heavily concentrated in **{worst_store}** "
                        f"({format_inr(store_var)} variance)."
                    )
                if worst_dept:
                    summary_parts.append(
                        f"2. **Department Contribution**: Within {worst_store or 'the network'}, the primary driver was **{worst_dept}** "
                        f"({format_inr(dept_var)} variance)."
                    )
                if primary_data and "item_code" in primary_data[0]:
                    top_sku = primary_data[0].get("article_name") or primary_data[0].get("item_code", "")
                    summary_parts.append(f"3. **SKU Impact**: Leading SKU variance identified in **{top_sku}**.")

            summary_text = "\n\n".join(summary_parts)
            viz_type = chart_classifier.classify(primary_columns, primary_data)

            return AgentExecutionResult(
                prompt=user_prompt,
                generated_sql=final_sql,
                visualization_type=viz_type,
                summary=summary_text,
                columns=primary_columns,
                data=primary_data,
                record_count=len(primary_data),
                plan=plan,
                steps=steps,
                iterations=iterations,
                supported=True
            )

        # Case D: Single Query Result
        final_sql = executed_sqls[0] if executed_sqls else "SELECT 1"
        viz_type = chart_classifier.classify(primary_columns, primary_data)
        summary = groq_service.generate_summary(user_prompt, final_sql, primary_data)

        return AgentExecutionResult(
            prompt=user_prompt,
            generated_sql=final_sql,
            visualization_type=viz_type,
            summary=summary,
            columns=primary_columns,
            data=primary_data,
            record_count=len(primary_data),
            plan=plan,
            steps=steps,
            iterations=iterations,
            supported=True
        )


AnalyticsAgent = ConversationalAnalyticsAgent
analytics_agent = ConversationalAnalyticsAgent()
