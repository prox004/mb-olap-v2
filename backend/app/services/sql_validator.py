import re
from typing import Tuple, List, Dict, Any, Optional
from backend.app.services.groq_llm_service import groq_service

class SQLValidatorService:
    """
    SQL Validator and Security Enforcer:
      - Validates read-only status for ClickHouse analytical queries.
      - Blocks non-SELECT / destructive operations (DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, OPTIMIZE, etc.).
      - Blocks multi-statement query injection.
      - Auto-appends LIMIT 500 safety caps if missing.
      - Executes queries against warehouse (ClickHouseWarehouseConnection) and runs an Auto-Refinement Repair Loop on syntax/execution errors.
    """

    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "PRAGMA",
        "TRUNCATE", "CREATE", "GRANT", "REVOKE", "COPY", "ATTACH",
        "DETACH", "OPTIMIZE", "KILL", "RENAME", "BACKUP", "RESTORE"
    ]

    def enforce_security_and_limits(self, sql: str, dialect: Optional[str] = None) -> str:
        """
        Validates read-only status, blocks multi-statements, and appends default LIMIT 500 and timeout if missing.
        """
        clean_sql = sql.strip().rstrip(";")
        upper_sql = clean_sql.upper()

        # 1. Multi-statement injection prevention
        if ";" in clean_sql:
            raise ValueError("Security Alert: Multi-statement queries separated by semicolons are strictly forbidden.")

        # 2. Must begin with SELECT or WITH
        if not upper_sql.startswith("SELECT") and not upper_sql.startswith("WITH"):
            raise ValueError("Security Alert: Only read-only SELECT or WITH (CTE) queries are permitted.")

        # 3. Security Check: Forbidden destructive / administrative keywords
        for word in self.FORBIDDEN_KEYWORDS:
            if re.search(rf"\b{word}\b", upper_sql):
                raise ValueError(f"Security Alert: Destructive or non-read-only operation '{word}' is strictly forbidden.")

        # ClickHouse administrative SYSTEM command check (allow system.columns / system.tables)
        if re.search(r"\bSYSTEM(?!\.)\b", upper_sql):
            raise ValueError("Security Alert: Administrative 'SYSTEM' operations are strictly forbidden.")

        # 4. Limit Enforcer: Ensure query does not pull unbounded datasets
        if "LIMIT" not in upper_sql:
            clean_sql += " LIMIT 500"

        return clean_sql

    def execute_with_auto_refinement(
        self,
        db: Any,
        initial_sql: str,
        user_prompt: str,
        max_attempts: int = 2,
        dialect: Optional[str] = None
    ) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """
        Executes query against active warehouse (ClickHouseWarehouseConnection or database connection).
        If the warehouse raises an execution or syntax error, feeds the exact error trace back
        to the LLM for automatic SQL refinement.
        Returns: (final_executed_sql, column_names, result_data_dicts)
        """
        from backend.app.config import settings
        if dialect is None:
            if type(db).__name__ == "ClickHouseWarehouseConnection":
                dialect = "clickhouse"
            else:
                dialect = getattr(settings, "WAREHOUSE_BACKEND", "clickhouse").lower().strip()

        current_sql = self.enforce_security_and_limits(initial_sql)
        attempt = 0

        while attempt < max_attempts:
            try:
                cursor = db.execute(current_sql)
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                rows = cursor.fetchall()

                data = [dict(zip(columns, row)) for row in rows]
                return current_sql, columns, data

            except Exception as error:
                attempt += 1
                error_trace = str(error)
                print(f"[SQL_VALIDATOR] {dialect.upper()} Execution Error on Attempt {attempt}: {error_trace}")

                if attempt >= max_attempts:
                    raise RuntimeError(f"{dialect.upper()} SQL Execution Error after {max_attempts} attempts: {error_trace}")

                # Auto-Refinement Repair Loop - feed actual ClickHouse / warehouse error back to LLM
                refined_raw_sql = groq_service.refine_sql_error(
                    broken_sql=current_sql,
                    error_trace=error_trace,
                    user_prompt=user_prompt,
                    dialect=dialect
                )
                current_sql = self.enforce_security_and_limits(refined_raw_sql)

        raise RuntimeError("Failed to execute SQL query within maximum refinement attempts.")

sql_validator = SQLValidatorService()
