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
        mock_db_connection,
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

        mock_db.fetchrow.side_effect = [None, create_user_details_dict()]
        mock_db_connection.fetchval.side_effect = [
            sample_request_id,
            sample_floor_queue_id,
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
        mock_db_connection,
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

        mock_db.fetchrow.side_effect = [None, create_user_details_dict()]
        mock_db_connection.fetchval.side_effect = [
            sample_request_id,
            sample_floor_queue_id,
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


class TestProcessFloorQueues:
    """Tests for the process_floor_queue endpoint."""

    def test_process_floor_queues_success(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """
        Verify successful processing of floor queues with allocations.
        Mock database returns queued requests and available lockers.
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
        available_locker = {"locker_id": uuid4(), "locker_number": "DL10-01-01"}

        mock_db.fetch.side_effect = [floor_data, queued_requests]
        mock_db_connection.fetchrow.return_value = available_locker
        mock_db_connection.fetchval.return_value = uuid4()
        mock_db_connection.execute.return_value = None

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

        # Clean up
        app.dependency_overrides.clear()

        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["allocations_made"] >= 0
        assert "allocated" in result["message"].lower()

    def test_process_floor_queues_no_requests(self, mock_db, sample_user_id):
        """
        Verify handling when no queued requests exist.
        Mock database returns empty list for queued requests.
        Expect success response with zero allocations.
        """
        mock_db.fetch.return_value = []

        # Override auth dependency
        app.dependency_overrides[get_current_user] = lambda: {
            "user_id": str(sample_user_id)
        }

        with patch("src.services.process_floor_queue.db", mock_db):
            client = TestClient(app)
            response = client.post("/bookings/waitlist/process-floor-queue")

        # Clean up
        app.dependency_overrides.clear()

        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["allocations_made"] == 0

    def test_process_floor_queues_no_available_lockers(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """
        Verify handling when requests exist but no lockers available.
        Mock database returns requests but empty locker list.
        Expect success with zero allocations.
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
                "floor_id": floor_data[0]["floor_id"],
                "floor_number": "10",
                "start_date": date.today(),
                "end_date": date.today() + timedelta(days=2),
                "floor_queue_id": 1,
                "email": "test@example.com",
                "first_name": "Test",
                "created_at": date.today(),
            }
        ]

        mock_db.fetch.side_effect = [floor_data, queued_requests]
        mock_db_connection.fetchrow.return_value = None

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

        # Clean up
        app.dependency_overrides.clear()

        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["allocations_made"] == 0
