from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session  # <-- THIS IS THE MISSING IMPORT
from app.db.database import get_db
from app.models.models import User
from app.core.config import get_current_user
from app.services.calendar_service import get_auth_url, handle_oauth_callback

router = APIRouter()

class CallbackData(BaseModel):
    code: str

@router.get("/connect")
def connect_calendar(user: User = Depends(get_current_user)):
    """Returns the URL the user must visit to authorize Google Calendar"""
    url = get_auth_url(user.id)
    return {"authorization_url": url}

@router.post("/callback")
def callback(data: CallbackData, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Exchanges the code from Google for a refresh token and saves it"""
    success = handle_oauth_callback(data.code, user, db)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to connect Google Calendar")
    return {"message": "Google Calendar connected successfully!"}