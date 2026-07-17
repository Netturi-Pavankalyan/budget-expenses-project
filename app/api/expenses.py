from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import date
from app.db.database import get_db
from app.schemas.schemas import ExpenseCreate, ExpenseOut
from app.models.models import Expense, User, Account
from app.core.config import get_current_user

router = APIRouter()

@router.post("/", response_model=ExpenseOut, status_code=201)
def add_expense(expense: ExpenseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    account = None
    if expense.account_id:
        account = db.query(Account).filter(
            Account.id == expense.account_id, Account.user_id == user.id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
    elif not expense.category:
        # Not paid from a linked account, so it needs a budget category
        # (this is the "Others" flow in the Add Expense form).
        raise HTTPException(status_code=422, detail="Choose an account or a category.")

    db_expense = Expense(**expense.dict(), user_id=user.id)
    db.add(db_expense)

    if account:
        account.balance -= expense.amount

    try:
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        # Surfaces as a real, visible error instead of the request just
        # dying with no response — if this ever fires, it means the
        # database schema is out of sync with the app (e.g. a column the
        # app expects doesn't exist on this database yet).
        raise HTTPException(status_code=500, detail=f"Database error while saving expense: {e}")

    db.refresh(db_expense)

    result = ExpenseOut.model_validate(db_expense)
    if account:
        result.account_name = account.name
    return result

@router.get("/", response_model=list[ExpenseOut])
def get_expenses(
    category: str = Query(None),
    month: str = Query(None, description="Filter to a single month, e.g. '2026-08'"),
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user) # MUST BE HERE
):
    query = db.query(Expense).filter(Expense.user_id == user.id)
    if category:
        query = query.filter(Expense.category == category)
    if month:
        year, mon = map(int, month.split("-"))
        start_date = date(year, mon, 1)
        end_date = date(year + 1, 1, 1) if mon == 12 else date(year, mon + 1, 1)
        query = query.filter(Expense.expense_date >= start_date, Expense.expense_date < end_date)
    else:
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
    rows = query.order_by(Expense.expense_date.desc()).all()

    results = []
    for row in rows:
        item = ExpenseOut.model_validate(row)
        if row.account:
            item.account_name = row.account.name
        results.append(item)
    return results

@router.delete("/clear-all", status_code=200)
def clear_all_expenses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Deletes every expense belonging to the current user. Used by the
    'Clear All' button on the Expenses page. Any expense that was paid from
    a linked account has its amount refunded back to that account's balance
    first, so balances stay accurate — and budgets naturally go back to $0
    the next time they're fetched."""
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    for exp in expenses:
        if exp.account_id:
            account = db.query(Account).filter(Account.id == exp.account_id).first()
            if account:
                account.balance += exp.amount
    deleted = len(expenses)
    db.query(Expense).filter(Expense.user_id == user.id).delete()
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
    if expense.account_id:
        account = db.query(Account).filter(Account.id == expense.account_id).first()
        if account:
            account.balance += expense.amount
    db.delete(expense)
    db.commit()