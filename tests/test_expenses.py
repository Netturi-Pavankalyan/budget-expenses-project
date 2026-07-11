import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base, get_db
from app.main import app

# Setup in-memory SQLite DB for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_create_user_and_expense():
    # 1. Register
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@test.com",
        "password": "password123"
    })
    assert response.status_code == 201
    
    # 2. Login
    response = client.post("/auth/login", json={
        "email": "test@test.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Add Expense
    response = client.post("/expenses/", json={
        "amount": 50.0,
        "category": "Food",
        "description": "Pizza",
        "expense_date": "2026-06-24"
    }, headers=headers)
    assert response.status_code == 201
    assert response.json()["amount"] == 50.0
    
    # 4. Get Expenses
    response = client.get("/expenses/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1