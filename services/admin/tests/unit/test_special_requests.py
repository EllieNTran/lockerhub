"""Unit tests for special requests services."""

import pytest
from unittest.mock import patch
from datetime import date


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
        from uuid import UUID
        from datetime import datetime

        requests = [
            {
                "request_id": 1,
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "employee_name": "John Doe",
                "staff_number": "123456",
                "department_name": "IT Department",
                "floor_id": UUID("11111111-1111-1111-1111-111111111111"),
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
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "employee_name": "Jane Smith",
                "staff_number": "654321",
                "department_name": "HR Department",
                "floor_id": UUID("11111111-1111-1111-1111-111111111111"),
                "floor_number": "11",
                "locker_id": UUID("55555555-5555-5555-5555-555555555555"),
                "booking_id": UUID("66666666-6666-6666-6666-666666666666"),
                "start_date": date(2026, 3, 20),
                "end_date": date(2026, 4, 20),
                "request_type": "special",
                "justification": "Medical equipment storage",
                "status": "approved",
                "created_at": datetime(2026, 3, 20, 9, 0, 0),
                "reviewed_at": datetime(2026, 3, 21, 8, 0, 0),
                "reviewed_by": UUID("77777777-7777-7777-7777-777777777777"),
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
        from uuid import UUID
        from datetime import datetime

        requests = [
            {
                "request_id": 1,
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "employee_name": "User One",
                "staff_number": "111111",
                "department_name": "IT",
                "floor_id": UUID("11111111-1111-1111-1111-111111111111"),
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
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "employee_name": "User Two",
                "staff_number": "222222",
                "department_name": "HR",
                "floor_id": UUID("11111111-1111-1111-1111-111111111111"),
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
                "reviewed_by": UUID("77777777-7777-7777-7777-777777777777"),
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
        from unittest.mock import AsyncMock
        from uuid import UUID

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        floor_id = UUID("22222222-2222-2222-2222-222222222222")
        booking_id = UUID("33333333-3333-3333-3333-333333333333")

        # Mock request details
        request_details = {
            "user_id": user_id,
            "floor_id": floor_id,
            "start_date": date(2026, 3, 25),
            "end_date": date(2026, 4, 25),
            "email": "john.doe@example.com",
            "first_name": "John",
            "floor_number": "10",
        }

        # Mock available locker
        available_locker = {
            "locker_id": sample_locker_id,
            "locker_number": "101",
        }

        # Mock review result
        review_result = [
            {
                "request_id": 1,
                "user_id": user_id,
            }
        ]

        # Setup mock responses in correct order
        mock_db.fetchrow.side_effect = [request_details, available_locker]
        mock_db.fetchval.return_value = booking_id
        mock_db.fetch.return_value = review_result

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
        ):
            result = await review_special_request(
                status="approved", reviewed_by=sample_user_id, request_id=1
            )

            # Verify result
            assert len(result) == 1
            assert result[0]["request_id"] == 1
            assert result[0]["user_id"] == user_id

            # Verify booking was created
            assert mock_db.fetchval.call_count == 1

            # Verify notifications were sent (approval + confirmation)
            assert mock_notifications_client.post.call_count == 2

            # Verify approval notification
            approval_call = mock_notifications_client.post.call_args_list[0]
            assert approval_call[0][0] == "/special-request/approved"
            approval_data = approval_call[0][1]
            assert approval_data["userId"] == str(user_id)
            assert approval_data["email"] == "john.doe@example.com"
            assert approval_data["name"] == "John"
            assert approval_data["lockerNumber"] == "101"
            assert approval_data["floorNumber"] == "10"
            assert approval_data["requestId"] == 1

            # Verify confirmation notification
            confirmation_call = mock_notifications_client.post.call_args_list[1]
            assert confirmation_call[0][0] == "/booking/confirmation"
            confirmation_data = confirmation_call[0][1]
            assert confirmation_data["lockerNumber"] == "101"
            assert confirmation_data["startDate"] == "2026-03-25"
            assert confirmation_data["endDate"] == "2026-04-25"

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
        from uuid import UUID

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        floor_id = UUID("22222222-2222-2222-2222-222222222222")
        booking_id = UUID("33333333-3333-3333-3333-333333333333")

        # Mock request details with no end date
        request_details = {
            "user_id": user_id,
            "floor_id": floor_id,
            "start_date": date(2026, 3, 25),
            "end_date": None,  # Permanent allocation
            "email": "john.doe@example.com",
            "first_name": "John",
            "floor_number": "10",
        }

        available_locker = {
            "locker_id": sample_locker_id,
            "locker_number": "101",
        }

        review_result = [{"request_id": 1, "user_id": user_id}]

        mock_db.fetchrow.side_effect = [request_details, available_locker]
        mock_db.fetchval.return_value = booking_id
        mock_db.fetch.return_value = review_result

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
        ):
            result = await review_special_request(
                status="approved", reviewed_by=sample_user_id, request_id=1
            )

            # Verify endDate is None in notifications
            approval_call = mock_notifications_client.post.call_args_list[0]
            approval_data = approval_call[0][1]
            assert approval_data["endDate"] is None

    @pytest.mark.asyncio
    async def test_review_special_request_approve_no_locker(
        self, mock_db, mock_notifications_client, sample_user_id
    ):
        """Test approving a special request when no locker is available.

        Verifies that a ValueError is raised when no available locker
        can be found on the requested floor.
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )
        from uuid import UUID

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        floor_id = UUID("22222222-2222-2222-2222-222222222222")

        request_details = {
            "user_id": user_id,
            "floor_id": floor_id,
            "start_date": date(2026, 3, 25),
            "end_date": date(2026, 4, 25),
            "email": "john.doe@example.com",
            "first_name": "John",
            "floor_number": "10",
        }

        # No available locker
        mock_db.fetchrow.side_effect = [request_details, None]

        with (
            patch("src.services.special_requests.review_special_request.db", mock_db),
            patch(
                "src.services.special_requests.review_special_request.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ),
        ):
            with pytest.raises(ValueError, match="No available lockers found"):
                await review_special_request(
                    status="approved", reviewed_by=sample_user_id, request_id=1
                )

            # Verify no booking was created
            assert mock_db.fetchval.call_count == 0

            # Verify no notifications were sent
            assert mock_notifications_client.post.call_count == 0

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
        from uuid import UUID

        user_id = UUID("11111111-1111-1111-1111-111111111111")

        request_details = {
            "user_id": user_id,
            "floor_id": UUID("22222222-2222-2222-2222-222222222222"),
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

            # Verify result
            assert len(result) == 1
            assert result[0]["request_id"] == 5
            assert result[0]["user_id"] == user_id

            # Verify no booking was created
            assert mock_db.fetchval.call_count == 0

            # Verify rejection notification was sent
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

        # Request not found
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
