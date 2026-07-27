import os
import re
from typing import Dict, Any, List
from groq import Groq
from backend.app.services.wren_context_engine import wren_engine

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
        except Exception as e:
            # Fallback to 8b-instant if 70b hits rate limits or error
            try:
                response = self.client.chat.completions.create(
                    model=self.fallback_model,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1024
                )
                return self.extract_sql_from_response(response.choices[0].message.content)
            except Exception:
                matches = wren_engine.find_matching_golden_sql(user_prompt, top_k=1)
                return matches[0]["sql"] if matches else "SELECT 1;"

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
                "content": "You are an Executive Retail Intelligence AI. Provide a concise 2-sentence executive insight summarizing the query results for a retail executive."
            },
            {
                "role": "user",
                "content": (
                    f"User Question: \"{user_prompt}\"\n"
                    f"SQL Executed: `{sql}`\n"
                    f"Top Results: {json.dumps(sample_data, default=str)}\n\n"
                    "Synthesize summary:"
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
            return response.choices[0].message.content.strip()
        except Exception:
            return f"Retrieved {len(data)} records for '{user_prompt}'."

groq_service = GroqLLMService()
