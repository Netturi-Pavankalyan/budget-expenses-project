import os
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.models.models import User
from sqlalchemy.orm import Session

# You must download this from Google Cloud Console and put it in your root folder
CLIENT_SECRETS_FILE = "credentials.json" 
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

def get_auth_url(user_id: int) -> str:
    # In a real app, you'd pass a state parameter containing the user_id to verify later
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES)
    flow.redirect_uri = "http://localhost:8000/calendar/callback" # Postman/Swagger fallback
    auth_url, _ = flow.authorization_url(prompt='consent')
    return auth_url

def handle_oauth_callback(code: str, user: User, db: Session) -> bool:
    try:
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES)
        flow.redirect_uri = "http://localhost:8000/calendar/callback"
        flow.fetch_token(code=code)
        
        # Save the refresh token to the database
        user.google_refresh_token = flow.credentials.refresh_token
        db.commit()
        return True
    except Exception as e:
        print(f"OAuth Error: {e}")
        return False

def create_calendar_event(user: User, title: str, amount: float, due_date: str):
    if not user.google_refresh_token:
        raise Exception("User has not connected Google Calendar")
        
    creds = Credentials(
        token=None,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES
    )
    
    # Auto-refreshes the token
    creds.refresh(Request())
    service = build('calendar', 'v3', credentials=creds)
    
    event = {
        'summary': f'Pay {title} - ${amount}',
        'start': {'date': due_date},
        'end': {'date': due_date},
        'reminders': {'useDefault': True},
    }
    
    created_event = service.events().insert(calendarId='primary', body=event).execute()
    return created_event.get('id')