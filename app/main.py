from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, expenses, budgets, dashboard, reports, calendar
from app.db.database import Base, engine

app = FastAPI(title="Budget Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
app.include_router(budgets.router, prefix="/budgets", tags=["Budgets"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])

@app.get("/")
def root():
    return {"message": "Budget Tracker API is running"}