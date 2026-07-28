import os
import re
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
from groq import Groq
from backend.app.services.wren_context_engine import wren_engine

# Load .env file from project root or backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

class GroqLLMService:
    """
    Groq API LLM Service supporting llama-3.3-70b-versatile and llama-3.1-8b-instant models.
    Translates business questions into DuckDB SQL and synthesizes natural language executive summaries.
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.primary_model = "llama-3.3-70b-versatile"
        self.fallback_model = "llama-3.1-8b-instant"

    def extract_sql_from_response(self, text: str) -> str:
        """
        Extracts SQL code block from LLM output markdown.
        """
        match = re.search(r"```sql\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # Fallback if markdown tags omitted
        clean_text = text.strip()
        if clean_text.upper().startswith("SELECT"):
            return clean_text
        
        return clean_text

    def generate_sql(self, user_prompt: str) -> str:
        """
        Translates a natural language user prompt into governed DuckDB SQL.
        If GROQ_API_KEY is absent, falls back to golden memory semantic matching.
        """
        if not self.client:
            # Fallback to golden memory pair matching if API key missing
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
                )
            },
            {
                "role": "user",
                "content": f"Generate DuckDB SQL for the question: \"{user_prompt}\""
            }
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.primary_model,
                messages=messages,
                temperature=0.1,
                max_tokens=1024
            )
            raw_content = response.choices[0].message.content
            return self.extract_sql_from_response(raw_content)
        except Exception:
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

    def generate_zero_result_repair_sql(self, raw_query: str, failed_sql: str, entity_phrases: List[str], candidates: List[Dict[str, Any]]) -> str:
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
            {"role": "user", "content": repair_prompt}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.primary_model,
                messages=messages,
                temperature=0.0,
                max_tokens=1024
            )
            raw = response.choices[0].message.content
            repaired = self.extract_sql_from_response(raw)
            return self.fix_union_order_by(repaired)
        except Exception:
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
                )
            },
            {
                "role": "user",
                "content": (
                    f"User Question: \"{user_prompt}\"\n"
                    f"Broken SQL: `{broken_sql}`\n"
                    f"DuckDB Error Traceback: {error_trace}\n\n"
                    "Provide the corrected SQL query:"
                )
            }
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.primary_model,
                messages=messages,
                temperature=0.0,
                max_tokens=1024
            )
            return self.extract_sql_from_response(response.choices[0].message.content)
        except Exception:
            return broken_sql

    def generate_summary(self, user_prompt: str, sql: str, data: List[Dict[str, Any]]) -> str:
        """
        Synthesizes a natural language executive summary of query results.
        """
        if not data:
            return f"Query executed successfully, but returned 0 results for: '{user_prompt}'."

        if not self.client:
            row_count = len(data)
            first_row = data[0]
            metric_keys = [k for k in first_row.keys() if k.lower() not in ['department', 'store_name', 'barcode', 'division', 'partyname', 'section']]
            top_metric = f" ({metric_keys[0]}: {first_row[metric_keys[0]]})" if metric_keys else ""
            return f"Found {row_count} records for '{user_prompt}'. Top result: {list(first_row.values())[0]}{top_metric}."

        sample_data = data[:5]
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an Executive Retail Intelligence AI. Provide a concise 2-sentence executive insight summarizing the query results for a retail executive.\n\n"
                    "CURRENCY & FORMATTING RULES (MANDATORY):\n"
                    "- All monetary values are Indian Rupees.\n"
                    "- ALWAYS use the ₹ symbol. NEVER output $, USD, Dollar, EUR, or Euros.\n"
                    "- Format numbers using Indian numbering system (e.g. ₹2.29 Cr or ₹2,29,09,200)."
                )
            },
            {
                "role": "user",
                "content": (
                    f"User Question: \"{user_prompt}\"\n"
                    f"SQL Executed: `{sql}`\n"
                    f"Top Results: {json.dumps(sample_data, default=str)}\n\n"
                    "Synthesize executive summary:"
                )
            }
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.fallback_model,
                messages=messages,
                temperature=0.3,
                max_tokens=150
            )
            raw_summary = response.choices[0].message.content.strip()
            # Sanitize currency symbols to ensure Indian Rupees (₹)
            clean_summary = re.sub(r"[$€£¥]", "₹", raw_summary)
            clean_summary = re.sub(r"\bUSD\b", "INR", clean_summary, flags=re.IGNORECASE)
            return clean_summary
        except Exception:
            return f"Retrieved {len(data)} records for '{user_prompt}'."

groq_service = GroqLLMService()
