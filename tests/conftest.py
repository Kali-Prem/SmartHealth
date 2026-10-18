"""Pytest fixtures and test setup for SmartHealth."""

import pytest
from fastapi.testclient import TestClient

from backend.app.config import get_settings
from backend.app.data.seed import seed_database
from backend.app.database import get_db
from backend.app.main import app
from backend.app.security import create_access_token


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Ensure test environment variables and initialize database once."""
    settings = get_settings()
    settings.environment = "testing"
    settings.use_mock_db = True
    settings.secret_key = "test-secret-key-smarthealth-super-secure"
    settings.gemini_api_key = None  # Force intelligent fallback in tests


@pytest.fixture(autouse=True)
async def reset_database():
    """Reset the database before each test run."""
    db = get_db()
    # Clear in-memory storage
    db._in_memory._storage.clear()
    await seed_database(db)


@pytest.fixture
def client():
    """Synchronous test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_token():
    """Valid JWT for district_admin."""
    claims = {
        "sub": "admin",
        "role": "district_admin",
        "name": "Dr. Rajesh Sharma, CMO",
        "centre_id": None,
        "district": "Pune",
    }
    return create_access_token(data=claims)


@pytest.fixture
def staff_token():
    """Valid JWT for centre_staff (assigned to Wagholi PHC)."""
    claims = {
        "sub": "wagholi_moic",
        "role": "centre_staff",
        "name": "Dr. Priya Deshmukh, MOIC",
        "centre_id": "phc_001",
        "district": "Pune",
    }
    return create_access_token(data=claims)


@pytest.fixture
def admin_headers(admin_token):
    """Authorization headers for admin."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def staff_headers(staff_token):
    """Authorization headers for centre staff."""
    return {"Authorization": f"Bearer {staff_token}"}
