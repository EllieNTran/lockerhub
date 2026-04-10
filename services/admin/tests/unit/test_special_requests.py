"""Unit tests for special requests services."""

import pytest
from unittest.mock import patch, AsyncMock
from datetime import date, datetime
from uuid import uuid4

from src.models.responses import CreateBookingResponse


@pytest.mark.unit
class TestGetAllSpecialRequests:
    """Tests for get_all_special_requests service."""

    @pytest.mark.asyncio
    async def test_get_all_special_requests_success(self, mock_db):
        """Test retrieving all special requests.

        Verifies that fetching special requests returns a list with correct
        request details including user info, dates, and status.
        """
        from src.services.special_requests.get_all_special_requests import (
            get_all_special_requests,
        )

        requests = [
            {
                "request_id": 1,
                "user_id": uuid4(),
                "employee_name": "John Doe",
                "staff_number": "123456",
                "department_name": "IT Department",
                "floor_id": uuid4(),
                "floor_number": "10",
                "locker_id": None,
                "booking_id": None,
                "start_date": date(2026, 3, 25),
                "end_date": date(2026, 4, 25),
                "request_type": "special",
                "justification": "Need extended booking for project work",
                "status": "pending",
                "created_at": datetime(2026, 3, 21, 10, 0, 0),
                "reviewed_at": None,
                "reviewed_by": None,
                "reason": None,
            },
            {
                "request_id": 2,
                "user_id": uuid4(),
                "employee_name": "Jane Smith",
                "staff_number": "654321",
                "department_name": "HR Department",
                "floor_id": uuid4(),
                "floor_number": "11",
                "locker_id": uuid4(),
                "booking_id": uuid4(),
                "start_date": date(2026, 3, 20),
                "end_date": date(2026, 4, 20),
                "request_type": "special",
                "justification": "Medical equipment storage",
                "status": "approved",
                "created_at": datetime(2026, 3, 20, 9, 0, 0),
                "reviewed_at": datetime(2026, 3, 21, 8, 0, 0),
                "reviewed_by": uuid4(),
                "reason": None,
            },
        ]
        mock_db.fetch.return_value = requests

        with patch(
            "src.services.special_requests.get_all_special_requests.db", mock_db
        ):
            result = await get_all_special_requests()

            assert len(result.requests) == 2
            assert result.requests[0].request_id == 1
            assert result.requests[0].employee_name == "John Doe"
            assert result.requests[0].staff_number == "123456"
            assert result.requests[0].status == "pending"
            assert (
                result.requests[0].justification
                == "Need extended booking for project work"
            )
            assert result.requests[0].reviewed_at is None
            assert result.requests[1].request_id == 2
            assert result.requests[1].status == "approved"
            assert result.requests[1].reviewed_by is not None

    @pytest.mark.asyncio
    async def test_get_all_special_requests_empty(self, mock_db):
        """Test retrieving special requests when none exist.

        Verifies that fetching special requests from an empty database
        returns an empty list.
        """
        from src.services.special_requests.get_all_special_requests import (
            get_all_special_requests,
        )

        mock_db.fetch.return_value = []

        with patch(
            "src.services.special_requests.get_all_special_requests.db", mock_db
        ):
            result = await get_all_special_requests()

            assert len(result.requests) == 0

    @pytest.mark.asyncio
    async def test_get_all_special_requests_multiple_statuses(self, mock_db):
        """Test retrieving special requests with various statuses.

        Verifies that requests are returned with correct status values
        including pending, approved, active, and rejected.
        """
        from src.services.special_requests.get_all_special_requests import (
            get_all_special_requests,
        )

        requests = [
            {
                "request_id": 1,
                "user_id": uuid4(),
                "employee_name": "User One",
                "staff_number": "111111",
                "department_name": "IT",
                "floor_id": uuid4(),
                "floor_number": "10",
                "locker_id": None,
                "booking_id": None,
                "start_date": date(2026, 3, 25),
                "end_date": date(2026, 4, 25),
                "request_type": "special",
                "justification": "Reason 1",
                "status": "pending",
                "created_at": datetime(2026, 3, 21, 10, 0, 0),
                "reviewed_at": None,
                "reviewed_by": None,
                "reason": None,
            },
            {
                "request_id": 2,
                "user_id": uuid4(),
                "employee_name": "User Two",
                "staff_number": "222222",
                "department_name": "HR",
                "floor_id": uuid4(),
                "floor_number": "11",
                "locker_id": None,
                "booking_id": None,
                "start_date": date(2026, 3, 20),
                "end_date": date(2026, 4, 20),
                "request_type": "special",
                "justification": "Reason 2",
                "status": "rejected",
                "created_at": datetime(2026, 3, 20, 9, 0, 0),
                "reviewed_at": datetime(2026, 3, 21, 8, 0, 0),
                "reviewed_by": uuid4(),
                "reason": "Not enough justification",
            },
        ]
        mock_db.fetch.return_value = requests

        with patch(
            "src.services.special_requests.get_all_special_requests.db", mock_db
        ):
            result = await get_all_special_requests()

            assert len(result.requests) == 2
            assert result.requests[0].status == "pending"
            assert result.requests[1].status == "rejected"


@pytest.mark.unit
class TestReviewSpecialRequest:
    """Tests for review_special_request service."""

    @pytest.mark.asyncio
    async def test_review_special_request_approve(
        self, mock_db, mock_notifications_client, sample_user_id, sample_locker_id
    ):
        """Test approving a special request.

        Verifies that approving a special request:
        - Finds an available locker
        - Creates a booking
        - Sends approval and confirmation notifications
        - Updates request status
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )

        user_id = uuid4()
        floor_id = uuid4()
        booking_id = uuid4()

        request_details = {
            "user_id": user_id,
            "floor_id": floor_id,
            "start_date": date(2026, 3, 25),
            "end_date": date(2026, 4, 25),
            "email": "john.doe@example.com",
            "first_name": "John",
            "floor_number": "10",
            "locker_id": sample_locker_id,
            "locker_number": "101",
        }

        review_result = [
            {
                "request_id": 1,
                "user_id": user_id,
            }
        ]

        mock_db.fetchrow.return_value = request_details
        mock_db.fetch.return_value = review_result

        mock_create_booking = AsyncMock(
            return_value=CreateBookingResponse(booking_id=booking_id)
        )

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
            patch(
                "src.services.special_requests.review_special_request.create_booking",
                mock_create_booking,
            ),
        ):
            result = await review_special_request(
                status="approved", reviewed_by=sample_user_id, request_id=1
            )

            assert len(result) == 1
            assert result[0]["request_id"] == 1
            assert result[0]["user_id"] == user_id

            mock_create_booking.assert_called_once_with(
                user_id=str(user_id),
                locker_id=str(sample_locker_id),
                start_date=date(2026, 3, 25),
                end_date=date(2026, 4, 25),
                admin_id=sample_user_id,
                special_request_id=1,
            )

            assert mock_notifications_client.post.call_count == 1
            approval_call = mock_notifications_client.post.call_args_list[0]
            assert approval_call[0][0] == "/special-request/approved"
            approval_data = approval_call[0][1]
            assert approval_data["userId"] == str(user_id)
            assert approval_data["email"] == "john.doe@example.com"
            assert approval_data["name"] == "John"
            assert approval_data["lockerNumber"] == "101"
            assert approval_data["floorNumber"] == "10"
            assert approval_data["requestId"] == 1

    @pytest.mark.asyncio
    async def test_review_special_request_approve_permanent(
        self, mock_db, mock_notifications_client, sample_user_id, sample_locker_id
    ):
        """Test approving a special request with no end date (permanent allocation).

        Verifies that permanent allocations are handled correctly with null end_date.
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )

        user_id = uuid4()
        floor_id = uuid4()
        booking_id = uuid4()

        request_details = {
            "user_id": user_id,
            "floor_id": floor_id,
            "start_date": date(2026, 3, 25),
            "end_date": None,
            "email": "jane.smith@example.com",
            "first_name": "Jane",
            "floor_number": "11",
            "locker_id": sample_locker_id,
            "locker_number": "205",
        }

        review_result = [{"request_id": 1, "user_id": user_id}]

        mock_db.fetchrow.return_value = request_details
        mock_db.fetch.return_value = review_result

        mock_create_booking = AsyncMock(
            return_value=CreateBookingResponse(booking_id=booking_id)
        )

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
            patch(
                "src.services.special_requests.review_special_request.create_booking",
                mock_create_booking,
            ),
        ):
            await review_special_request(
                status="approved", reviewed_by=sample_user_id, request_id=1
            )

            mock_create_booking.assert_called_once_with(
                user_id=str(user_id),
                locker_id=str(sample_locker_id),
                start_date=date(2026, 3, 25),
                end_date=None,
                admin_id=sample_user_id,
                special_request_id=1,
            )

            approval_call = mock_notifications_client.post.call_args_list[0]
            approval_data = approval_call[0][1]
            assert approval_data["endDate"] is None

    @pytest.mark.asyncio
    async def test_review_special_request_approve_no_locker(
        self, mock_db, mock_notifications_client, sample_user_id
    ):
        """Test approving a special request when no locker is available.

        Verifies that the request is auto-rejected with an appropriate reason
        when no available locker can be found on the requested floor.
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )

        user_id = uuid4()
        floor_id = uuid4()

        request_details = {
            "user_id": user_id,
            "floor_id": floor_id,
            "start_date": date(2026, 3, 25),
            "end_date": date(2026, 6, 25),
            "email": "bob.jones@example.com",
            "first_name": "Bob",
            "floor_number": "7",
            "locker_id": None,
            "locker_number": None,
        }

        review_result = [{"request_id": 1, "user_id": user_id}]

        mock_db.fetchrow.return_value = request_details
        mock_db.fetch.return_value = review_result

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
        ):
            mock_create_booking = AsyncMock()

            with patch(
                "src.services.special_requests.review_special_request.create_booking",
                mock_create_booking,
            ):
                result = await review_special_request(
                    status="approved", reviewed_by=sample_user_id, request_id=1
                )

            mock_create_booking.assert_not_called()

            assert len(result) == 1
            assert result[0]["request_id"] == 1

            assert mock_notifications_client.post.call_count == 1
            rejection_call = mock_notifications_client.post.call_args_list[0]
            assert rejection_call[0][0] == "/special-request/rejected"
            rejection_data = rejection_call[0][1]
            assert rejection_data["userId"] == str(user_id)
            assert rejection_data["email"] == "bob.jones@example.com"
            assert rejection_data["name"] == "Bob"
            assert "No available lockers" in rejection_data["reason"]
            assert (
                "different dates" in rejection_data["reason"]
                or "different floor" in rejection_data["reason"]
            )

    @pytest.mark.asyncio
    async def test_review_special_request_reject(
        self, mock_db, mock_notifications_client, sample_user_id
    ):
        """Test rejecting a special request.

        Verifies that rejecting a special request:
        - Sends rejection notification with reason
        - Updates request status with reason
        - Does not create a booking
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )

        user_id = uuid4()

        request_details = {
            "user_id": user_id,
            "floor_id": uuid4(),
            "start_date": date(2026, 3, 25),
            "end_date": date(2026, 4, 25),
            "email": "john.doe@example.com",
            "first_name": "John",
            "floor_number": "10",
        }

        review_result = [{"request_id": 5, "user_id": user_id}]

        mock_db.fetchrow.return_value = request_details
        mock_db.fetch.return_value = review_result

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
        ):
            result = await review_special_request(
                status="rejected",
                reviewed_by=sample_user_id,
                request_id=5,
                reason="Insufficient justification provided",
            )

            assert len(result) == 1
            assert result[0]["request_id"] == 5
            assert result[0]["user_id"] == user_id

            assert mock_db.fetchval.call_count == 0

            assert mock_notifications_client.post.call_count == 1

            rejection_call = mock_notifications_client.post.call_args_list[0]
            assert rejection_call[0][0] == "/special-request/rejected"
            rejection_data = rejection_call[0][1]
            assert rejection_data["userId"] == str(user_id)
            assert rejection_data["email"] == "john.doe@example.com"
            assert rejection_data["name"] == "John"
            assert rejection_data["reason"] == "Insufficient justification provided"
            assert rejection_data["requestId"] == 5

    @pytest.mark.asyncio
    async def test_review_special_request_not_found(
        self, mock_db, mock_notifications_client, sample_user_id
    ):
        """Test reviewing a non-existent special request.

        Verifies that a ValueError is raised when the request doesn't exist.
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )

        mock_db.fetchrow.return_value = None

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
        ):
            with pytest.raises(ValueError, match="Request not found"):
                await review_special_request(
                    status="approved", reviewed_by=sample_user_id, request_id=999
                )
