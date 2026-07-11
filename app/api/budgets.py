from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.schemas.schemas import BudgetCreate, BudgetOut
from app.models.models import Budget, Expense, User
from app.core.config import get_current_user

router = APIRouter()

@router.post("/", response_model=BudgetOut, status_code=201)
def create_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    existing = db.query(Budget).filter(Budget.month == budget.month, Budget.category == budget.category).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists for this month/category")

    db_budget = Budget(**budget.dict(), user_id=1)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/", response_model=list[BudgetOut])
def get_budgets(month: str = None, db: Session = Depends(get_db)):
    query = db.query(Budget)
    if month:
        query = query.filter(Budget.month == month)
    budgets = query.all()
    results = []

    for b in budgets:
        year, mon = map(int, b.month.split('-'))
        start_date = f"{b.month}-01"
        end_date = f"{year}-{mon+1:02d}-01" if mon < 12 else f"{year+1}-01-01"
        used = db.query(func.sum(Expense.amount)).filter(
            Expense.category == b.category,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar() or 0.0
        results.append(BudgetOut(
            id=b.id, month=b.month, category=b.category, budget_amount=b.budget_amount,
            used_amount=used, remaining_amount=b.budget_amount - used,
            percentage_consumed=round((used / b.budget_amount) * 100, 2) if b.budget_amount > 0 else 0
        ))
    return results