from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from duckdb import DuckDBPyConnection

from backend.app.api.deps import get_db
from backend.app.schemas.response import StandardResponse
from backend.app.services.groq_llm_service import groq_service
from backend.app.services.sql_validator import sql_validator
from backend.app.services.chart_classifier import chart_classifier
from backend.app.services.wren_context_engine import wren_engine

router = APIRouter()

class ChatQueryRequest(BaseModel):
    prompt: str

class ChatQueryResponse(BaseModel):
    prompt: str
    generated_sql: str
    visualization_type: str
    summary: str
    columns: List[str]
    data: List[Dict[str, Any]]
    record_count: int

class SuggestedPrompt(BaseModel):
    id: int
    category: str
    prompt: str


def detect_unsupported_inventory_metric(prompt: str) -> Optional[Dict[str, str]]:
    """
    Checks if a prompt asks for inventory/stock metrics that cannot be computed
    from legacy POS sales ledger datasets.
    When ClickHouse is active with fact_inventory, all SOH and Sell-Through metrics are supported.
    """
    from backend.app.config import settings
    if settings.WAREHOUSE_BACKEND.lower().strip() == "clickhouse":
        return None

    p = prompt.lower()

    # 1. Sell-Through Percentage / Rate
    if any(k in p for k in ["sell-through", "sell through", "sellthrough", "str %"]):
        return {
            "metric": "Sell-Through Rate / Percentage",
            "reason": (
                "Sell-through rate requires opening stock, incoming shipments/receipts, or stock-on-hand (SOH) inventory snapshots. "
                "The active ClickHouse data warehouse currently contains verified POS retail sales transactions (397,805 records), "
                "which does not include physical inventory snapshot feeds."
            ),
            "sql_comment": "-- Metric Unavailable: Sell-through requires Stock-On-Hand (SOH) and inventory receipt/transfer feeds\n-- Current active warehouse schema provides verified POS retail sales ledger records."
        }

    # 2. Weeks of Cover (WOC)
    if any(k in p for k in ["weeks of cover", "week of cover", "woc", "stock cover", "inventory cover"]):
        return {
            "metric": "Weeks of Cover (WOC)",
            "reason": (
                "Weeks of Cover (WOC) calculation requires active Stock-On-Hand (SOH) inventory levels divided by average weekly sales velocity. "
                "Inventory stock balances are unavailable in the current POS sales ledger dataset."
            ),
            "sql_comment": "-- Metric Unavailable: Weeks of Cover requires active SOH inventory balances\n-- Current active warehouse schema provides verified POS retail sales ledger records."
        }

    # 3. Stock on Hand / Closing / Opening Inventory Balances
    if any(k in p for k in [
        "stock on hand", "stock-on-hand", "soh", "closing stock", "opening stock",
        "current stock", "stock valuation", "inventory valuation", "stock level", "inventory level"
    ]):
        return {
            "metric": "Stock-On-Hand (SOH) & Inventory Balances",
            "reason": (
                "Stock-On-Hand (SOH), opening/closing stock quantities, and inventory valuation require physical stock snapshot feeds. "
                "These are unavailable in the current POS sales ledger dataset."
            ),
            "sql_comment": "-- Metric Unavailable: Inventory levels require physical SOH snapshot feeds\n-- Current active warehouse schema provides verified POS retail sales ledger records."
        }

    # 4. Inventory-Based Recommendations
    if any(k in p for k in ["reorder recommendation", "transfer recommendation", "markdown recommendation", "stock rebalance"]):
        return {
            "metric": "Inventory-Based Optimization Recommendations",
            "reason": (
                "Purchase reorders, inter-store transfers, and dynamic price markdowns require physical stock-on-hand balances "
                "and minimum/maximum cover thresholds, which are unavailable in the current POS sales ledger dataset."
            ),
            "sql_comment": "-- Metric Unavailable: AI Recommendations require Stock-On-Hand (SOH) feeds\n-- Current active warehouse schema provides verified POS retail sales ledger records."
        }

    return None


@router.post("/query", response_model=StandardResponse[ChatQueryResponse])
def process_chat_query(
    request: ChatQueryRequest,
    db: DuckDBPyConnection = Depends(get_db)
):
    """
    Main GenBI Query Endpoint:
      1. Translates user business question into Analytical SQL via Groq API & Wren AI Context.
      2. Detects requests for unsupported inventory/SOH metrics to prevent data fabrication.
      3. Validates SQL & executes with auto-refinement syntax repair loop against warehouse.
      4. Classifies visualization type (KPI_CARD, PIE_CHART, BAR_CHART, DATA_TABLE).
      5. Synthesizes executive summary.
    """
    user_prompt = request.prompt.strip()
    if not user_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt text cannot be empty."
        )

    # Check for unsupported inventory/SOH metrics to prevent hallucination or fabrication
    unsupported = detect_unsupported_inventory_metric(user_prompt)
    if unsupported:
        summary_msg = (
            f"ℹ️ **{unsupported['metric']} is unavailable in the current dataset.**\n\n"
            f"{unsupported['reason']}\n\n"
            "To maintain analytical integrity, Wren AI does not fabricate inventory data.\n\n"
            "**Supported metrics and analyses in MB-OLAP V2:**\n"
            "• **Net Sales Revenue** (`SUM(net_amount)` = ₹331,367,606)\n"
            "• **Sales Units** (`SUM(sales_quantity)` = 1,234,990 units)\n"
            "• **Cost of Goods Sold (COGS)** (`SUM(cogs)` = ₹190,626,225)\n"
            "• **Gross Profit** (`SUM(gross_profit)` = ₹140,741,381 | 42.47% GM)\n"
            "• **Average Selling Price (ASP)**\n"
            "• **Monthly Sales Trends by Report Date**\n"
            "• **Store Rankings & Outlet Performance**\n"
            "• **Product, Department, Division & Vendor Sales**"
        )
        return StandardResponse(
            success=True,
            message=f"{unsupported['metric']} is unsupported due to missing SOH inventory data.",
            data=ChatQueryResponse(
                prompt=user_prompt,
                generated_sql=unsupported["sql_comment"],
                visualization_type="TEXT_ONLY",
                summary=summary_msg,
                columns=[],
                data=[],
                record_count=0
            ),
            supported=False
        )


    try:
        # Step 1: Generate SQL from natural language prompt
        initial_sql = groq_service.generate_sql(user_prompt)
        initial_sql = groq_service.fix_union_order_by(initial_sql)

        # Step 2: Validate security, append limits, execute & auto-refine if syntax error occurs
        executed_sql, columns, data = sql_validator.execute_with_auto_refinement(
            db=db,
            initial_sql=initial_sql,
            user_prompt=user_prompt
        )

        # Step 2b: Self-Healing Zero-Result Repair (from sample_server_v1.py)
        # If query returns 0 rows and isn't an explicit "zero sales/dead stock" query,
        # extract entities via LLM, search DuckDB for candidates, and repair SQL.
        from backend.app.services.entity_extractor import (
            extract_entities_with_llm,
            search_entity_candidates,
            should_attempt_zero_result_repair
        )

        if not data and should_attempt_zero_result_repair(user_prompt):
            entity_phrases = extract_entities_with_llm(groq_service, user_prompt)
            if entity_phrases:
                candidates = search_entity_candidates(db, entity_phrases)
                if candidates:
                    repaired_sql = groq_service.generate_zero_result_repair_sql(
                        user_prompt, executed_sql, entity_phrases, candidates
                    )
                    try:
                        rep_sql, rep_cols, rep_data = sql_validator.execute_with_auto_refinement(
                            db=db,
                            initial_sql=repaired_sql,
                            user_prompt=user_prompt,
                            max_attempts=1
                        )
                        if rep_data:
                            executed_sql, columns, data = rep_sql, rep_cols, rep_data
                    except Exception as rep_err:
                        print(f"[CHAT_PIPELINE] Zero-result repair attempt failed: {rep_err}")

        # Step 3: Classify visualization type
        viz_type = chart_classifier.classify(columns, data)

        # Step 4: Synthesize natural language executive summary
        summary = groq_service.generate_summary(user_prompt, executed_sql, data)

        response_payload = ChatQueryResponse(
            prompt=user_prompt,
            generated_sql=executed_sql,
            visualization_type=viz_type,
            summary=summary,
            columns=columns,
            data=data,
            record_count=len(data)
        )

        return StandardResponse(
            success=True,
            message="Query executed successfully",
            data=response_payload
        )

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Semantic Query Engine Error: {str(e)}"
        )

@router.get("/suggested-prompts", response_model=StandardResponse[List[SuggestedPrompt]])
def get_suggested_prompts():
    """
    Returns curated quick-prompt suggestion pills for the chatbot UI interface.
    """
    suggestions = [
        SuggestedPrompt(id=1, category="Revenue & Store Sales", prompt="What are the top 5 departments by net sales revenue?"),
        SuggestedPrompt(id=2, category="Store Performance", prompt="Show revenue and gross profit margin percentage across all retail stores"),
        SuggestedPrompt(id=3, category="Vendor Analytics", prompt="Which vendors have the highest GMROI?"),
        SuggestedPrompt(id=4, category="Sell-Through & Inventory", prompt="What is the sell-through percentage by division?"),
        SuggestedPrompt(id=5, category="Stock & Cover", prompt="What is the closing stock valuation and weeks of cover for Store 6?"),
        SuggestedPrompt(id=6, category="Item Insights", prompt="List top 10 items by sales volume units"),
        SuggestedPrompt(id=7, category="Distribution Center", prompt="Show total revenue generated in Central Warehouse versus Retail Stores"),
        SuggestedPrompt(id=8, category="Trends", prompt="Show monthly sales trend by report date")
    ]
    return StandardResponse(success=True, data=suggestions)
