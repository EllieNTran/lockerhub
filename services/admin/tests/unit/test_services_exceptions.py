"""Exception tests for remaining services."""

import pytest
from unittest.mock import patch


@pytest.mark.unit
class TestDashboardExceptions:
    """Tests for exception handling in dashboard services."""

    @pytest.mark.asyncio
    async def test_get_dashboard_stats_database_error(self, mock_db):
        """Test get dashboard stats handles database errors."""
        from src.services.dashboard.get_dashboard_stats import get_dashboard_stats

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.dashboard.get_dashboard_stats.db", mock_db):
            with pytest.raises(Exception):
                await get_dashboard_stats()

    @pytest.mark.asyncio
    async def test_get_floor_lockers_util_database_error(self, mock_db):
        """Test get floor lockers util handles database errors."""
        from src.services.dashboard.get_floor_lockers_util import (
            get_floor_lockers_util,
        )

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.dashboard.get_floor_lockers_util.db", mock_db):
            with pytest.raises(Exception):
                await get_floor_lockers_util()

    @pytest.mark.asyncio
    async def test_get_recent_activity_database_error(self, mock_db):
        """Test get recent activity handles database errors."""
        from src.services.dashboard.get_recent_activity import get_recent_activity

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.dashboard.get_recent_activity.db", mock_db):
            with pytest.raises(Exception):
                await get_recent_activity()


@pytest.mark.unit
class TestBookingRulesExceptions:
    """Tests for exception handling in booking rules services."""

    @pytest.mark.asyncio
    async def test_get_all_floors_database_error(self, mock_db):
        """Test get all floors handles database errors."""
        from src.services.booking_rules.get_all_floors import get_all_floors

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.booking_rules.get_all_floors.db", mock_db):
            with pytest.raises(Exception):
                await get_all_floors()

    @pytest.mark.asyncio
    async def test_get_booking_rules_database_error(self, mock_db):
        """Test get booking rules handles database errors."""
        from src.services.booking_rules.get_booking_rules import get_booking_rules

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.booking_rules.get_booking_rules.db", mock_db):
            with pytest.raises(Exception):
                await get_booking_rules()

    @pytest.mark.asyncio
    async def test_get_floor_closures_database_error(self, mock_db):
        """Test get floor closures handles database errors."""
        from src.services.booking_rules.get_floor_closures import get_floor_closures

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.booking_rules.get_floor_closures.db", mock_db):
            with pytest.raises(Exception):
                await get_floor_closures("floor-id")

    @pytest.mark.asyncio
    async def test_delete_floor_closure_database_error(self, mock_db):
        """Test delete floor closure handles database errors."""
        from src.services.booking_rules.delete_floor_closure import (
            delete_floor_closure,
        )
        from uuid import uuid4

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.booking_rules.delete_floor_closure.db", mock_db):
            with pytest.raises(Exception):
                await delete_floor_closure(str(uuid4()), str(uuid4()))

    @pytest.mark.asyncio
    async def test_update_booking_rules_database_error(self, mock_db):
        """Test update booking rules handles database errors."""
        from src.services.booking_rules.update_booking_rules import (
            update_booking_rules,
        )
        from unittest.mock import AsyncMock, MagicMock

        # Mock the transaction to raise an error
        mock_transaction = MagicMock()
        mock_transaction.__aenter__.side_effect = Exception("Database error")
        mock_transaction.__aexit__ = AsyncMock(return_value=None)
        mock_db.transaction.return_value = mock_transaction

        with patch("src.services.booking_rules.update_booking_rules.db", mock_db):
            with pytest.raises(Exception):
                await update_booking_rules(
                    user_id="user-id",
                    max_booking_duration=30,
                )


@pytest.mark.unit
class TestSpecialRequestsExceptions:
    """Tests for exception handling in special requests services."""

    @pytest.mark.asyncio
    async def test_get_all_special_requests_database_error(self, mock_db):
        """Test get all special requests handles database errors."""
        from src.services.special_requests.get_all_special_requests import (
            get_all_special_requests,
        )

        mock_db.fetch.side_effect = Exception("Database error")

        with patch(
            "src.services.special_requests.get_all_special_requests.db", mock_db
        ):
            with pytest.raises(Exception):
                await get_all_special_requests()

    @pytest.mark.asyncio
    async def test_review_special_request_database_error(self, mock_db):
        """Test review special request handles database errors."""
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )
        from unittest.mock import AsyncMock
        from datetime import date

        # Mock the first fetchrow to return valid request data
        mock_db.fetchrow.return_value = {
            "user_id": "user-id",
            "floor_id": "floor-id",
            "start_date": date.today(),
            "end_date": None,
            "email": "test@test.com",
            "first_name": "Test",
            "floor_number": "10",
            "locker_id": None,
            "locker_number": None,
        }

        # Mock the final fetch to raise exception
        mock_db.fetch.side_effect = Exception("Database error")

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient"
            ) as mock_notif,
        ):
            mock_notif_instance = AsyncMock()
            mock_notif.return_value = mock_notif_instance

            with pytest.raises(Exception):
                await review_special_request(
                    status="rejected",
                    reviewed_by="admin-id",
                    request_id=123,
                )


@pytest.mark.unit
class TestUsersExceptions:
    """Tests for exception handling in users services."""

    @pytest.mark.asyncio
    async def test_get_all_users_database_error(self, mock_db):
        """Test get all users handles database errors."""
        from src.services.users.get_all_users import get_all_users

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.users.get_all_users.db", mock_db):
            with pytest.raises(Exception):
                await get_all_users()

    @pytest.mark.asyncio
    async def test_get_user_database_error(self, mock_db):
        """Test get user handles database errors."""
        from src.services.users.get_user import get_user

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.users.get_user.db", mock_db):
            with pytest.raises(Exception):
                await get_user("user-id")
