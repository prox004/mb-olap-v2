import os
import sys
import duckdb

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from backend.app.services.wren_context_engine import wren_engine
from backend.app.services.groq_llm_service import groq_service
from backend.app.services.sql_validator import sql_validator
from backend.app.services.chart_classifier import chart_classifier

def verify_chat_backend_pipeline():
    """
    Automated test script verifying end-to-end Chat API query pipeline:
      1. Context Engine loading.
      2. Groq LLM SQL translation / fallback matching.
      3. Security enforcement, LIMIT injection, and DuckDB execution.
      4. Chart auto-classification.
      5. Executive summary synthesis.
    """
    print("=== STARTING SEMANTIC CHATBACKEND PIPELINE VERIFICATION ===")

    db_path = os.path.join("backend", "db", "olap_warehouse.duckdb")
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DuckDB database missing at {db_path}")

    db = duckdb.connect(db_path)

    test_prompts = [
        "What are the top 5 departments by net sales revenue?",
        "Show revenue and gross profit margin percentage across all retail stores",
        "Which vendors have the highest GMROI?",
        "What is the sell-through percentage by division?"
    ]

    for idx, prompt in enumerate(test_prompts, start=1):
        print(f"\nTest {idx}: \"{prompt}\"")

        # 1. SQL Generation
        sql = groq_service.generate_sql(prompt)
        print(f"   [SQL GENERATED]: {sql}")

        # 2. Validation & Execution
        executed_sql, cols, data = sql_validator.execute_with_auto_refinement(db, sql, prompt)
        print(f"   [SQL EXECUTED] : {executed_sql}")
        print(f"   [RESULT COLS]  : {cols}")
        print(f"   [ROWS RETURNED]: {len(data)}")

        # 3. Chart Classification
        viz_type = chart_classifier.classify(cols, data)
        print(f"   [CHART VIZ]    : {viz_type}")

        # 4. Summary Synthesis
        summary = groq_service.generate_summary(prompt, executed_sql, data)
        print(f"   [SUMMARY]      : {summary}")

        assert len(data) > 0, "Expected non-empty data results!"
        assert viz_type in ["KPI_CARD", "PIE_CHART", "BAR_CHART", "DATA_TABLE"], "Invalid visualization type!"
        print("   [STATUS]       : PASS")

    db.close()
    print("\n=== SEMANTIC CHATBACKEND PIPELINE VERIFICATION PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    verify_chat_backend_pipeline()
