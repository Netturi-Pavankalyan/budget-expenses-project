from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import AccountCreate, AccountUpdate, AccountOut
from app.models.models import Account, User
from app.core.config import get_current_user

router = APIRouter()

@router.get("/", response_model=list[AccountOut])
def get_accounts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Account)
        .filter(Account.user_id == user.id)
        .order_by(Account.created_at.asc())
        .all()
    )

@router.post("/", response_model=AccountOut, status_code=201)
def add_account(account: AccountCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_account = Account(**account.dict(), user_id=user.id)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    account: AccountUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == user.id
    ).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")

    for field, value in account.dict(exclude_unset=True).items():
        setattr(db_account, field, value)

    db.commit()
    db.refresh(db_account)
    return db_account

@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == user.id
    ).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(db_account)
    db.commit()