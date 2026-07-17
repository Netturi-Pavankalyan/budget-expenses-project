from pydantic import BaseModel, EmailStr, field_validator
from datetime import date
from typing import Optional
from pydantic import ConfigDict
import re

MONTH_RE = re.compile(r"^(\d{4})-(\d{1,2})$")

def normalize_month(value: str) -> str:
    """Normalize 'YYYY-M' or 'YYYY-MM' -> 'YYYY-MM', raise if invalid."""
    if not isinstance(value, str):
        raise ValueError("month must be a string in 'YYYY-MM' format")
    match = MONTH_RE.match(value.strip())
    if not match:
        raise ValueError("month must be in 'YYYY-MM' format, e.g. '2026-03'")
    year, mon = match.groups()
    mon_int = int(mon)
    if not (1 <= mon_int <= 12):
        raise ValueError("month segment must be between 01 and 12")
    return f"{year}-{mon_int:02d}"

# AUTH
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginUser(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# EXPENSES
class ExpenseCreate(BaseModel):
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    expense_date: date
    account_id: Optional[int] = None  # set when paid from a linked bank account

class ExpenseOut(BaseModel):
    id: int
    amount: float
    category: Optional[str]
    description: Optional[str]
    expense_date: date
    account_id: Optional[int] = None
    account_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# BUDGETS
class BudgetCreate(BaseModel):
    month: str
    category: str
    budget_amount: float

    @field_validator("month")
    @classmethod
    def _normalize_month(cls, v: str) -> str:
        return normalize_month(v)

class BudgetOut(BaseModel):
    id: int
    month: str
    category: str
    budget_amount: float
    used_amount: float = 0.0
    remaining_amount: float = 0.0
    percentage_consumed: float = 0.0
    model_config = ConfigDict(from_attributes=True)

# DASHBOARD
class MonthlySummary(BaseModel):
    month: str
    total_expenses: float
    total_budget: float

# ACCOUNTS
ACCOUNT_TYPES = {"Checking", "Savings", "Credit", "Investment", "Other"}

class AccountCreate(BaseModel):
    name: str
    bank: str
    type: str
    balance: float = 0.0

    @field_validator("type")
    @classmethod
    def _valid_type(cls, v: str) -> str:
        if v not in ACCOUNT_TYPES:
            raise ValueError(f"type must be one of {sorted(ACCOUNT_TYPES)}")
        return v

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    bank: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None

    @field_validator("type")
    @classmethod
    def _valid_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ACCOUNT_TYPES:
            raise ValueError(f"type must be one of {sorted(ACCOUNT_TYPES)}")
        return v

class AccountOut(BaseModel):
    id: int
    name: str
    bank: str
    type: str
    balance: float
    model_config = ConfigDict(from_attributes=True)