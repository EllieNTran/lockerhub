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
os.environ.setdefault("APP_PORT", "3007")
os.environ.setdefault("AUTH_SERVICE_URL", "http://localhost:3003")


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
    mock_settings_obj.APP_PORT = 3007
    mock_settings_obj.AUTH_SERVICE_URL = "http://localhost:3003"
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
def sample_floor_id():
    """Generate a sample floor ID."""
    return uuid4()


@pytest.fixture
def sample_department_id():
    """Generate a sample department ID."""
    return uuid4()


def create_usage_data_dict(**overrides):
    """Create a locker usage data dictionary with optional overrides."""
    today = date.today()
    default = {
        "usage_date": today,
        "occupied_count": 25,
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
            "email": "admin@example.com",
            "role": "admin",
            "scope": ["analytics.read"],
        }

    return mock_user


@pytest_asyncio.fixture
async def test_client(mock_get_current_user):
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
    ):
        # Import app after patching lifespan
        from src.main import app

        # Override authentication dependencies
        from src.middleware.auth import get_current_user

        app.dependency_overrides[get_current_user] = mock_get_current_user

        # Create test client
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client

        # Clean up overrides
        app.dependency_overrides.clear()
