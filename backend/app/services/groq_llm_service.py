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
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
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
        self._active_model = CANDIDATE_MODELS[0] if CANDIDATE_MODELS else "qwen/qwen3.8-27b"

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

    def generate_sql(self, user_prompt: str) -> str:
        """
        Translates a natural language user prompt into governed DuckDB SQL.
        If Groq API is unavailable, falls back to semantic golden SQL matching.
        """
        if not self.client:
            matches = wren_engine.find_matching_golden_sql(user_prompt, top_k=1)
            if matches:
                return matches[0]["sql"]
            return "SELECT i.Department, ROUND(SUM(ABS(f.NET_SALE_AMOUNT)), 2) AS Net_Revenue FROM fact_cube_monthly f JOIN dim_item i ON f.BARCODE = i.ICODE GROUP BY i.Department ORDER BY Net_Revenue DESC LIMIT 5;"

        system_context = wren_engine.build_system_prompt_context(user_prompt)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert Enterprise Retail OLAP Data Engineer powered by Wren AI. "
                    "Convert natural language business questions into syntactically valid DuckDB SQL based ONLY on the provided Wren AI MDL context.\n\n"
                    f"{system_context}"
                ),
            },
            {
                "role": "user",
                "content": f"Generate DuckDB SQL for the question: \"{user_prompt}\"",
            },
        ]

        raw_content = self._create_completion(messages, temperature=0.0, max_tokens=1024)
        if raw_content:
            return self.extract_sql_from_response(raw_content)

        # Fallback to golden memory pair matching if LLM call failed
        matches = wren_engine.find_matching_golden_sql(user_prompt, top_k=1)
        return matches[0]["sql"] if matches else "SELECT 1;"

    def fix_union_order_by(self, sql: str) -> str:
        """
        DuckDB requires every UNION / UNION ALL branch that contains ORDER BY or LIMIT
        to be wrapped in parentheses. This function fixes it automatically.
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
    ) -> str:
        """
        Uses entity extraction and fuzzy DB candidates to repair zero-result queries.
        """
        if not self.client:
            return failed_sql

        system_context = wren_engine.build_system_prompt_context(raw_query)

        repair_prompt = f"""The previous SQL returned zero rows. Repair it and return ONLY corrected raw SQL inside a ```sql ... ``` code block.

Original Question: {raw_query}
Previous SQL: {failed_sql}

Detected Entity Phrases:
{json.dumps(entity_phrases, ensure_ascii=False)}

Candidate Database Matches (Use these exact names/barcodes in ILIKE / REGEXP_REPLACE):
{json.dumps(candidates, ensure_ascii=False)}

Repair Rules:
- Preserve user's original metric (Revenue/Profit/Units) and ranking.
- Fix entity matching logic using exact candidate values or REGEXP_REPLACE(UPPER(col), '[^A-Z0-9]+', '', 'g').
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

    def refine_sql_error(self, broken_sql: str, error_trace: str, user_prompt: str) -> str:
        """
        Refines broken SQL query by feeding DuckDB syntax error back to LLM.
        """
        if not self.client:
            return broken_sql

        system_context = wren_engine.build_system_prompt_context(user_prompt)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a DuckDB SQL auto-correction assistant. Fix the provided broken SQL query based on the DuckDB error traceback.\n"
                    "Return ONLY the corrected SQL query inside a ```sql ... ``` code block.\n\n"
                    f"{system_context}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"User Question: \"{user_prompt}\"\n"
                    f"Broken SQL: `{broken_sql}`\n"
                    f"DuckDB Error Traceback: {error_trace}\n\n"
                    "Provide the corrected SQL query:"
                ),
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
            return f"Found {row_count} records for '{user_prompt}'. Top result: {first_val}{top_metric}."

        sample_data = data[:10]
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an Executive Retail Intelligence AI for M Baazar retail analytics.\n\n"
                    "STRICT ANTI-HALLUCINATION & FACTUAL ACCURACY RULES:\n"
                    "1. Base your summary EXCLUSIVELY on the provided Query Results JSON data. Never invent entities, store names, categories, or figures not present in the data.\n"
                    "2. State specific top entities and key values directly from the results.\n"
                    "3. CURRENCY & NUMBER FORMATTING (MANDATORY):\n"
                    "   - All monetary amounts are in Indian Rupees (₹). ALWAYS use the ₹ symbol. NEVER use $, USD, Dollar, EUR, or Euros.\n"
                    "   - Format large rupee amounts clearly using Indian numbering conventions: e.g. ₹3.93 Cr for Crores (10,000,000+), ₹22.50 L for Lakhs (100,000+).\n"
                    "   - Format percentages with '%' (e.g. 32.5%).\n"
                    "4. Provide a direct, professional 2-sentence executive summary highlighting the primary finding and top contributors."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"User Question: \"{user_prompt}\"\n"
                    f"SQL Executed: `{sql}`\n"
                    f"Query Results ({len(data)} total rows, top rows shown): {json.dumps(sample_data, default=str)}\n\n"
                    "Synthesize a factual, grounded executive summary:"
                ),
            },
        ]

        raw_summary = self._create_completion(messages, temperature=0.1, max_tokens=250)
        if raw_summary:
            clean_summary = raw_summary.strip()
            # Sanitize currency symbols to ensure Indian Rupees (₹)
            clean_summary = re.sub(r"[$€£¥]", "₹", clean_summary)
            clean_summary = re.sub(r"\bUSD\b", "INR", clean_summary, flags=re.IGNORECASE)
            return clean_summary

        return f"Retrieved {len(data)} records for '{user_prompt}'."


groq_service = GroqLLMService()
