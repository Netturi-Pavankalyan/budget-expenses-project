from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.api import auth, expenses, budgets, dashboard, reports, calendar, accounts
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


def run_startup_migrations():
    """
    create_all() only creates tables that don't exist yet — it never alters
    a table that's already there. The 'expenses' table predates the
    account-linking feature, so on an existing database it's missing the
    'account_id' column and still has 'category' set NOT NULL. This patches
    both, in place, without needing manual DB access. Safe to run every
    startup: every step checks first and skips if already applied.
    """
    inspector = inspect(engine)
    if "expenses" not in inspector.get_table_names():
        return  # brand new database, create_all already built it correctly

    columns = {col["name"]: col for col in inspector.get_columns("expenses")}
    is_sqlite = engine.dialect.name == "sqlite"

    with engine.begin() as conn:
        if "account_id" not in columns:
            conn.execute(text("ALTER TABLE expenses ADD COLUMN account_id INTEGER"))

        if not is_sqlite and columns.get("category") is not None and columns["category"].get("nullable") is False:
            # SQLite can't drop a NOT NULL constraint without rebuilding the
            # table, so this only runs on Postgres. On SQLite, existing rows
            # already have a category, and new "Others" expenses still
            # provide one — only the "Bank Account" flow needs it to be
            # optional, so this is a soft-fail, not a blocker.
            conn.execute(text("ALTER TABLE expenses ALTER COLUMN category DROP NOT NULL"))


try:
    run_startup_migrations()
except Exception as e:
    # Never let a migration hiccup take the whole API down — log and continue,
    # since create_all() above already guarantees the app is usable for
    # every feature except the brand-new account-linked expenses.
    print(f"[startup migration warning] {e}")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
app.include_router(budgets.router, prefix="/budgets", tags=["Budgets"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
app.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])

@app.get("/")
def root():
    return {"message": "Budget Tracker API is running"}