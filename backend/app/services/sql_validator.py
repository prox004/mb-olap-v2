import re
from typing import Tuple, List, Dict, Any
from duckdb import DuckDBPyConnection
from backend.app.services.groq_llm_service import groq_service

class SQLValidatorService:
    """
    SQL Validator and Security Enforcer:
      - Blocks non-SELECT write operations (DROP, DELETE, UPDATE, INSERT, ALTER, PRAGMA).
      - Auto-appends LIMIT 500 safety caps if missing.
      - Executes queries against DuckDB and runs an Auto-Refinement Repair Loop on syntax errors.
    """

    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "PRAGMA",
        "TRUNCATE", "CREATE", "GRANT", "REVOKE", "COPY", "ATTACH"
    ]

    def enforce_security_and_limits(self, sql: str) -> str:
        """
        Validates read-only status and appends default LIMIT 500 if missing.
        """
        clean_sql = sql.strip().strip(";")
        upper_sql = clean_sql.upper()

        # 1. Security Check
        for word in self.FORBIDDEN_KEYWORDS:
            # Word boundary regex search to avoid blocking valid column names
            if re.search(rf"\b{word}\b", upper_sql):
                raise ValueError(f"Security Alert: Destructive or non-read-only operation '{word}' is strictly forbidden.")

        if not upper_sql.startswith("SELECT") and not upper_sql.startswith("WITH"):
            raise ValueError("Security Alert: Only SELECT or WITH (CTE) queries are permitted.")

        # 2. Limit Enforcer
        if "LIMIT" not in upper_sql:
            clean_sql += " LIMIT 500"

        return clean_sql

    def execute_with_auto_refinement(
        self,
        db: DuckDBPyConnection,
        initial_sql: str,
        user_prompt: str,
        max_attempts: int = 2
    ) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """
        Executes query on DuckDB. If DuckDB raises a syntax error, triggers Groq API auto-refinement repair loop.
        Returns: (final_executed_sql, column_names, result_data_dicts)
        """
        current_sql = self.enforce_security_and_limits(initial_sql)
        attempt = 0

        while attempt < max_attempts:
            try:
                cursor = db.execute(current_sql)
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()

                data = [dict(zip(columns, row)) for row in rows]
                return current_sql, columns, data

            except Exception as error:
                attempt += 1
                error_trace = str(error)
                print(f"[SQL_VALIDATOR] Execution Error on Attempt {attempt}: {error_trace}")

                if attempt >= max_attempts:
                    raise RuntimeError(f"SQL Execution Error after {max_attempts} attempts: {error_trace}")

                # Auto-Refinement Repair Loop
                refined_raw_sql = groq_service.refine_sql_error(current_sql, error_trace, user_prompt)
                current_sql = self.enforce_security_and_limits(refined_raw_sql)

        raise RuntimeError("Failed to execute SQL query within maximum refinement attempts.")

sql_validator = SQLValidatorService()
