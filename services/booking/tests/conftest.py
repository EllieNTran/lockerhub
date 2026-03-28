"""Shared test fixtures and utilities."""

import os
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import date, timedelta
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("DB_USER", "test_user")
os.environ.setdefault("DB_PASSWORD", "test_password")
os.environ.setdefault("DB_MIN_POOL_SIZE", "1")
os.environ.setdefault("DB_MAX_POOL_SIZE", "10")
os.environ.setdefault("APP_HOST", "0.0.0.0")
os.environ.setdefault("APP_PORT", "3004")
os.environ.setdefault("AUTH_SERVICE_URL", "http://localhost:3003")
os.environ.setdefault("NOTIFICATIONS_SERVICE_URL", "http://localhost:3006")
os.environ.setdefault("INTERNAL_API_KEY", "test-api-key")


@pytest.fixture(scope="session", autouse=True)
def mock_settings():
    """Mock settings to avoid environment variable requirements."""
    mock_settings_obj = MagicMock()
    mock_settings_obj.DB_HOST = "localhost"
    mock_settings_obj.DB_PORT = 5432
    mock_settings_obj.DB_NAME = "test_db"
    mock_settings_obj.DB_USER = "test_user"
    mock_settings_obj.DB_PASSWORD = "test_password"
    mock_settings_obj.DB_MIN_POOL_SIZE = 1
    mock_settings_obj.DB_MAX_POOL_SIZE = 10
    mock_settings_obj.APP_HOST = "0.0.0.0"
    mock_settings_obj.APP_PORT = 8000
    mock_settings_obj.AUTH_SERVICE_URL = "http://localhost:3003"
    mock_settings_obj.NOTIFICATIONS_SERVICE_URL = "http://localhost:3006"
    mock_settings_obj.jwks_url = "http://localhost:3003/auth/.well-known/jwks.json"

    with patch("src.settings.settings", mock_settings_obj):
        yield mock_settings_obj


@pytest.fixture
def mock_db_connection():
    """Mock database connection with async methods."""
    connection = AsyncMock()
    connection.fetchrow = AsyncMock()
    connection.fetchval = AsyncMock()
    connection.fetch = AsyncMock()
    connection.execute = AsyncMock()
    return connection


@pytest.fixture
def mock_db_transaction(mock_db_connection):
    """Mock database transaction context manager."""
    transaction = AsyncMock()
    transaction.__aenter__ = AsyncMock(return_value=mock_db_connection)
    transaction.__aexit__ = AsyncMock(return_value=None)
    return transaction


@pytest.fixture
def mock_db(mock_db_transaction, mock_db_connection):
    """Mock database with transaction support."""
    db = MagicMock()
    db.transaction = MagicMock(return_value=mock_db_transaction)
    db.fetch = mock_db_connection.fetch
    db.fetchrow = mock_db_connection.fetchrow
    db.fetchval = mock_db_connection.fetchval
    db.execute = mock_db_connection.execute
    return db


@pytest.fixture
def mock_notifications_client():
    """Mock notifications service client."""
    client = AsyncMock()
    client.post = AsyncMock(return_value={"success": True})
    return client


@pytest.fixture
def sample_user_id():
    """Generate a sample user ID."""
    return uuid4()


@pytest.fixture
def sample_locker_id():
    """Generate a sample locker ID."""
    return uuid4()


@pytest.fixture
def sample_booking_id():
    """Generate a sample booking ID."""
    return uuid4()


@pytest.fixture
def sample_floor_id():
    """Generate a sample floor ID."""
    return uuid4()


@pytest.fixture
def sample_request_id():
    """Generate a sample request ID."""
    return 1


@pytest.fixture
def sample_floor_queue_id():
    """Generate a sample floor queue ID."""
    return 1


def create_booking_dict(**overrides):
    """Create a booking dictionary with optional overrides."""
    from datetime import datetime

    today = date.today()
    default = {
        "booking_id": uuid4(),
        "user_id": uuid4(),
        "locker_id": uuid4(),
        "locker_number": "DL10-01-01",
        "floor_number": "10",
        "start_date": today,
        "end_date": today + timedelta(days=2),
        "booking_status": "active",
        "special_request_id": None,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    default.update(overrides)
    return default


def create_locker_dict(**overrides):
    """Create a locker dictionary with optional overrides."""
    from datetime import datetime

    default = {
        "locker_id": uuid4(),
        "locker_number": "DL10-01-01",
        "floor_id": uuid4(),
        "location": "Near elevator",
        "status": "available",
        "x_coordinate": 100,
        "y_coordinate": 200,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "is_available": True,
        "is_permanently_allocated": False,
    }
    default.update(overrides)
    return default


def create_floor_dict(**overrides):
    """Create a floor dictionary with optional overrides."""
    from datetime import datetime

    default = {
        "floor_id": uuid4(),
        "floor_number": "10",
        "status": "open",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    default.update(overrides)
    return default


def create_user_details_dict(**overrides):
    """Create a user details dictionary for notifications."""
    default = {
        "email": "test@example.com",
        "first_name": "Test",
        "locker_number": "DL10-01-01",
        "floor_number": "10",
    }
    default.update(overrides)
    return default


@pytest.fixture(params=["upcoming", "active", "cancelled", "completed", "expired"])
def booking_status(request):
    """Parametrized fixture for booking statuses."""
    return request.param


@pytest.fixture(params=["available", "occupied", "reserved", "maintenance"])
def locker_status(request):
    """Parametrized fixture for locker statuses."""
    return request.param


@pytest.fixture(params=["open", "closed"])
def floor_status(request):
    """Parametrized fixture for floor statuses."""
    return request.param


def create_booking_dict(**overrides):
    """Create a booking dictionary with optional overrides."""
    from datetime import datetime

    today = date.today()
    default = {
        "booking_id": uuid4(),
        "user_id": uuid4(),
        "locker_id": uuid4(),
        "start_date": today,
        "end_date": today + timedelta(days=2),
        "status": "active",
        "booking_status": "active",
        "email": "test@example.com",
        "first_name": "Test",
        "employee_name": "Test User",
        "staff_number": "123456",
        "department_name": "Department",
        "capability_name": "General",
        "locker_number": "DL10-01-01",
        "locker_status": "occupied",
        "floor_number": "10",
        "key_id": uuid4(),
        "key_status": "with_employee",
        "key_number": "AA123",
        "special_request_id": None,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    default.update(overrides)
    return default


def create_locker_dict(**overrides):
    """Create a locker dictionary with optional overrides."""
    from datetime import datetime

    default = {
        "locker_id": uuid4(),
        "locker_number": "DL10-01-01",
        "floor_id": uuid4(),
        "floor_number": "10",
        "location": "Near elevator",
        "status": "available",
        "locker_status": "available",
        "x_coordinate": 100,
        "y_coordinate": 200,
        "key_number": "AA123",
        "key_status": "available",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "is_available": True,
        "is_permanently_allocated": False,
    }
    default.update(overrides)
    return default


def create_key_dict(**overrides):
    """Create a key dictionary with optional overrides."""
    default = {
        "key_id": uuid4(),
        "key_number": "AA123",
        "locker_id": uuid4(),
        "status": "available",
    }
    default.update(overrides)
    return default


def create_user_dict(**overrides):
    """Create a user dictionary with optional overrides."""
    default = {
        "user_id": uuid4(),
        "staff_number": "123456",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "employee_name": "Test User",
        "department_name": "Department",
        "is_active": True,
    }
    default.update(overrides)
    return default


# Integration test fixtures


@pytest.fixture
def mock_get_current_user():
    """Mock the get_current_user dependency for integration tests."""

    async def mock_user():
        return {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "role": "user",
            "scope": ["bookings.create", "bookings.read"],
        }

    return mock_user


@pytest.fixture
def mock_verify_api_key():
    """Mock the verify_api_key dependency for integration tests."""

    async def mock_verify():
        return True

    return mock_verify


@pytest_asyncio.fixture
async def test_client(mock_get_current_user, mock_verify_api_key):
    """Create FastAPI test client with mocked authentication."""
    # Need to mock lifespan events to avoid DB connections
    from contextlib import asynccontextmanager
    from fastapi import FastAPI

    @asynccontextmanager
    async def mock_lifespan(app: FastAPI):
        # Mock startup/shutdown - no actual DB connection
        yield

    # Patch the lifespan before importing the app
    with patch("src.main.lifespan", mock_lifespan), patch(
        "src.main.fetch_jwks", AsyncMock()
    ), patch("src.main.start_scheduler"), patch("src.main.shutdown_scheduler"):
        # Import app after patching lifespan
        from src.main import app

        # Override authentication dependencies
        from src.middleware.auth import get_current_user
        from src.middleware.api_key import verify_api_key

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[verify_api_key] = mock_verify_api_key

        # Create test client
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client

        # Clean up overrides
        app.dependency_overrides.clear()
