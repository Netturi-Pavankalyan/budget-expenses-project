from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from app.db.database import get_db
from app.schemas.schemas import ExpenseCreate, ExpenseOut
from app.models.models import Expense, User
from app.core.config import get_current_user

router = APIRouter()

@router.post("/", response_model=ExpenseOut, status_code=201)
def add_expense(expense: ExpenseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_expense = Expense(**expense.dict(), user_id=user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/", response_model=list[ExpenseOut])
def get_expenses(
    category: str = Query(None),
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user) # MUST BE HERE
):
    query = db.query(Expense).filter(Expense.user_id == user.id)
    if category:
        query = query.filter(Expense.category == category)
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
    return query.order_by(Expense.expense_date.desc()).all()

@router.delete("/clear-all", status_code=200)
def clear_all_expenses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Deletes every expense belonging to the current user. Used by the
    'Clear All' button on the Expenses page. Does not touch budgets —
    once the expenses are gone, used_amount for every budget naturally
    goes back to 0 the next time budgets are fetched."""
    deleted = db.query(Expense).filter(Expense.user_id == user.id).delete()
    db.commit()
    return {"deleted": deleted}

@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()