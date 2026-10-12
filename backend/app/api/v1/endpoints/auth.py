import os
import json
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from backend.app.schemas.response import StandardResponse

router = APIRouter()

# Persistent storage file for staff accounts
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../db"))
STAFF_STORAGE_FILE = os.path.join(DATA_DIR, "staff_accounts.json")


def _ensure_storage_exists():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(STAFF_STORAGE_FILE):
        # Initialize with default staff accounts so manager can test immediately
        default_accounts = [
            {
                "id": "staff-001",
                "name": "Rahul Sharma",
                "email": "rahul.staff@mbaazar.in",
                "password": "staffpassword123",
                "role": "Staff",
                "store": "M Baazar - Howrah (#820)",
                "created_at": "2026-10-01 10:00:00"
            },
            {
                "id": "staff-002",
                "name": "Priya Roy",
                "email": "priya.staff@mbaazar.in",
                "password": "mbaazarstaff2026",
                "role": "Staff",
                "store": "M Baazar - Andul (#530)",
                "created_at": "2026-10-02 11:30:00"
            }
        ]
        with open(STAFF_STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(default_accounts, f, indent=2)


def _load_staff_accounts() -> List[dict]:
    _ensure_storage_exists()
    try:
        with open(STAFF_STORAGE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading staff accounts: {e}")
        return []


def _save_staff_accounts(accounts: List[dict]):
    _ensure_storage_exists()
    with open(STAFF_STORAGE_FILE, "w", encoding="utf-8") as f:
        json.dump(accounts, f, indent=2)


# Pydantic Schemas
class StaffCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Staff member full name")
    email: str = Field(..., description="Staff member email address")
    password: str = Field(..., min_length=4, description="Staff login password")
    store: Optional[str] = Field("All Outlets", description="Assigned store or department")


class LoginRequest(BaseModel):
    role: str = Field("Manager", description="'Manager' or 'Staff'")
    email: Optional[str] = Field(None, description="Required for Staff login")
    password: Optional[str] = Field(None, description="Required for Staff login")


class UserResponse(BaseModel):
    role: str
    name: str
    email: Optional[str] = None
    store: Optional[str] = None


@router.post("/login", response_model=StandardResponse[dict], tags=["Authentication"])
def login(payload: LoginRequest):
    """
    Role-based authentication:
    - Manager: Simply logs in directly as 'Manager' (no email or password required as per user specs).
    - Staff: Authenticates against staff accounts created by Manager in Settings.
    """
    role_norm = payload.role.strip().capitalize()

    if role_norm == "Manager" or role_norm == "Admin":
        # Manager login succeeds directly
        return StandardResponse(
            success=True,
            message="Manager login successful",
            data={
                "role": "Manager",
                "name": "Retail Operations Manager",
                "email": "manager@mbaazar.in",
                "store": "Headquarters (All Outlets)",
                "token": "mgr-session-token-live"
            }
        )

    if role_norm == "Staff":
        if not payload.email or not payload.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff login requires both Email and Password."
            )

        email_clean = payload.email.strip().lower()
        password_clean = payload.password.strip()

        accounts = _load_staff_accounts()
        matched = None
        for acc in accounts:
            if acc["email"].strip().lower() == email_clean and acc["password"] == password_clean:
                matched = acc
                break

        if not matched:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid staff credentials. Please check your email/password or ask your Manager to add your account in Settings."
            )

        return StandardResponse(
            success=True,
            message=f"Welcome back, {matched['name']}!",
            data={
                "id": matched["id"],
                "role": "Staff",
                "name": matched["name"],
                "email": matched["email"],
                "store": matched.get("store", "All Outlets"),
                "token": f"staff-session-{matched['id']}"
            }
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown role '{payload.role}'. Must be Manager or Staff."
    )


@router.get("/staff", response_model=StandardResponse[List[dict]], tags=["Staff Management"])
def list_staff_accounts():
    """
    Returns list of all staff accounts created by Manager.
    """
    accounts = _load_staff_accounts()
    return StandardResponse(
        success=True,
        message=f"Retrieved {len(accounts)} staff accounts",
        data=accounts
    )


@router.post("/staff", response_model=StandardResponse[dict], tags=["Staff Management"])
def create_staff_account(payload: StaffCreateRequest):
    """
    Manager adds a new staff account with name, email, password, and assigned store.
    """
    email_clean = payload.email.strip().lower()
    accounts = _load_staff_accounts()

    # Check for duplicate email
    for acc in accounts:
        if acc["email"].strip().lower() == email_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A staff account with email '{email_clean}' already exists."
            )

    new_staff = {
        "id": f"staff-{uuid.uuid4().hex[:8]}",
        "name": payload.name.strip(),
        "email": email_clean,
        "password": payload.password.strip(),
        "role": "Staff",
        "store": (payload.store or "All Outlets").strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    accounts.append(new_staff)
    _save_staff_accounts(accounts)

    return StandardResponse(
        success=True,
        message=f"Staff account for {new_staff['name']} created successfully!",
        data=new_staff
    )


@router.delete("/staff/{staff_id}", response_model=StandardResponse[dict], tags=["Staff Management"])
def delete_staff_account(staff_id: str):
    """
    Manager deletes a staff account.
    """
    accounts = _load_staff_accounts()
    filtered = [acc for acc in accounts if acc["id"] != staff_id]

    if len(filtered) == len(accounts):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff account ID '{staff_id}' not found."
        )

    _save_staff_accounts(filtered)
    return StandardResponse(
        success=True,
        message=f"Staff account '{staff_id}' deleted successfully.",
        data={"deleted_id": staff_id}
    )
