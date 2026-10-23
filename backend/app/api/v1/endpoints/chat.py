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
            "metric": "Customer CRM & Loyalty Records",
            "reason": (
                "Individual customer contact details (such as shopper names, phone numbers, email addresses, "
                "loyalty points, and retention rates) are kept in private customer databases and are not "
                "part of this sales and inventory dashboard."
            ),
            "sql_comment": "-- Metric Unavailable: Individual customer profiles are stored in external customer management systems.\n-- This assistant provides store sales, stock availability, and branch performance."
        }

    # 2. Footfall / Store Traffic Sensors
    if any(k in p for k in [
        "footfall", "foot traffic", "visitor count", "store traffic",
        "sensor count", "walk-in count", "conversion rate from footfall"
    ]):
        return {
            "metric": "Store Footfall & Visitor Counters",
            "reason": (
                "Physical store visitor counters and walk-in sensor feeds are not connected to "
                "this retail portal."
            ),
            "sql_comment": "-- Metric Unavailable: Store footfall sensors are not connected to this portal.\n-- This assistant provides registered billing sales and inventory levels."
        }

    # 3. Store Rent, Payroll, Electricity, OpEx
    if any(k in p for k in [
        "payroll", "staff salary", "employee wage", "store rent", "lease cost",
        "electricity bill", "utility expense", "opex", "operating expense"
    ]):
        return {
            "metric": "Operating Expenses & Staff Payroll",
            "reason": (
                "Store rent, utility bills, and employee salary expenses are handled in "
                "separate corporate finance accounts rather than retail merchandise tracking."
            ),
            "sql_comment": "-- Metric Unavailable: Store lease and payroll expenses are kept in external corporate accounting."
        }

    # 4. E-commerce Clickstream & Web Analytics
    if any(k in p for k in [
        "clickstream", "website visit", "cart abandonment", "pageview",
        "bounce rate", "web traffic", "online session"
    ]):
        return {
            "metric": "Online Website & Web Traffic",
            "reason": (
                "Online website browsing, shopping carts, and website visits are managed on "
                "web platforms and are not linked to physical store retail numbers."
            ),
            "sql_comment": "-- Metric Unavailable: Online website traffic is managed on separate e-commerce platforms."
        }

    # 5. Vendor Fill Rate & Supplier Lead Times
    if any(k in p for k in ["fill rate", "vendor fill", "supplier fill", "lead time", "supplier delivery"]):
        return {
            "metric": "Supplier Delivery Schedules & Fill Rates",
            "reason": (
                "Supplier delivery schedules and order receipt logs are not currently loaded into this portal."
            ),
            "sql_comment": "-- Metric Unavailable: Supplier delivery schedules are not captured here."
        }

    # 6. Vendor Returns (RTV)
    if any(k in p for k in ["vendor return", "return to vendor", "rtv rate"]):
        return {
            "metric": "Vendor Returns (RTV)",
            "reason": (
                "Return-To-Vendor records and supplier debit notes are currently kept in external supply chain files."
            ),
            "sql_comment": "-- Metric Unavailable: Vendor returns are tracked in external supply chain logs."
        }

    # 7. Daily Inventory History
    if any(k in p for k in ["daily stock", "daily inventory", "stock on day", "inventory on day", "intraday stock"]):
        return {
            "metric": "Daily Historical Stock Balances",
            "reason": (
                "Store stock is updated at regular monthly inventory audits. Day-by-day historical stock balances are not stored in this view."
            ),
            "sql_comment": "-- Metric Unavailable: Stock is recorded at monthly audit snapshot intervals."
        }

    # 8. Promotional Markdown Schedules & Price Elasticity
    if any(k in p for k in ["markdown schedule", "discount history", "clearance schedule", "price elasticity", "discount percentage", "discount applied", "sale discount"]):
        return {
            "metric": "Discount Coupons & Markdown Schedules",
            "reason": (
                "Promotional coupon schedules and clearance discount campaigns are managed in external marketing files."
            ),
            "sql_comment": "-- Metric Unavailable: Promotional coupon schedules are not tracked in this sales summary."
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
            f"ℹ️ **{unsupported['metric']} is not available in your current business data.**\n\n"
            f"{unsupported['reason']}\n\n"
            f"Your assistant only provides verified numbers from your actual store sales and inventory records.\n\n"
            f"**Key reports and questions you can ask anytime:**\n"
            "• **Total Sales & Revenue** (Daily, Monthly, or Year-to-Date)\n"
            "• **Units Sold & Customer Orders**\n"
            "• **Profit & Margin Percentage** across products and stores\n"
            "• **Store Comparisons & Branch Rankings**\n"
            "• **Category & Department Performance** (Men's, Women's, Kids, etc.)\n"
            "• **Inventory & Current Stock Value**\n"
            "• **Top Selling Items, Brands & Suppliers**"
        )
        return StandardResponse(
            success=True,
            message=f"{unsupported['metric']} is not available in the active business records.",
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
            dialect="clickhouse",
            allow_emergency_fallback=True
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
        SuggestedPrompt(id=1, category="Executive Summary", prompt="Show an executive summary of monthly sales performance"),
        SuggestedPrompt(id=2, category="Store Rankings", prompt="Compare total sales and profits across all stores"),
        SuggestedPrompt(id=3, category="Top Departments", prompt="Which departments generate the highest sales?"),
        SuggestedPrompt(id=4, category="Profitability", prompt="Show total sales and profit margins across all retail branches"),
        SuggestedPrompt(id=5, category="Stock Overview", prompt="What is our current stock valuation and weeks of cover?"),
        SuggestedPrompt(id=6, category="Supplier Return", prompt="Which suppliers deliver the best profit return on stock (GMROI)?"),
        SuggestedPrompt(id=7, category="Sell-Through", prompt="Show the sales sell-through percentage by department"),
        SuggestedPrompt(id=8, category="Store Stock", prompt="What is the current stock value and supply cover for Store 6?"),
        SuggestedPrompt(id=9, category="Top Products", prompt="List top 10 best-selling items by quantity sold"),
        SuggestedPrompt(id=10, category="Sales Trends", prompt="Show our month-by-month sales trend")
    ]
    return StandardResponse(success=True, data=suggestions)
