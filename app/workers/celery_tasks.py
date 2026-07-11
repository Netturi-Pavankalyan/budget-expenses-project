from celery import Celery
from datetime import datetime
import os

# Celery connects to Redis (run redis locally via docker: docker run -p 6379:6379 -d redis)
celery_app = Celery(
    "budget_tracker",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

celery_app.conf.task_routes = {
    'app.workers.celery_tasks.*': {'queue': 'default'},
}

@celery_app.task
def check_recurring_expenses():
    """
    This task should be scheduled to run daily via Celery Beat.
    It queries the DB for RecurringExpenses where next_due_date == today,
    creates an Expense record, updates next_due_date, and sends a notification.
    """
    print(f"[{datetime.utcnow()}] Checking for recurring expenses...")
    # Logic would go here to query DB and create expenses
    # from app.db.database import SessionLocal
    # db = SessionLocal()
    # ... query logic ...
    # db.close()