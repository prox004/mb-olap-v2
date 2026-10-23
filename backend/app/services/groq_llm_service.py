import os
import re
import json
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from groq import Groq
from backend.app.services.wren_context_engine import wren_engine

# Load .env file from project root or backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

PRIORITIZED_MODELS = [
    os.getenv("GROQ_PRIMARY_MODEL", ""),
    os.getenv("GROQ_MODEL", ""),
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]
# Filter out empty strings
CANDIDATE_MODELS = [m for m in PRIORITIZED_MODELS if m]


class GroqLLMService:
    """
    Groq API LLM Service supporting resilient multi-model failover and strict
    grounded prompt engineering to prevent hallucinations and vague responses.
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self._active_model = CANDIDATE_MODELS[0] if CANDIDATE_MODELS else "llama-3.3-70b-versatile"

    @property
    def is_available(self) -> bool:
        """Checks if Groq API is actively configured and reachable."""
        if not self.api_key:
            self.api_key = os.getenv("GROQ_API_KEY", "")
            if self.api_key and not self.client:
                try:
                    self.client = Groq(api_key=self.api_key)
                except Exception:
                    self.client = None
        return bool(self.api_key and self.client)

    @property
    def primary_model(self) -> str:
        return self._active_model

    @primary_model.setter
    def primary_model(self, model: str) -> None:
        self._active_model = model

    @property
    def fallback_model(self) -> str:
        return self._active_model

    @fallback_model.setter
    def fallback_model(self, model: str) -> None:
        self._active_model = model

    def _create_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 1024,
    ) -> Optional[str]:
        """
        Executes a Groq chat completion with automatic model failover across candidate models.
        """
        if not self.client:
            return None

        # Build list of models starting with the current active model
        models_to_try = [self._active_model] + [m for m in CANDIDATE_MODELS if m != self._active_model]

        last_error = None
        for model in models_to_try:
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                self._active_model = model
                content = response.choices[0].message.content
                return content or ""
            except Exception as e:
                last_error = e
                print(f"[GROQ_LLM] Model '{model}' failed: {e}. Trying fallback model...")
                continue

        print(f"[GROQ_LLM] All Groq candidate models failed. Last error: {last_error}")
        return None

    def extract_sql_from_response(self, text: str) -> str:
        """
        Extracts SQL code block from LLM output markdown.
        """
        if not text:
            return ""
        match = re.search(r"```sql\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()

        # Fallback if markdown tags omitted
        clean_text = text.strip()
        if clean_text.upper().startswith("SELECT"):
            return clean_text

        # Strip any leading generic markdown block
        match_generic = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
        if match_generic:
            return match_generic.group(1).strip()

        return clean_text

    def _parse_json_action(self, raw_text: str) -> Dict[str, Any]:
        """
        Extracts and parses JSON action {thought, action, action_input} from LLM response.
        Handles markdown blocks, raw json, unescaped control characters, or trailing prose safely.
        """
        if not raw_text:
            return {
                "thought": "No response received from LLM",
                "action": "synthesize_final_answer",
                "action_input": {"summary": "Unable to complete reasoning.", "visualization_type": "TEXT_ONLY"}
            }

        # Try markdown code block first
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL | re.IGNORECASE)
        candidate = match.group(1).strip() if match else ""

        # If not in markdown block, search for outermost { ... }
        if not candidate:
            match_brace = re.search(r"(\{.*\})", raw_text, re.DOTALL)
            if match_brace:
                candidate = match_brace.group(1).strip()

        if candidate:
            for strict_mode in (False, True):
                try:
                    data = json.loads(candidate, strict=strict_mode)
                    if isinstance(data, dict) and "action" in data:
                        return data
                except Exception:
                    pass

        # Regex fallback for synthesize_final_answer when JSON has unescaped markdown/quotes
        if "synthesize_final_answer" in raw_text:
            summary_match = re.search(
                r'"summary"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"visualization_type|\s*"\}\s*\}|\s*"\s*\}\s*$)',
                raw_text
            )
            if summary_match:
                extracted = summary_match.group(1)
                extracted = extracted.replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"')
                vis_match = re.search(r'"visualization_type"\s*:\s*"([^"]+)"', raw_text)
                vis_type = vis_match.group(1) if vis_match else "DATA_TABLE"
                return {
                    "thought": "Direct synthesis response",
                    "action": "synthesize_final_answer",
                    "action_input": {"summary": extracted.strip(), "visualization_type": vis_type}
                }

        # If parsing failed, inspect for SQL in raw text
        if "SELECT" in raw_text.upper():
            sql = self.extract_sql_from_response(raw_text)
            return {
                "thought": "LLM formulated ClickHouse SQL query",
                "action": "execute_readonly_sql",
                "action_input": {"sql": sql}
            }

        # Clean up any residual raw JSON if it leaked into raw_text
        clean_summary = raw_text.strip()
        if clean_summary.startswith("{") and ('"thought"' in clean_summary or '"action"' in clean_summary):
            summary_match = re.search(r'"summary"\s*:\s*"([\s\S]*?)"', clean_summary)
            if summary_match:
                clean_summary = summary_match.group(1).replace("\\n", "\n").replace('\\"', '"')
            else:
                clean_summary = re.sub(r'\{[\s\S]*?"thought":\s*"[^"]*",?\s*', '', clean_summary)
                clean_summary = clean_summary.strip("{} \n\r\t")

        return {
            "thought": "Direct synthesis response",
            "action": "synthesize_final_answer",
            "action_input": {"summary": clean_summary, "visualization_type": "TEXT_ONLY"}
        }

    def act_as_agent(
        self,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        step_history: Optional[List[Any]] = None,
        dialect: str = "clickhouse"
    ) -> Dict[str, Any]:
        """
        Autonomous ReAct Agent step powered by LLM reasoning.
        Inspects the business question, multi-turn history, and past analytical observations,
        then dynamically chooses the next tool to execute.
        """
        if not self.client:
            return {
                "thought": "LLM service unavailable",
                "action": "synthesize_final_answer",
                "action_input": {
                    "summary": "AI reasoning service is currently unavailable. Please configure the LLM service to use the conversational analytics assistant.",
                    "visualization_type": "TEXT_ONLY"
                }
            }

        system_context = wren_engine.build_system_prompt_context(user_prompt, dialect=dialect)

        system_msg = (
            "You are the ClickHouse Enterprise Retail Analytics Agent, an autonomous AI analyst directly integrated with "
            "the ClickHouse analytical warehouse (mb_olap_v2) for M Baazar retail.\n\n"
            "TARGET DATABASE: mb_olap_v2\n\n"
            "AVAILABLE WAREHOUSE SCHEMA & GOVERNED METRICS (ClickHouse Semantic Layer):\n"
            f"{system_context}\n\n"
            "PRIMARY ANALYTICAL VIEWS:\n"
            "- v_fact_sales_enriched: Detailed transaction sales (store_name, state, division, section, department, item_code, article_name, bill_qty, net_amount, gross_profit, period_month_label).\n"
            "- v_monthly_sales_trend: Monthly chain-wide trends (period_month_label, period_start_date, total_sales_units, total_net_revenue, total_gross_profit, gross_margin_pct).\n"
            "- v_store_performance_summary: Aggregated store rankings (store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct).\n"
            "- v_category_performance_summary: Division & department totals (division, department, total_sales_units, total_net_revenue, gross_margin_pct).\n"
            "- v_fact_inventory_enriched: Stock snapshots (store_name, division, department, item_code, article_name, closing_qty, closing_amt, final_sale_qty; Weeks of Cover = round(sum(closing_qty) / nullif(sum(final_sale_qty), 0) * 4.33, 2)).\n"
            "- v_vendor_scorecard: Vendor efficiency & scorecard (vendor_name, total_skus_supplied, sales_units, net_revenue, gross_profit, current_stock_value, sell_through_pct, margin_pct, return_rate_pct, vendor_score; GMROI = round(sum(gross_profit) / nullif(sum(current_stock_value), 0), 2)).\n\n"
            "AVAILABLE TOOLS:\n"
            "1. execute_readonly_sql\n"
            "   Input: {\"sql\": \"SELECT ...\"}\n"
            "   Executes a valid ClickHouse SELECT query. Must be strictly read-only.\n"
            "2. describe_object\n"
            "   Input: {\"object_name\": \"<table_or_view_name>\"}\n"
            "   Inspects column names and types for a table/view.\n"
            "3. semantic_lookup\n"
            "   Input: {\"term\": \"<metric_or_concept>\"}\n"
            "   Retrieves governed business formulas (e.g. GMROI, Weeks of Cover, Sell-Through).\n"
            "4. search_entities\n"
            "   Input: {\"entity_name\": \"<name>\"}\n"
            "   Resolves ambiguous store names, departments, SKUs, or vendors against ClickHouse dimensions.\n"
            "5. ask_clarification\n"
            "   Input: {\"question\": \"<clarifying question>\"}\n"
            "   Use ONLY if the user question is fundamentally ambiguous or underspecified (e.g., 'Compare performance' without specifying what to compare).\n"
            "6. synthesize_final_answer\n"
            "   Input: {\"summary\": \"<executive grounded summary>\", \"visualization_type\": \"<BAR_CHART|LINE_CHART|PIE_CHART|KPI_CARD|DATA_TABLE|TEXT_ONLY>\"}\n"
            "   Use when you have collected enough evidence to answer the question.\n\n"
            "DECISION PROTOCOL (MAXIMUM SPEED & DIRECTNESS):\n"
            "- Step 1: Immediately formulate the primary ClickHouse SQL query needed to answer the question or generate the report.\n"
            "- Step 2: Once the query observation is returned, IMMEDIATELY call synthesize_final_answer with the executive summary and data visualization.\n"
            "- Do NOT run intermediate or redundant exploratory queries. Complete analysis in 2 steps maximum.\n"
            "- In synthesize_final_answer, write the 'summary' with proper JSON string escaping (use \\n for line breaks, never raw unescaped newlines).\n"
            "- CLIENT COMMUNICATION GUIDELINE: The client is a retail business manager and non-technical person. Speak in clear, polite, and practical retail terms (Sales, Profit, Margin, Stock, Best-Selling Items, Stores, Revenue). NEVER use technical database or engineering terms like SQL, ClickHouse, database schemas, tables, views, query execution, or code blocks in the summary.\n"
            "- Always format your entire response as a valid JSON object:\n"
            "{\n"
            '  \"thought\": \"Internal reasoning about what information is needed and what to do next\",\n'
            '  \"action\": \"<tool_name>\",\n'
            '  \"action_input\": { <tool arguments> }\n'
            "}"
        )

        # Build conversation history context
        conv_lines = []
        if conversation_history:
            for turn in conversation_history[-6:]:
                r = str(turn.get("role") or turn.get("sender") or "user").capitalize()
                c = str(turn.get("content") or turn.get("text") or "").strip()
                if c:
                    conv_lines.append(f"{r}: {c}")

        # Build trajectory of actions and observations
        step_lines = []
        if step_history:
            for idx, s in enumerate(step_history, 1):
                step_lines.append(f"Step {idx}:")
                step_lines.append(f"  Action: {s.action}")
                step_lines.append(f"  Target/Query: {s.query_or_target}")
                if s.success:
                    obs_summary = s.summary or f"Returned {s.row_count} rows."
                    step_lines.append(f"  Observation ({s.row_count} rows): {obs_summary}")
                    if getattr(s, "data", None):
                        sample_str = json.dumps(s.data[:3], default=str)
                        step_lines.append(f"  Sample Data: {sample_str}")
                else:
                    step_lines.append(f"  Observation (ERROR): {s.error}")

        user_content = ""
        if conv_lines:
            user_content += "CONVERSATION HISTORY:\n" + "\n".join(conv_lines) + "\n\n"
        user_content += f"CURRENT USER QUESTION: \"{user_prompt}\"\n\n"
        if step_lines:
            user_content += "PAST ACTIONS AND OBSERVATIONS IN THIS ANALYSIS:\n" + "\n".join(step_lines) + "\n\n"
        user_content += "Decide your next Thought and Action. Return ONLY the JSON object."

        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_content}
        ]

        raw = self._create_completion(messages, temperature=0.0, max_tokens=1024)
        return self._parse_json_action(raw or "")

    def generate_sql(
        self,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        dialect: str = "clickhouse"
    ) -> str:
        """
        Translates a natural language user prompt into governed ClickHouse SQL for mb_olap_v2.
        Supports conversation_history for multi-turn contextual understanding.
        If Groq API is unavailable, falls back to robust semantic ClickHouse query synthesis.
        """
        p_lower = user_prompt.lower()

        # Offline / Deterministic Semantic SQL Synthesis
        if not self.client:
            canonical_stores = {
                "bhubaneswar": "M Baazar - Bhubaneswar",
                "bbsr": "M Baazar - Bhubaneswar",
                "gariahat": "M Baazar - Gariahat",
                "grhat": "M Baazar - Gariahat",
                "silchar": "M Baazar - Silchar",
                "slchr": "M Baazar - Silchar",
                "andul": "M Baazar - Andul Road",
                "berhampur": "M Baazar - Berhampur City",
                "tezpur": "M Baazar - Tezpur",
                "tzpur": "M Baazar - Tezpur",
                "store 1": "M Baazar - Bhubaneswar",
                "store 2": "M Baazar - Gariahat",
                "store 3": "M Baazar - Silchar",
                "store 4": "M Baazar - Andul Road",
                "store 5": "M Baazar - Berhampur City",
                "store 6": "M Baazar - Tezpur",
            }
            matched_store = None
            for key, name in canonical_stores.items():
                if key in p_lower:
                    matched_store = name
                    break

            # Known departments
            known_depts = ["t shirts", "casual shirts", "jeans", "salwar suits", "kurti lds", "formal shirts", "bermuda", "cotton trousers"]
            matched_dept = next((d.title() for d in known_depts if d in p_lower), None)

            # 1. Top Items / SKUs by sales units/volume
            if any(k in p_lower for k in ["item", "sku", "article"]) or (any(k in p_lower for k in ["product"]) and any(k in p_lower for k in ["top", "sold", "volume", "unit", "causing", "problem"])):
                limit = 10
                match_num = re.search(r"\btop\s+(\d+)\b", p_lower)
                if match_num:
                    limit = int(match_num.group(1))
                where_clauses = []
                if matched_store:
                    where_clauses.append(f"store_name = '{matched_store}'")
                if matched_dept:
                    where_clauses.append(f"department = '{matched_dept}'")
                where_clause = f"WHERE {' AND '.join(where_clauses)} " if where_clauses else ""
                order_dir = "ASC" if any(k in p_lower for k in ["worst", "lowest", "decline", "bottom", "drop", "problem", "caused"]) else "DESC"
                return (
                    f"SELECT item_code, article_name, department, sum(bill_qty) AS units_sold, round(sum(net_amount), 2) AS total_revenue "
                    f"FROM v_fact_sales_enriched "
                    f"{where_clause}"
                    f"GROUP BY item_code, article_name, department "
                    f"ORDER BY total_revenue {order_dir} LIMIT {limit};"
                )

            # 2. Inventory / Stock / SOH
            if any(k in p_lower for k in ["inventory", "stock", "closing", "soh", "cover", "woc"]):
                if matched_store:
                    return (
                        f"SELECT department, sum(closing_qty) AS closing_units, round(sum(closing_amt), 2) AS closing_valuation "
                        f"FROM v_fact_inventory_enriched "
                        f"WHERE store_name = '{matched_store}' "
                        f"GROUP BY department ORDER BY closing_valuation DESC LIMIT 10;"
                    )
                if "store" in p_lower:
                    sort_order = "ASC" if any(k in p_lower for k in ["low", "least", "bottom", "stockout"]) else "DESC"
                    return (
                        f"SELECT store_name, sum(closing_qty) AS closing_units, round(sum(closing_amt), 2) AS closing_valuation "
                        f"FROM v_fact_inventory_enriched "
                        f"GROUP BY store_name ORDER BY closing_units {sort_order} LIMIT 10;"
                    )
                return (
                    "SELECT department, sum(closing_qty) AS closing_units, round(sum(closing_amt), 2) AS closing_valuation "
                    "FROM v_fact_inventory_enriched "
                    "GROUP BY department ORDER BY closing_valuation DESC LIMIT 10;"
                )

            # 3. Vendor Analytics & GMROI
            if any(k in p_lower for k in ["vendor", "supplier", "gmroi"]):
                return (
                    "SELECT vendor_name, net_revenue, gross_profit, margin_pct, sell_through_pct, "
                    "round(gross_profit / nullIf(current_stock_value, 0), 2) AS gmroi "
                    "FROM v_vendor_scorecard "
                    "ORDER BY net_revenue DESC LIMIT 10;"
                )

            # 4. Monthly Trend or Trend Comparison
            if "trend" in p_lower or ("compare" in p_lower and any(m in p_lower for m in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])) or "between" in p_lower:
                return "SELECT period_month_label, total_sales_units, total_net_revenue, total_gross_profit, gross_margin_pct FROM v_monthly_sales_trend ORDER BY period_start_date ASC LIMIT 12;"

            # 5. Month Filtering (e.g. "What was total revenue in September?")
            month_map = {
                "september": "Sep", "sep": "Sep",
                "august": "Aug", "aug": "Aug",
                "january": "Jan", "jan": "Jan",
                "february": "Feb", "feb": "Feb",
                "march": "Mar", "mar": "Mar",
                "april": "Apr", "apr": "Apr",
                "may": "May",
                "june": "Jun", "jun": "Jun",
                "july": "Jul", "jul": "Jul",
                "october": "Oct", "oct": "Oct",
                "november": "Nov", "nov": "Nov",
                "december": "Dec", "dec": "Dec",
            }
            matched_month = None
            for m_key, m_val in month_map.items():
                if re.search(rf"\b{m_key}\b", p_lower):
                    matched_month = m_val
                    break

            # Specific store + month
            canonical_stores = {
                "bhubaneswar": "M Baazar - Bhubaneswar",
                "bbsr": "M Baazar - Bhubaneswar",
                "gariahat": "M Baazar - Gariahat",
                "grhat": "M Baazar - Gariahat",
                "silchar": "M Baazar - Silchar",
                "slchr": "M Baazar - Silchar",
                "andul": "M Baazar - Andul Road",
                "berhampur": "M Baazar - Berhampur City",
                "tezpur": "M Baazar - Tezpur",
                "tzpur": "M Baazar - Tezpur",
                "store 1": "M Baazar - Bhubaneswar",
                "store 2": "M Baazar - Gariahat",
                "store 3": "M Baazar - Silchar",
                "store 4": "M Baazar - Andul Road",
                "store 5": "M Baazar - Berhampur City",
                "store 6": "M Baazar - Tezpur",
            }
            matched_store = None
            for key, name in canonical_stores.items():
                if key in p_lower:
                    matched_store = name
                    break

            if matched_store and matched_month:
                return (
                    f"SELECT store_name, period_month_label, round(sum(net_amount), 2) AS net_revenue, "
                    f"round(sum(gross_profit), 2) AS gross_profit, round(sum(gross_profit)/nullIf(sum(net_amount),0)*100, 1) AS margin_pct "
                    f"FROM v_fact_sales_enriched "
                    f"WHERE store_name = '{matched_store}' AND period_month_label LIKE '{matched_month}%' "
                    f"GROUP BY store_name, period_month_label;"
                )

            if matched_month:
                return (
                    f"SELECT department, round(sum(net_amount), 2) AS net_revenue "
                    f"FROM v_fact_sales_enriched "
                    f"WHERE period_month_label LIKE '{matched_month}%' "
                    f"GROUP BY department ORDER BY net_revenue DESC LIMIT 5;"
                )

            # Known departments
            known_depts = ["t shirts", "casual shirts", "jeans", "salwar suits", "kurti lds", "formal shirts", "bermuda", "cotton trousers"]
            matched_dept = next((d.title() for d in known_depts if d in p_lower), None)

            # Product / SKU queries (optionally scoped to store and/or department)
            if any(k in p_lower for k in ["sku", "item", "product", "products", "skus"]):
                where_clauses = []
                if matched_store:
                    where_clauses.append(f"store_name = '{matched_store}'")
                if matched_dept:
                    where_clauses.append(f"department = '{matched_dept}'")
                where_str = f"WHERE {' AND '.join(where_clauses)} " if where_clauses else ""
                order_dir = "ASC" if any(k in p_lower for k in ["worst", "lowest", "decline", "bottom", "drop", "caused"]) else "DESC"
                return f"SELECT item_code, round(sum(net_amount), 2) AS net_revenue, sum(bill_qty) AS units_sold FROM v_fact_sales_enriched {where_str}GROUP BY item_code ORDER BY net_revenue {order_dir} LIMIT 5;"

            # Department query in a specific store
            if matched_store and ("department" in p_lower or "category" in p_lower or matched_dept):
                order_dir = "ASC" if any(k in p_lower for k in ["worst", "lowest", "decline", "bottom", "drop", "caused"]) else "DESC"
                return f"SELECT department, round(sum(net_amount), 2) AS net_revenue FROM v_fact_sales_enriched WHERE store_name = '{matched_store}' GROUP BY department ORDER BY net_revenue {order_dir} LIMIT 5;"

            # 6. Specific store without month
            if matched_store:
                return (
                    f"SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct "
                    f"FROM v_store_performance_summary "
                    f"WHERE store_name = '{matched_store}';"
                )

            # 7. Worst or Best store
            if any(k in p_lower for k in ["worst", "lowest", "bottom", "underperform"]) and "store" in p_lower:
                return "SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct FROM v_store_performance_summary ORDER BY total_net_revenue ASC LIMIT 1;"
            if any(k in p_lower for k in ["best", "top", "highest"]) and "store" in p_lower and "department" not in p_lower:
                return "SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct FROM v_store_performance_summary ORDER BY total_net_revenue DESC LIMIT 1;"

            # 8. Department queries (e.g. "Top 5 departments by sales revenue")
            if "department" in p_lower or any(d in p_lower for d in ["t shirts", "casual shirts", "jeans", "salwar suits"]):
                limit = 5
                match_num = re.search(r"\btop\s+(\d+)\b", p_lower)
                if match_num:
                    limit = int(match_num.group(1))
                return f"SELECT department, round(sum(net_amount), 2) AS net_revenue FROM v_fact_sales_enriched GROUP BY department ORDER BY net_revenue DESC LIMIT {limit};"

            # 9. General store ranking or comparison
            if "store" in p_lower:
                return "SELECT store_name, state, total_net_revenue, total_gross_profit, gross_margin_pct FROM v_store_performance_summary ORDER BY total_net_revenue DESC LIMIT 10;"

            # 10. Category or Division Breakdown
            if "category" in p_lower or "division" in p_lower:
                return "SELECT division, department, total_sales_units, total_net_revenue, gross_margin_pct FROM v_category_performance_summary ORDER BY total_net_revenue DESC LIMIT 10;"

            # 11. Total chain metrics (simple lookup)
            if any(k in p_lower for k in ["total revenue", "net sales", "overall sales", "total sales"]):
                return "SELECT round(sum(net_amount), 2) AS total_net_revenue, sum(bill_qty) AS total_sales_units, round(sum(gross_profit), 2) AS total_gross_profit FROM v_fact_sales_enriched;"

            return "SELECT department, round(sum(net_amount), 2) AS net_revenue FROM v_fact_sales_enriched GROUP BY department ORDER BY net_revenue DESC LIMIT 5;"

        # Online LLM Code Path
        system_context = wren_engine.build_system_prompt_context(user_prompt, dialect="clickhouse")

        system_role_desc = (
            "You are an expert Enterprise Retail OLAP Data Engineer specializing in ClickHouse SQL for M Baazar retail analytics. "
            "Target Database: mb_olap_v2. "
            "Convert natural language business questions into syntactically valid ClickHouse SQL based on the provided ClickHouse schema and analytical views.\n\n"
            f"{system_context}"
        )

        history_context = ""
        if conversation_history:
            recent_turns = conversation_history[-4:]
            lines = []
            for m in recent_turns:
                r = m.get("role") or m.get("sender") or "user"
                c = m.get("content") or m.get("text") or ""
                if c:
                    lines.append(f"{r.capitalize()}: {c}")
            if lines:
                history_context = "Conversation Context:\n" + "\n".join(lines) + "\n\n"

        user_msg = f"{history_context}Generate ClickHouse SQL for database mb_olap_v2 for the current question: \"{user_prompt}\""

        messages = [
            {
                "role": "system",
                "content": system_role_desc,
            },
            {
                "role": "user",
                "content": user_msg,
            },
        ]

        raw_content = self._create_completion(messages, temperature=0.0, max_tokens=1024)
        if raw_content:
            return self.extract_sql_from_response(raw_content)

        return "SELECT department, round(sum(net_amount), 2) AS net_revenue FROM v_fact_sales_enriched GROUP BY department ORDER BY net_revenue DESC LIMIT 5;"

    def fix_union_order_by(self, sql: str) -> str:
        """
        Ensures UNION / UNION ALL branches that contain ORDER BY or LIMIT
        are properly wrapped in parentheses for standard SQL compliance.
        """
        union_pattern = re.compile(r'(?i)(UNION\s+ALL|UNION)\s+(SELECT)')
        if not union_pattern.search(sql):
            return sql

        tokens = re.split(r'(?i)(UNION\s+ALL|UNION)', sql)
        fixed_parts = []
        for tok in tokens:
            if re.match(r'(?i)UNION(\s+ALL)?', tok.strip()):
                fixed_parts.append(tok)
                continue
            branch = tok.strip()
            needs_wrap = re.search(r'(?i)(ORDER\s+BY|LIMIT)', branch)
            already_wrapped = branch.startswith('(') and branch.endswith(')')
            if needs_wrap and not already_wrapped:
                branch = f"({branch})"
            fixed_parts.append(branch)
        return '\n'.join(fixed_parts)

    def generate_zero_result_repair_sql(
        self,
        raw_query: str,
        failed_sql: str,
        entity_phrases: List[str],
        candidates: List[Dict[str, Any]],
        dialect: Optional[str] = None,
    ) -> str:
        """
        Uses entity extraction and fuzzy DB candidates to repair zero-result queries.
        """
        if not self.client:
            return failed_sql

        from backend.app.config import settings
        active_dialect = (dialect or getattr(settings, "WAREHOUSE_BACKEND", "clickhouse")).lower().strip()
        system_context = wren_engine.build_system_prompt_context(raw_query, dialect=active_dialect)

        repair_rules = (
            "- Preserve user's original metric (Revenue/Profit/Units) and ranking.\n"
            "- Fix entity matching logic using exact candidate values or replaceRegexpAll(upper(toString(col)), '[^A-Z0-9]+', '').\n"
            "- Target Database: mb_olap_v2. Ensure SQL is valid ClickHouse SQL."
        )

        repair_prompt = f"""The previous SQL returned zero rows. Repair it and return ONLY corrected raw SQL inside a ```sql ... ``` code block.

Original Question: {raw_query}
Previous SQL: {failed_sql}

Detected Entity Phrases:
{json.dumps(entity_phrases, ensure_ascii=False)}

Candidate Database Matches (Use these exact names/codes):
{json.dumps(candidates, ensure_ascii=False)}

Repair Rules:
{repair_rules}
"""

        messages = [
            {"role": "system", "content": system_context},
            {"role": "user", "content": repair_prompt},
        ]

        raw = self._create_completion(messages, temperature=0.0, max_tokens=1024)
        if raw:
            repaired = self.extract_sql_from_response(raw)
            return self.fix_union_order_by(repaired)
        return failed_sql

    def refine_sql_error(
        self,
        broken_sql: str,
        error_trace: str,
        user_prompt: str,
        dialect: str = "clickhouse",
    ) -> str:
        """
        Refines broken SQL query by feeding actual warehouse syntax error back to LLM.
        """
        if not self.client:
            return broken_sql

        system_context = wren_engine.build_system_prompt_context(user_prompt, dialect="clickhouse")

        system_content = (
            "You are a ClickHouse SQL auto-correction assistant for database mb_olap_v2. "
            "Fix the provided broken ClickHouse SQL query based on the ClickHouse error traceback.\n"
            "Return ONLY the corrected ClickHouse SQL query inside a ```sql ... ``` code block.\n\n"
            f"{system_context}"
        )
        user_content = (
            f"User Question: \"{user_prompt}\"\n"
            f"Broken ClickHouse SQL: `{broken_sql}`\n"
            f"ClickHouse Error Traceback: {error_trace}\n\n"
            "Provide the corrected ClickHouse SQL query:"
        )

        messages = [
            {
                "role": "system",
                "content": system_content,
            },
            {
                "role": "user",
                "content": user_content,
            },
        ]

        raw = self._create_completion(messages, temperature=0.0, max_tokens=1024)
        if raw:
            return self.extract_sql_from_response(raw)
        return broken_sql

    def generate_summary(self, user_prompt: str, sql: str, data: List[Dict[str, Any]]) -> str:
        """
        Synthesizes a precise, grounded executive summary of query results.
        Enforces strict anti-hallucination rules and Indian numbering/currency format.
        """
        if not data:
            return f"Query executed successfully, but returned 0 results for: '{user_prompt}'."

        is_report_request = any(
            k in user_prompt.lower()
            for k in ["report", "executive report", "analysis report", "generate report", "create report", "summary report", "briefing"]
        )

        if not self.client:
            row_count = len(data)
            first_row = data[0]
            metric_keys = [
                k
                for k in first_row.keys()
                if k.lower()
                not in [
                    "department",
                    "store_name",
                    "barcode",
                    "division",
                    "partyname",
                    "section",
                    "admsite_code",
                    "icode",
                ]
            ]
            top_metric = f" ({metric_keys[0]}: {first_row[metric_keys[0]]})" if metric_keys else ""
            first_val = list(first_row.values())[0] if first_row else ""

            if is_report_request:
                return (
                    f"### 📋 Executive Summary\n"
                    f"Analytical report generated for: **{user_prompt}**. A total of {row_count} records were retrieved from the ClickHouse OLAP warehouse.\n\n"
                    f"### 📊 Key Performance Highlights\n"
                    f"• Leading result: **{first_val}**{top_metric}\n"
                    f"• Total active records evaluated: **{row_count}**\n\n"
                    f"### 💡 Actionable Recommendations\n"
                    f"• Review high-velocity entities in the data breakdown below to prioritize stock replenishment.\n"
                    f"• Use the Export CSV or Print / PDF button to distribute this report to store and inventory operations."
                )

            return f"Found {row_count} records for '{user_prompt}'. Top result: {first_val}{top_metric}."

        sample_data = data[:15]

        if is_report_request:
            system_prompt_text = (
                "You are the ClickHouse Enterprise Retail Analytics Agent for M Baazar retail.\n"
                "The user requested a FORMAL BUSINESS REPORT. Format your response clearly using markdown with these distinct sections:\n\n"
                "### 📋 Executive Summary\n"
                "A concise 1-2 sentence overview of the metric results and scope.\n\n"
                "### 📊 Key Performance Highlights\n"
                "Bullet points identifying totals, top performers, and significant observations from the data.\n\n"
                "### 💡 Actionable Recommendations\n"
                "2 practical, data-driven recommendations for retail operations, stock rebalancing, or category managers.\n\n"
                "STRICT DATA INTEGRITY RULES:\n"
                "1. Base all facts, rankings, and numbers EXCLUSIVELY on the provided Query Results JSON. Never hallucinate names or figures.\n"
                "2. CURRENCY FORMATTING: All monetary values MUST use the Indian Rupee symbol (₹). Format large numbers clearly in Lakhs (L) and Crores (Cr). Never use $ or USD."
            )
            token_budget = 450
        else:
            system_prompt_text = (
                "You are an Executive Retail Intelligence AI for M Baazar retail analytics.\n\n"
                "STRICT ANTI-HALLUCINATION & FACTUAL ACCURACY RULES:\n"
                "1. Base your summary EXCLUSIVELY on the provided Query Results JSON data. Never invent entities, store names, categories, or figures not present in the data.\n"
                "2. State specific top entities and key values directly from the results.\n"
                "3. CURRENCY & NUMBER FORMATTING (MANDATORY):\n"
                "   - All monetary amounts are in Indian Rupees (₹). ALWAYS use the ₹ symbol. NEVER use $, USD, Dollar, EUR, or Euros.\n"
                "   - Format large rupee amounts clearly using Indian numbering conventions: e.g. ₹3.93 Cr for Crores (10,000,000+), ₹22.50 L for Lakhs (100,000+).\n"
                "   - Format percentages with '%' (e.g. 32.5%).\n"
                "4. Provide a direct, professional 2-sentence executive summary highlighting the primary finding and top contributors."
            )
            token_budget = 250

        messages = [
            {
                "role": "system",
                "content": system_prompt_text,
            },
            {
                "role": "user",
                "content": (
                    f"User Question: \"{user_prompt}\"\n"
                    f"SQL Executed: `{sql}`\n"
                    f"Query Results ({len(data)} total rows, top rows shown): {json.dumps(sample_data, default=str)}\n\n"
                    "Synthesize the response:"
                ),
            },
        ]

        raw_summary = self._create_completion(messages, temperature=0.1, max_tokens=token_budget)
        if raw_summary:
            clean_summary = raw_summary.strip()
            # Sanitize currency symbols to ensure Indian Rupees (₹)
            clean_summary = re.sub(r"[$€£¥]", "₹", clean_summary)
            clean_summary = re.sub(r"\bUSD\b", "INR", clean_summary, flags=re.IGNORECASE)
            return clean_summary

        return f"Retrieved {len(data)} records for '{user_prompt}'."


groq_service = GroqLLMService()
