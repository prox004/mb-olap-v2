from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.app.api.deps import get_clickhouse_db
from backend.app.schemas.response import StandardResponse
from backend.app.services.analytics_agent import analytics_agent

router = APIRouter()

class ChatQueryRequest(BaseModel):
    prompt: str
    conversation_history: Optional[List[Dict[str, str]]] = None

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


def detect_unsupported_metric(prompt: str, dialect: str = "clickhouse") -> Optional[Dict[str, str]]:
    """
    Checks if a prompt asks for metrics or data streams that are not available in the ClickHouse warehouse.
    Truly unavailable data: CRM/loyalty customer details, footfall traffic sensors, payroll/rent OpEx,
    web clickstream, vendor fill rates, vendor returns (RTV), daily inventory history, and markdown schedules.
    """
    p = prompt.lower()

    # 1. Customer CRM / Loyalty / Personal shopper records
    if any(k in p for k in [
        "customer name", "customer phone", "customer email", "customer address",
        "loyalty card", "loyalty member", "customer retention", "churn rate",
        "customer ltv", "lifetime value", "shopper demographic", "customer profile"
    ]):
        return {
            "metric": "Customer CRM & Loyalty Analytics",
            "reason": (
                "Customer-level CRM records (such as individual shopper names, loyalty card numbers, "
                "customer contact info, retention metrics, and churn rates) are not captured in the "
                "merchandising and retail transaction ledger of mb_olap_v2."
            ),
            "sql_comment": "-- Metric Unavailable: Customer CRM & loyalty profiles are not captured in mb_olap_v2.\n-- mb_olap_v2 provides verified retail sales, product performance, store analytics, and inventory snapshots."
        }

    # 2. Footfall / Store Traffic Sensors
    if any(k in p for k in [
        "footfall", "foot traffic", "visitor count", "store traffic",
        "sensor count", "walk-in count", "conversion rate from footfall"
    ]):
        return {
            "metric": "Store Footfall & Traffic Analytics",
            "reason": (
                "Physical store footfall counters, sensor tracking, and footfall-to-sales conversion rates "
                "are not integrated into the mb_olap_v2 warehouse."
            ),
            "sql_comment": "-- Metric Unavailable: Footfall sensor feeds are not integrated into mb_olap_v2.\n-- mb_olap_v2 provides POS sales transactions, margins, and stock on hand."
        }

    # 3. Store Rent, Payroll, Electricity, OpEx
    if any(k in p for k in [
        "payroll", "staff salary", "employee wage", "store rent", "lease cost",
        "electricity bill", "utility expense", "opex", "operating expense"
    ]):
        return {
            "metric": "Operating Expenses & Payroll",
            "reason": (
                "Store lease/rent overheads, utility bills, and staff payroll operational expenses (OpEx) "
                "are corporate financial accounting feeds not present in mb_olap_v2 merchandise OLAP."
            ),
            "sql_comment": "-- Metric Unavailable: Store OpEx and payroll are not captured in mb_olap_v2.\n-- mb_olap_v2 provides sales revenue, COGS, gross margin, and stock snapshots."
        }

    # 4. E-commerce Clickstream & Web Analytics
    if any(k in p for k in [
        "clickstream", "website visit", "cart abandonment", "pageview",
        "bounce rate", "web traffic", "online session"
    ]):
        return {
            "metric": "E-Commerce Clickstream & Web Analytics",
            "reason": (
                "Web clickstream, browsing sessions, online cart abandonment, and digital web traffic "
                "telemetry are not present in mb_olap_v2."
            ),
            "sql_comment": "-- Metric Unavailable: Web clickstream and digital telemetry are not present in mb_olap_v2.\n-- mb_olap_v2 provides brick-and-mortar retail transactions and stock snapshots."
        }

    # 5. Vendor Fill Rate & Supplier Lead Times
    if any(k in p for k in ["fill rate", "vendor fill", "supplier fill", "lead time", "supplier delivery"]):
        return {
            "metric": "Vendor Fill Rate & Supplier Lead Times",
            "reason": (
                "Supplier delivery performance, lead-time tracking, and vendor fill rates require Purchase Order "
                "fulfillment schedules and goods-inward receipt logs not present in the merchandise OLAP schema of mb_olap_v2."
            ),
            "sql_comment": "-- Metric Unavailable: Supplier fill rates and lead times are not captured in mb_olap_v2."
        }

    # 6. Vendor Returns (RTV)
    if any(k in p for k in ["vendor return", "return to vendor", "rtv rate"]):
        return {
            "metric": "Vendor Returns (RTV)",
            "reason": (
                "Return-To-Vendor (RTV) manifests and supplier debit notes are corporate supply-chain accounting documents "
                "not captured in mb_olap_v2."
            ),
            "sql_comment": "-- Metric Unavailable: Vendor returns (RTV) are not captured in mb_olap_v2."
        }

    # 7. Daily Inventory History
    if any(k in p for k in ["daily stock", "daily inventory", "stock on day", "inventory on day", "intraday stock"]):
        return {
            "metric": "Daily Inventory History",
            "reason": (
                "Inventory snapshots in mb_olap_v2 are recorded at monthly accounting intervals (fact_inventory). "
                "Daily stock level history is not tracked in the current warehouse."
            ),
            "sql_comment": "-- Metric Unavailable: Daily stock history is not tracked; stock is recorded at monthly snapshot grain."
        }

    # 8. Promotional Markdown Schedules & Price Elasticity
    if any(k in p for k in ["markdown schedule", "discount history", "clearance schedule", "price elasticity", "discount percentage", "discount applied", "sale discount"]):
        return {
            "metric": "Discount Schedules & Price Elasticity",
            "reason": (
                "Individual transaction line discount percentages, promotional markdown calendars, and price elasticity modeling require marketing campaign feeds "
                "not integrated into mb_olap_v2."
            ),
            "sql_comment": "-- Metric Unavailable: Individual transaction discount percentages and markdown schedules are not captured in mb_olap_v2."
        }

    return None


@router.post("/query", response_model=StandardResponse[ChatQueryResponse])
def process_chat_query(
    request: ChatQueryRequest,
    db: Any = Depends(get_clickhouse_db)
):
    """
    Main GenBI Query Endpoint:
      1. Detects requests for unsupported warehouse metrics to maintain analytical integrity.
      2. Routes through the agentic ConversationalAnalyticsAgent powered by ClickHouse.
      3. Uses agent tools (get_schema, describe_object, execute_readonly_sql, inspect_result).
      4. Validates security, limit caps, and driver timeouts.
      5. Synthesizes an executive grounded summary with structured data visualization.
    """
    user_prompt = request.prompt.strip()
    if not user_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt text cannot be empty."
        )

    # Check for unsupported metrics to prevent hallucination or fabrication
    unsupported = detect_unsupported_metric(user_prompt, dialect="clickhouse")
    if unsupported:
        summary_msg = (
            f"ℹ️ **{unsupported['metric']} is unavailable in the current dataset.**\n\n"
            f"{unsupported['reason']}\n\n"
            f"To maintain analytical integrity, Wren AI does not fabricate unsupported data.\n\n"
            f"**Supported metrics and analyses in MB-OLAP V2 (Clickhouse):**\n"
            "• **Net Sales Revenue** (`round(sum(net_amount), 2)`)\n"
            "• **Sales Units** (`sum(bill_qty)`)\n"
            "• **Cost of Goods Sold (COGS)** (`sum(cogs)`)\n"
            "• **Gross Profit & Margin %** (`sum(gross_profit)`, `gross_margin_pct`)\n"
            "• **Monthly Sales Trends** (`v_monthly_sales_trend`)\n"
            "• **Store Rankings & Outlet Performance** (`v_store_performance_summary`)\n"
            "• **Category & Department Summaries** (`v_category_performance_summary`)\n"
            "• **Stock Valuation & Closing Stock** (`v_fact_inventory_enriched`)\n"
            "• **Product, Brand & Vendor Sales** (`v_fact_sales_enriched`)"
        )
        return StandardResponse(
            success=True,
            message=f"{unsupported['metric']} is not available in the active warehouse schema.",
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
        agent_res = analytics_agent.run(
            db=db,
            user_prompt=user_prompt,
            conversation_history=request.conversation_history,
            dialect="clickhouse"
        )

        if not agent_res.supported:
            return StandardResponse(
                success=True,
                message=agent_res.summary,
                data=ChatQueryResponse(
                    prompt=user_prompt,
                    generated_sql=agent_res.generated_sql,
                    visualization_type="TEXT_ONLY",
                    summary=agent_res.summary,
                    columns=[],
                    data=[],
                    record_count=0
                ),
                supported=False
            )

        return StandardResponse(
            success=True,
            message="Query executed successfully",
            data=ChatQueryResponse(
                prompt=user_prompt,
                generated_sql=agent_res.generated_sql,
                visualization_type=agent_res.visualization_type,
                summary=agent_res.summary,
                columns=agent_res.columns,
                data=agent_res.data,
                record_count=agent_res.record_count
            ),
            supported=True
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
