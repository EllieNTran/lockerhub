"""Unit tests for special request services."""

import pytest
from unittest.mock import patch, AsyncMock
from datetime import date, datetime, timedelta
from uuid import uuid4


def create_special_request_dict(**overrides):
    """Create a special request dictionary with optional overrides."""
    today = date.today()
    default = {
        "request_id": 1,
        "user_id": uuid4(),
        "floor_id": uuid4(),
        "locker_id": None,
        "start_date": today,
        "end_date": today + timedelta(days=30),
        "request_type": "special",
        "justification": "Need permanent locker for research project",
        "status": "pending",
        "created_at": datetime.now(),
        "reviewed_at": None,
        "reviewed_by": None,
        "floor_number": "10",
        "locker_number": None,
    }
    default.update(overrides)
    return default


class TestCreateSpecialRequest:
    """Tests for the create_special_request service."""

    @pytest.mark.asyncio
    async def test_create_special_request_success_extended(
        self, mock_db, sample_user_id, sample_floor_id
    ):
        """
        Verify successful creation of extended duration special request.
        Mock database inserts request and returns request_id.
        """
        from src.services.create_special_request import create_special_request

        today = date.today()
        end_date = today + timedelta(days=30)
        request_id = 123

        mock_db.fetchval.return_value = request_id
        mock_db.fetchrow.return_value = {
            "email": "test@example.com",
            "first_name": "Test User",
            "floor_number": "10",
        }

        with patch("src.services.create_special_request.db", mock_db), patch(
            "src.services.create_special_request.NotificationsServiceClient"
        ) as mock_notifications:
            mock_notifications.return_value.post = AsyncMock(return_value=None)

            result = await create_special_request(
                str(sample_user_id),
                str(sample_floor_id),
                today,
                "Need locker for extended research project",
                end_date,
            )

        assert result.request_id == request_id
        assert mock_db.fetchval.call_count == 1
        assert mock_db.fetchrow.call_count == 1
        # Verify the query was called with correct parameters
        call_args = mock_db.fetchval.call_args[0]
        assert call_args[1] == str(sample_user_id)
        assert call_args[2] == str(sample_floor_id)
        assert call_args[4] == today
        assert call_args[5] == end_date

    @pytest.mark.asyncio
    async def test_create_special_request_success_permanent(
        self, mock_db, sample_user_id, sample_floor_id
    ):
        """
        Verify successful creation of permanent allocation special request.
        End date is None for permanent allocation.
        """
        from src.services.create_special_request import create_special_request

        today = date.today()
        request_id = 124

        mock_db.fetchval.return_value = request_id
        mock_db.fetchrow.return_value = {
            "email": "test@example.com",
            "first_name": "Test User",
            "floor_number": "10",
        }

        with patch("src.services.create_special_request.db", mock_db), patch(
            "src.services.create_special_request.NotificationsServiceClient"
        ) as mock_notifications:
            mock_notifications.return_value.post = AsyncMock(return_value=None)

            result = await create_special_request(
                str(sample_user_id),
                str(sample_floor_id),
                today,
                "Need permanent locker allocation",
                None,  # Permanent allocation
            )

        assert result.request_id == request_id
        call_args = mock_db.fetchval.call_args[0]
        assert call_args[5] is None  # end_date is None

    @pytest.mark.asyncio
    async def test_create_special_request_with_locker_preference(
        self, mock_db, sample_user_id, sample_floor_id, sample_locker_id
    ):
        """
        Verify special request creation with preferred locker.
        Mock database inserts request with locker_id.
        """
        from src.services.create_special_request import create_special_request

        today = date.today()
        end_date = today + timedelta(days=60)
        request_id = 125

        mock_db.fetchval.return_value = request_id
        mock_db.fetchrow.return_value = {
            "email": "test@example.com",
            "first_name": "Test User",
            "floor_number": "10",
        }

        with patch("src.services.create_special_request.db", mock_db), patch(
            "src.services.create_special_request.NotificationsServiceClient"
        ) as mock_notifications:
            mock_notifications.return_value.post = AsyncMock(return_value=None)

            result = await create_special_request(
                str(sample_user_id),
                str(sample_floor_id),
                today,
                "Need specific locker near lab",
                end_date,
                str(sample_locker_id),
            )

        assert result.request_id == request_id
        call_args = mock_db.fetchval.call_args[0]
        assert call_args[3] == str(sample_locker_id)

    @pytest.mark.asyncio
    async def test_create_special_request_database_error(
        self, mock_db, sample_user_id, sample_floor_id
    ):
        """
        Verify error handling when database insertion fails.
        Expect exception to be raised.
        """
        from src.services.create_special_request import create_special_request

        today = date.today()
        mock_db.fetchval.side_effect = Exception("Database error")

        with patch("src.services.create_special_request.db", mock_db), patch(
            "src.services.create_special_request.NotificationsServiceClient"
        ) as mock_notifications:
            mock_notifications.return_value.post = AsyncMock(return_value=None)

            with pytest.raises(Exception, match="Database error"):
                await create_special_request(
                    str(sample_user_id),
                    str(sample_floor_id),
                    today,
                    "Testing error handling",
                )


class TestGetUserSpecialRequests:
    """Tests for the get_user_special_requests service."""

    @pytest.mark.asyncio
    async def test_get_user_special_requests_success(self, mock_db, sample_user_id):
        """
        Verify successful retrieval of user's special requests.
        Mock database returns list of special requests sorted by status and date.
        """
        from src.services.get_user_special_requests import get_user_special_requests

        mock_requests = [
            create_special_request_dict(
                request_id=1,
                user_id=sample_user_id,
                status="pending",
            ),
            create_special_request_dict(
                request_id=2,
                user_id=sample_user_id,
                status="approved",
            ),
            create_special_request_dict(
                request_id=3,
                user_id=sample_user_id,
                status="rejected",
            ),
        ]
        mock_db.fetch.return_value = mock_requests

        with patch("src.services.get_user_special_requests.db", mock_db):
            result = await get_user_special_requests(str(sample_user_id))

        assert len(result.requests) == 3
        assert result.requests[0].request_id == 1
        assert result.requests[0].status == "pending"
        assert result.requests[1].status == "approved"
        assert result.requests[2].status == "rejected"

    @pytest.mark.asyncio
    async def test_get_user_special_requests_empty(self, mock_db, sample_user_id):
        """
        Verify handling when user has no special requests.
        Mock database returns empty list.
        """
        from src.services.get_user_special_requests import get_user_special_requests

        mock_db.fetch.return_value = []

        with patch("src.services.get_user_special_requests.db", mock_db):
            result = await get_user_special_requests(str(sample_user_id))

        assert len(result.requests) == 0

    @pytest.mark.asyncio
    async def test_get_user_special_requests_with_locker(
        self, mock_db, sample_user_id, sample_locker_id
    ):
        """
        Verify retrieval includes locker information when present.
        Mock database returns request with locker details.
        """
        from src.services.get_user_special_requests import get_user_special_requests

        mock_requests = [
            create_special_request_dict(
                request_id=1,
                user_id=sample_user_id,
                locker_id=sample_locker_id,
                locker_number="DL10-01-05",
            ),
        ]
        mock_db.fetch.return_value = mock_requests

        with patch("src.services.get_user_special_requests.db", mock_db):
            result = await get_user_special_requests(str(sample_user_id))

        assert result.requests[0].locker_number == "DL10-01-05"

    @pytest.mark.asyncio
    async def test_get_user_special_requests_database_error(
        self, mock_db, sample_user_id
    ):
        """
        Verify error handling when database query fails.
        Expect exception to be raised.
        """
        from src.services.get_user_special_requests import get_user_special_requests

        mock_db.fetch.side_effect = Exception("Database connection failed")

        with patch("src.services.get_user_special_requests.db", mock_db):
            with pytest.raises(Exception, match="Database connection failed"):
                await get_user_special_requests(str(sample_user_id))


class TestCancelSpecialRequest:
    """Tests for the cancel_special_request service."""

    @pytest.mark.asyncio
    async def test_cancel_special_request_success(
        self,
        mock_db,
        mock_db_connection,
        sample_user_id,
        sample_request_id,
        mock_notifications_client,
    ):
        """
        Verify successful cancellation of special request by owner.
        Mock database verifies ownership and cancels request.
        """
        from src.services.cancel_special_request import cancel_special_request

        # Mock the transaction connection
        # First fetchrow: get special request (returns user data)
        # Second fetchrow: get associated booking (returns None - no booking)
        mock_db_connection.fetchrow.side_effect = [
            {
                "user_id": sample_user_id,
                "end_date": None,
                "floor_number": "10",
            },  # GET_SPECIAL_REQUEST_QUERY
            None,  # GET_ASSOCIATED_BOOKING_QUERY - no booking
        ]
        mock_db_connection.fetchval.return_value = sample_request_id

        with patch("src.services.cancel_special_request.db", mock_db), patch(
            "src.services.cancel_special_request.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await cancel_special_request(
                str(sample_user_id), sample_request_id
            )

        assert result.request_id == sample_request_id
        assert mock_db_connection.fetchrow.call_count == 2
        # fetchval should be called with request_id and user_id for UPDATE query
        assert mock_db_connection.fetchval.call_count == 1
        # Verify notification was sent
        mock_notifications_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_special_request_not_found(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """
        Verify error when attempting to cancel non-existent request.
        Mock database returns None for request lookup.
        """
        from src.services.cancel_special_request import cancel_special_request

        mock_db_connection.fetchrow.return_value = None

        with patch("src.services.cancel_special_request.db", mock_db):
            with pytest.raises(ValueError, match="Special request not found"):
                await cancel_special_request(str(sample_user_id), 999)

    @pytest.mark.asyncio
    async def test_cancel_special_request_unauthorized(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """
        Verify error when user attempts to cancel another user's request.
        Mock database returns different user_id.
        """
        from src.services.cancel_special_request import cancel_special_request

        different_user_id = uuid4()
        mock_db_connection.fetchrow.return_value = {
            "user_id": different_user_id,
            "end_date": None,
            "floor_number": "10",
        }

        with patch("src.services.cancel_special_request.db", mock_db):
            with pytest.raises(ValueError, match="not authorized"):
                await cancel_special_request(str(sample_user_id), 1)

    @pytest.mark.asyncio
    async def test_cancel_special_request_cancellation_fails(
        self,
        mock_db,
        mock_db_connection,
        sample_user_id,
        sample_request_id,
        mock_notifications_client,
    ):
        """
        Verify error when cancellation operation fails.
        Mock database confirms ownership but cancellation returns None.
        """
        from src.services.cancel_special_request import cancel_special_request

        # First fetchrow: get special request (returns user data)
        # Second fetchrow: get associated booking (returns None - no booking)
        mock_db_connection.fetchrow.side_effect = [
            {
                "user_id": sample_user_id,
                "end_date": None,
                "floor_number": "10",
            },  # GET_SPECIAL_REQUEST_QUERY
            None,  # GET_ASSOCIATED_BOOKING_QUERY - no booking
        ]
        mock_db_connection.fetchval.return_value = None  # Cancellation failed

        with patch("src.services.cancel_special_request.db", mock_db), patch(
            "src.services.cancel_special_request.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            with pytest.raises(ValueError, match="could not be cancelled"):
                await cancel_special_request(str(sample_user_id), sample_request_id)
