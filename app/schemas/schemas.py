from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional
from pydantic import ConfigDict

# ==========================================
# AUTH SCHEMAS
# ==========================================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    # In Pydantic V2, we use ConfigDict instead of class Config: orm_mode = True
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ==========================================
# EXPENSE SCHEMAS
# ==========================================

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None
    expense_date: date

class ExpenseOut(BaseModel):
    id: int
    amount: float
    category: str
    description: Optional[str]
    expense_date: date
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# BUDGET SCHEMAS
# ==========================================

class BudgetCreate(BaseModel):
    month: str  # Format: "YYYY-MM"
    category: str
    budget_amount: float

class BudgetOut(BaseModel):
    id: int
    month: str
    category: str
    budget_amount: float
    # These fields are calculated dynamically in the service/router layer
    used_amount: float = 0.0
    remaining_amount: float = 0.0
    percentage_consumed: float = 0.0
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# DASHBOARD SCHEMAS
# ==========================================

class MonthlySummary(BaseModel):
    month: str
    total_expenses: float
    total_budget: float