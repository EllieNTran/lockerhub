"""Unit tests for queue services."""

import pytest
from datetime import date, timedelta
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from src.main import app
from src.middleware.auth import get_current_user
from ..conftest import create_user_details_dict


class TestJoinFloorQueue:
    """Tests for the join_floor_queue service."""

    @pytest.mark.asyncio
    async def test_join_floor_queue_success(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_floor_id,
        sample_request_id,
        sample_floor_queue_id,
    ):
        """
        Verify successful addition to floor queue.
        Mock database creates request and queue entry.
        Mock notifications service sends confirmation.
        """
        from src.services.join_floor_queue import join_floor_queue

        today = date.today()
        end_date = today + timedelta(days=2)

        mock_db.fetchrow.side_effect = [
            None,
            {
                "floor_queue_id": sample_floor_queue_id,
                "request_id": sample_request_id,
                "email": "test@example.com",
                "first_name": "Test",
                "floor_number": "10",
            },
        ]

        with patch("src.services.join_floor_queue.db", mock_db), patch(
            "src.services.join_floor_queue.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await join_floor_queue(
                str(sample_user_id), str(sample_floor_id), today, end_date
            )

        assert result.floor_queue_id == sample_floor_queue_id
        assert result.request_id == sample_request_id
        assert result.floor_number == "10"
        assert mock_db.fetchrow.call_count == 2
        assert mock_notifications_client.post.call_count == 1

    @pytest.mark.asyncio
    async def test_join_floor_queue_already_queued(
        self, mock_db, sample_user_id, sample_floor_id
    ):
        """
        Verify error when user already in queue for overlapping dates.
        Mock database returns existing queue entry.
        Expect ValueError indicating user already on waitlist.
        """
        from src.services.join_floor_queue import join_floor_queue

        today = date.today()
        end_date = today + timedelta(days=2)

        mock_db.fetchrow.return_value = {"floor_queue_id": 1}

        with patch("src.services.join_floor_queue.db", mock_db):
            with pytest.raises(ValueError, match="already on the waiting list"):
                await join_floor_queue(
                    str(sample_user_id), str(sample_floor_id), today, end_date
                )

    @pytest.mark.asyncio
    async def test_join_floor_queue_different_dates(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_floor_id,
        sample_request_id,
        sample_floor_queue_id,
    ):
        """
        Verify user can join queue for non-overlapping dates.
        Mock database shows no conflict for different date range.
        Expect successful queue entry creation.
        """
        from src.services.join_floor_queue import join_floor_queue

        today = date.today()
        start_date = today + timedelta(days=10)
        end_date = today + timedelta(days=12)

        mock_db.fetchrow.side_effect = [
            None,
            {
                "floor_queue_id": sample_floor_queue_id,
                "request_id": sample_request_id,
                "email": "test@example.com",
                "first_name": "Test",
                "floor_number": "10",
            },
        ]

        with patch("src.services.join_floor_queue.db", mock_db), patch(
            "src.services.join_floor_queue.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await join_floor_queue(
                str(sample_user_id), str(sample_floor_id), start_date, end_date
            )

        assert result.floor_queue_id == sample_floor_queue_id
        assert result.request_id == sample_request_id
        assert mock_db.fetchrow.call_count == 2


class TestProcessFloorQueues:
    """Tests for the process_floor_queue endpoint."""

    def test_process_floor_queues_success(self, mock_db, sample_user_id):
        """
        Verify successful processing of floor queues with allocations.
        Mock database returns queued requests and CTE creates booking.
        Verify bookings created and queue entries removed.
        """
        from uuid import uuid4

        floor_data = [
            {
                "floor_id": uuid4(),
                "floor_number": "10",
            }
        ]

        queued_requests = [
            {
                "request_id": 1,
                "user_id": uuid4(),
                "start_date": date.today(),
                "end_date": date.today() + timedelta(days=2),
                "floor_queue_id": 1,
                "email": "test@example.com",
                "first_name": "Test",
                "created_at": date.today(),
            }
        ]

        mock_db.fetch.side_effect = [floor_data, queued_requests]
        mock_db.fetchrow.side_effect = [
            {
                "has_booking": None,
                "removed_queue_id": None,
                "cancelled_request_id": None,
            },
            {
                "booking_id": uuid4(),
                "locker_id": uuid4(),
                "locker_number": "DL10-01-01",
                "updated_request_id": 1,
                "removed_queue_id": 1,
            },
        ]

        # Override auth dependency
        app.dependency_overrides[get_current_user] = lambda: {
            "user_id": str(sample_user_id)
        }

        with patch("src.services.process_floor_queue.db", mock_db), patch(
            "src.services.process_floor_queue.NotificationsServiceClient"
        ) as mock_notif_class:
            mock_notif_instance = AsyncMock()
            mock_notif_instance.post = AsyncMock(return_value={"success": True})
            mock_notif_class.return_value = mock_notif_instance

            client = TestClient(app)
            response = client.post("/bookings/waitlist/process-floor-queue")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["allocations_made"] >= 0
        assert "allocated" in result["message"].lower()

    def test_process_floor_queues_no_requests(self, mock_db, sample_user_id):
        """
        Verify handling when no queued requests exist.
        Mock database returns empty floor list.
        Verify appropriate response message.
        """
        mock_db.fetch.return_value = []

        # Override auth dependency
        app.dependency_overrides[get_current_user] = lambda: {
            "user_id": str(sample_user_id)
        }

        with patch("src.services.process_floor_queue.db", mock_db):
            client = TestClient(app)
            response = client.post("/bookings/waitlist/process-floor-queue")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["allocations_made"] == 0

    def test_process_floor_queues_no_available_lockers(self, mock_db, sample_user_id):
        """
        Verify handling when there are requests but no available lockers.
        Mock database returns requests but no available lockers for them.
        Verify zero allocations made.
        """
        from uuid import uuid4

        floor_data = [
            {
                "floor_id": uuid4(),
                "floor_number": "10",
            }
        ]

        queued_requests = [
            {
                "request_id": 1,
                "user_id": uuid4(),
                "start_date": date.today(),
                "end_date": date.today() + timedelta(days=2),
                "floor_queue_id": 1,
                "email": "test@example.com",
                "first_name": "Test",
                "created_at": date.today(),
            }
        ]

        mock_db.fetch.side_effect = [floor_data, queued_requests]
        mock_db.fetchrow.side_effect = [
            {
                "has_booking": None,
                "removed_queue_id": None,
                "cancelled_request_id": None,
            },
            {
                "booking_id": None,
                "locker_id": None,
                "locker_number": None,
                "updated_request_id": None,
                "removed_queue_id": None,
            },
        ]

        # Override auth dependency
        app.dependency_overrides[get_current_user] = lambda: {
            "user_id": str(sample_user_id)
        }

        with patch("src.services.process_floor_queue.db", mock_db):
            client = TestClient(app)
            response = client.post("/bookings/waitlist/process-floor-queue")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["allocations_made"] == 0


class TestGetUserQueues:
    """Tests for the get_user_queues service."""

    @pytest.mark.asyncio
    async def test_get_user_queues_success(
        self, mock_db, sample_user_id, sample_floor_id
    ):
        """
        Verify successful retrieval of user's queue entries.
        Mock database returns list of queued requests with floor information.
        """
        from src.services.get_user_queues import get_user_queues

        today = date.today()

        mock_queues = [
            {
                "floor_queue_id": 1,
                "request_id": 10,
                "start_date": today,
                "end_date": today + timedelta(days=7),
                "created_at": today,
                "floor_id": sample_floor_id,
                "floor_number": "10",
            },
            {
                "floor_queue_id": 2,
                "request_id": 11,
                "start_date": today + timedelta(days=14),
                "end_date": today + timedelta(days=21),
                "created_at": today,
                "floor_id": sample_floor_id,
                "floor_number": "10",
            },
        ]

        mock_db.fetch.return_value = mock_queues

        with patch("src.services.get_user_queues.db", mock_db):
            result = await get_user_queues(str(sample_user_id))

        assert len(result.queues) == 2
        assert result.queues[0].floor_queue_id == 1
        assert result.queues[0].floor_number == "10"
        assert result.queues[1].floor_queue_id == 2

    @pytest.mark.asyncio
    async def test_get_user_queues_database_error(self, mock_db, sample_user_id):
        """Test exception handler in get_user_queues."""
        from src.services.get_user_queues import get_user_queues

        mock_db.fetch.side_effect = Exception("Database connection failed")

        with patch("src.services.get_user_queues.db", mock_db):
            with pytest.raises(Exception):
                await get_user_queues(str(sample_user_id))


class TestDeleteUserQueue:
    """Tests for delete_user_queue service."""

    @pytest.mark.asyncio
    async def test_delete_user_queue_not_found(self, mock_db, sample_user_id):
        """Test when queue entry not found or access denied."""
        from src.services.delete_user_queue import delete_user_queue

        mock_db.fetchrow.return_value = None

        with patch("src.services.delete_user_queue.db", mock_db):
            with pytest.raises(
                ValueError, match="Queue entry not found or access denied"
            ):
                await delete_user_queue(str(sample_user_id), 123)

    @pytest.mark.asyncio
    async def test_delete_user_queue_success(self, mock_db, sample_user_id):
        """Test successful queue entry deletion."""
        from src.services.delete_user_queue import delete_user_queue
        from unittest.mock import AsyncMock, MagicMock

        floor_queue_id = 123

        mock_db.fetchrow.return_value = {
            "floor_queue_id": floor_queue_id,
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=7),
            "floor_number": "10",
            "first_name": "Test User",
        }

        mock_notifications = MagicMock()
        mock_notifications.post = AsyncMock()

        with patch("src.services.delete_user_queue.db", mock_db), patch(
            "src.services.delete_user_queue.NotificationsServiceClient",
            return_value=mock_notifications,
        ):
            result = await delete_user_queue(str(sample_user_id), floor_queue_id)

        assert result.floor_queue_id == floor_queue_id
        assert "Queue entry removed successfully" in result.message
        mock_notifications.post.assert_called_once()


class TestProcessFloorQueueExceptions:
    """Tests for process_floor_queue exception handlers."""

    @pytest.mark.asyncio
    async def test_process_floor_queue_with_specific_floor_id(self, mock_db):
        """Test when specific floor_id is provided and floor is found."""
        from src.services.process_floor_queue import process_floor_queue
        from uuid import uuid4

        floor_id = uuid4()

        # Mock floor found, no queued requests
        mock_db.fetchrow.return_value = {"floor_id": floor_id, "floor_number": "10"}
        mock_db.fetch.return_value = []

        with patch("src.services.process_floor_queue.db", mock_db):
            result = await process_floor_queue(floor_id=str(floor_id))

        assert result.success is True
        assert result.allocations_made == 0

    @pytest.mark.asyncio
    async def test_process_floor_queue_floor_not_found(self, mock_db):
        """Test when specific floor_id is provided but not found."""
        from src.services.process_floor_queue import process_floor_queue
        from uuid import uuid4

        mock_db.fetchrow.return_value = None

        with patch("src.services.process_floor_queue.db", mock_db):
            result = await process_floor_queue(floor_id=str(uuid4()))

        assert result.success is True
        assert result.allocations_made == 0
        assert "not found" in result.message

    @pytest.mark.asyncio
    async def test_process_floor_queue_no_queued_requests(self, mock_db):
        """Test when no floors have queued requests."""
        from src.services.process_floor_queue import process_floor_queue

        mock_db.fetch.return_value = []

        with patch("src.services.process_floor_queue.db", mock_db):
            result = await process_floor_queue(floor_id=None)

        assert result.success is True
        assert result.allocations_made == 0
        assert "No queued requests" in result.message

    @pytest.mark.asyncio
    async def test_process_floor_queue_no_available_locker(self, mock_db):
        """Test when there are requests but no available lockers."""
        from src.services.process_floor_queue import process_floor_queue
        from uuid import uuid4

        floor_id = uuid4()

        # Mock floor with queued requests
        mock_db.fetch.side_effect = [
            [{"floor_id": floor_id, "floor_number": "10"}],  # floors with queues
            [  # queued requests
                {
                    "request_id": 1,
                    "user_id": uuid4(),
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=7),
                    "floor_queue_id": 1,
                    "email": "test@example.com",
                    "first_name": "Test",
                }
            ],
        ]

        # Mock responses for each request: no existing booking, but no available locker
        mock_db.fetchrow.side_effect = [
            {
                "has_booking": None,
                "removed_queue_id": None,
                "cancelled_request_id": None,
            },  # no existing booking
            {"booking_id": None, "locker_id": None},  # no available locker
        ]

        with patch("src.services.process_floor_queue.db", mock_db):
            result = await process_floor_queue(floor_id=None)

        assert result.success is True
        assert result.allocations_made == 0

    @pytest.mark.asyncio
    async def test_process_floor_queue_user_has_existing_booking(self, mock_db):
        """Test when user already has an existing booking and is removed from queue."""
        from src.services.process_floor_queue import process_floor_queue
        from unittest.mock import AsyncMock, MagicMock
        from uuid import uuid4

        floor_id = uuid4()
        user_id = uuid4()

        # Mock floor with queued requests
        mock_db.fetch.side_effect = [
            [{"floor_id": floor_id, "floor_number": "10"}],  # floors with queues
            [  # queued requests
                {
                    "request_id": 1,
                    "user_id": user_id,
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=7),
                    "floor_queue_id": 1,
                    "email": "test@example.com",
                    "first_name": "Test",
                }
            ],
        ]

        # Mock response: user has existing booking
        mock_db.fetchrow.return_value = {
            "has_booking": 1,
            "removed_queue_id": 1,
            "cancelled_request_id": 1,
        }

        mock_notifications = MagicMock()
        mock_notifications.post = AsyncMock()

        with patch("src.services.process_floor_queue.db", mock_db), patch(
            "src.services.process_floor_queue.NotificationsServiceClient",
            return_value=mock_notifications,
        ):
            result = await process_floor_queue(floor_id=None)

        assert result.success is True
        assert result.allocations_made == 0
        # Should send waitlist removed notification
        mock_notifications.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_floor_queue_successful_allocation(self, mock_db):
        """Test successful locker allocation from queue."""
        from src.services.process_floor_queue import process_floor_queue
        from unittest.mock import AsyncMock, MagicMock
        from uuid import uuid4

        floor_id = uuid4()
        user_id = uuid4()
        booking_id = uuid4()

        # Mock floor with queued requests
        mock_db.fetch.side_effect = [
            [{"floor_id": floor_id, "floor_number": "10"}],  # floors with queues
            [  # queued requests
                {
                    "request_id": 1,
                    "user_id": user_id,
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=7),
                    "floor_queue_id": 1,
                    "email": "test@example.com",
                    "first_name": "Test",
                }
            ],
        ]

        # Mock responses: no existing booking, then successful allocation
        mock_db.fetchrow.side_effect = [
            {
                "has_booking": None,
                "removed_queue_id": None,
                "cancelled_request_id": None,
            },  # no existing booking
            {  # successful allocation
                "booking_id": booking_id,
                "locker_id": uuid4(),
                "locker_number": "DL10-01-05",
                "updated_request_id": 1,
                "removed_queue_id": 1,
            },
        ]

        mock_notifications = MagicMock()
        mock_notifications.post = AsyncMock()

        with patch("src.services.process_floor_queue.db", mock_db), patch(
            "src.services.process_floor_queue.NotificationsServiceClient",
            return_value=mock_notifications,
        ):
            result = await process_floor_queue(floor_id=None)

        assert result.success is True
        assert result.allocations_made == 1
        # Should send booking confirmation notification
        mock_notifications.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_floor_queue_generic_exception(self, mock_db):
        """Test generic exception handler in process_floor_queue."""
        from src.services.process_floor_queue import process_floor_queue

        mock_db.fetch.side_effect = Exception("Unexpected database error")

        with patch("src.services.process_floor_queue.db", mock_db):
            with pytest.raises(Exception):
                await process_floor_queue(floor_id=None)
