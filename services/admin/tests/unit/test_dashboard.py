"""Unit tests for dashboard services."""

import pytest
from unittest.mock import patch
from datetime import datetime
from decimal import Decimal


@pytest.mark.unit
class TestGetDashboardStats:
    """Tests for get_dashboard_stats service."""

    @pytest.mark.asyncio
    async def test_get_dashboard_stats_success(self, mock_db):
        """Test retrieving dashboard statistics.

        Verifies that fetching dashboard stats returns all metrics including
        locker counts, booking counts, pending requests, and total users.
        """
        from src.services.dashboard.get_dashboard_stats import get_dashboard_stats

        stats = {
            "total_lockers": 150,
            "available_lockers": 85,
            "occupied_lockers": 50,
            "maintenance_lockers": 15,
            "total_bookings": 200,
            "active_bookings": 45,
            "pending_requests": 12,
            "total_users": 500,
        }
        mock_db.fetchrow.return_value = stats

        with patch("src.services.dashboard.get_dashboard_stats.db", mock_db):
            result = await get_dashboard_stats()

            assert result.total_lockers == 150
            assert result.available_lockers == 85
            assert result.occupied_lockers == 50
            assert result.maintenance_lockers == 15
            assert result.total_bookings == 200
            assert result.active_bookings == 45
            assert result.pending_requests == 12
            assert result.total_users == 500


@pytest.mark.unit
class TestGetFloorLockersUtil:
    """Tests for get_floor_lockers_util service."""

    @pytest.mark.asyncio
    async def test_get_floor_utilization_success(self, mock_db):
        """Test retrieving floor locker utilization.

        Verifies that fetching floor utilization returns correct statistics
        for each floor including total lockers, available, occupied, and utilization rate.
        """
        from src.services.dashboard.get_floor_lockers_util import get_floor_lockers_util
        from uuid import UUID

        floors = [
            {
                "floor_id": UUID("12345678-1234-5678-1234-567812345678"),
                "floor_number": "10",
                "total_lockers": 50,
                "available": 20,
                "occupied": 25,
                "maintenance": 5,
                "utilization_rate": 0.50,
            },
            {
                "floor_id": UUID("87654321-4321-8765-4321-876543218765"),
                "floor_number": "11",
                "total_lockers": 40,
                "available": 10,
                "occupied": 28,
                "maintenance": 2,
                "utilization_rate": 0.70,
            },
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.dashboard.get_floor_lockers_util.db", mock_db):
            result = await get_floor_lockers_util()

            assert len(result) == 2
            assert result[0].floor_number == "10"
            assert result[0].total_lockers == 50
            assert result[0].available == 20
            assert result[0].occupied == 25
            assert result[0].maintenance == 5
            assert result[0].utilization_rate == 0.50
            assert result[1].floor_number == "11"
            assert result[1].utilization_rate == 0.70

    @pytest.mark.asyncio
    async def test_get_floor_utilization_empty(self, mock_db):
        """Test retrieving floor utilization when no floors exist.

        Verifies that fetching floor utilization from a database with no floors
        returns an empty list.
        """
        from src.services.dashboard.get_floor_lockers_util import get_floor_lockers_util

        mock_db.fetch.return_value = []

        with patch("src.services.dashboard.get_floor_lockers_util.db", mock_db):
            result = await get_floor_lockers_util()

            assert len(result) == 0

    @pytest.mark.asyncio
    async def test_get_floor_utilization_zero_rate(self, mock_db):
        """Test floor utilization with zero utilization rate.

        Verifies that floors with no occupied lockers correctly show
        a utilization rate of 0.0.
        """
        from src.services.dashboard.get_floor_lockers_util import get_floor_lockers_util
        from uuid import UUID

        floors = [
            {
                "floor_id": UUID("12345678-1234-5678-1234-567812345678"),
                "floor_number": "10",
                "total_lockers": 50,
                "available": 50,
                "occupied": 0,
                "maintenance": 0,
                "utilization_rate": 0.0,
            },
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.dashboard.get_floor_lockers_util.db", mock_db):
            result = await get_floor_lockers_util()

            assert len(result) == 1
            assert result[0].utilization_rate == 0.0
            assert result[0].occupied == 0


@pytest.mark.unit
class TestGetRecentActivity:
    """Tests for get_recent_activity service."""

    @pytest.mark.asyncio
    async def test_get_recent_activity_success(self, mock_db):
        """Test retrieving recent activity.

        Verifies that fetching recent activity returns the 7 most recent
        notifications with user details and timestamps.
        """
        from src.services.dashboard.get_recent_activity import get_recent_activity
        from uuid import UUID

        activities = [
            {
                "notification_id": UUID("11111111-1111-1111-1111-111111111111"),
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "user_name": "John Doe",
                "entity_type": "booking",
                "admin_title": "New Booking Created",
                "caption": "Booking created for locker DL10-01-01",
                "type": "info",
                "created_at": datetime(2026, 3, 21, 10, 30, 0),
            },
            {
                "notification_id": UUID("11111111-1111-1111-1111-111111111111"),
                "user_id": None,
                "user_name": "System",
                "entity_type": "locker",
                "admin_title": "Locker Maintenance",
                "caption": "Locker DL11-02-05 marked for maintenance",
                "type": "warning",
                "created_at": datetime(2026, 3, 21, 9, 15, 0),
            },
        ]
        mock_db.fetch.return_value = activities

        with patch("src.services.dashboard.get_recent_activity.db", mock_db):
            result = await get_recent_activity()

            assert len(result) == 2
            assert result[0].notification_id == UUID(
                "11111111-1111-1111-1111-111111111111"
            )
            assert result[0].user_name == "John Doe"
            assert result[0].entity_type == "booking"
            assert result[0].title == "New Booking Created"
            assert result[0].type == "info"
            assert result[1].user_name == "System"
            assert result[1].user_id is None

    @pytest.mark.asyncio
    async def test_get_recent_activity_empty(self, mock_db):
        """Test retrieving recent activity when none exist.

        Verifies that fetching recent activity from an empty database
        returns an empty list.
        """
        from src.services.dashboard.get_recent_activity import get_recent_activity

        mock_db.fetch.return_value = []

        with patch("src.services.dashboard.get_recent_activity.db", mock_db):
            result = await get_recent_activity()

            assert len(result) == 0

    @pytest.mark.asyncio
    async def test_get_recent_activity_system_notifications(self, mock_db):
        """Test retrieving system-generated notifications.

        Verifies that system notifications without a user_id are correctly
        handled with user_name set to 'System'.
        """
        from src.services.dashboard.get_recent_activity import get_recent_activity
        from uuid import UUID

        activities = [
            {
                "notification_id": UUID("11111111-1111-1111-1111-111111111111"),
                "user_id": None,
                "user_name": "System",
                "entity_type": "system",
                "admin_title": "Database Backup",
                "caption": "Automated backup completed successfully",
                "type": "success",
                "created_at": datetime(2026, 3, 21, 2, 0, 0),
            },
        ]
        mock_db.fetch.return_value = activities

        with patch("src.services.dashboard.get_recent_activity.db", mock_db):
            result = await get_recent_activity()

            assert len(result) == 1
            assert result[0].user_id is None
            assert result[0].user_name == "System"
            assert result[0].entity_type == "system"
