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

@router.post("/query", response_model=StandardResponse[ChatQueryResponse])
def process_chat_query(
    request: ChatQueryRequest,
    db: DuckDBPyConnection = Depends(get_db)
):
    """
    Main GenBI Query Endpoint:
      1. Translates user business question into DuckDB SQL via Groq API & Wren AI Context.
      2. Validates SQL & executes with auto-refinement syntax repair loop against DuckDB.
      3. Classifies visualization type (KPI_CARD, PIE_CHART, BAR_CHART, DATA_TABLE).
      4. Synthesizes executive summary.
    """
    user_prompt = request.prompt.strip()
    if not user_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt text cannot be empty."
        )

    try:
        # Step 1: Generate SQL from natural language prompt
        initial_sql = groq_service.generate_sql(user_prompt)

        # Step 2: Validate security, append limits, execute & auto-refine if syntax error occurs
        executed_sql, columns, data = sql_validator.execute_with_auto_refinement(
            db=db,
            initial_sql=initial_sql,
            user_prompt=user_prompt
        )

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
