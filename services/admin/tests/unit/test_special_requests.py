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
            },
        ]
        mock_db.fetch.return_value = requests

        with patch(
            "src.services.special_requests.get_all_special_requests.db", mock_db
        ):
            result = await get_all_special_requests()

            assert len(result) == 2
            assert result[0].request_id == 1
            assert result[0].employee_name == "John Doe"
            assert result[0].staff_number == "123456"
            assert result[0].status == "pending"
            assert result[0].justification == "Need extended booking for project work"
            assert result[0].reviewed_at is None
            assert result[1].request_id == 2
            assert result[1].status == "approved"
            assert result[1].reviewed_by is not None

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

            assert len(result) == 0

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
            },
        ]
        mock_db.fetch.return_value = requests

        with patch(
            "src.services.special_requests.get_all_special_requests.db", mock_db
        ):
            result = await get_all_special_requests()

            assert len(result) == 2
            assert result[0].status == "pending"
            assert result[1].status == "rejected"


@pytest.mark.unit
class TestReviewSpecialRequest:
    """Tests for review_special_request service."""

    @pytest.mark.asyncio
    async def test_review_special_request_approve(self, mock_db, sample_user_id):
        """Test approving a special request.

        Verifies that approving a special request updates the status correctly
        and returns the request ID and user ID.
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )
        from uuid import UUID

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        request_result = [
            {
                "request_id": 1,
                "user_id": user_id,
            }
        ]
        mock_db.fetch.return_value = request_result

        with patch("src.services.special_requests.review_special_request.db", mock_db):
            result = await review_special_request(
                status="approved", reviewed_by=sample_user_id, request_id=1
            )

            assert len(result) == 1
            assert result[0]["request_id"] == 1
            assert result[0]["user_id"] == user_id

    @pytest.mark.asyncio
    async def test_review_special_request_reject(self, mock_db, sample_user_id):
        """Test rejecting a special request.

        Verifies that rejecting a special request updates the status correctly
        and returns the request ID and user ID.
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )
        from uuid import UUID

        user_id = UUID("11111111-1111-1111-1111-111111111111")
        request_result = [
            {
                "request_id": 5,
                "user_id": user_id,
            }
        ]
        mock_db.fetch.return_value = request_result

        with patch("src.services.special_requests.review_special_request.db", mock_db):
            result = await review_special_request(
                status="rejected", reviewed_by=sample_user_id, request_id=5
            )

            assert len(result) == 1
            assert result[0]["request_id"] == 5
            assert result[0]["user_id"] == user_id

    @pytest.mark.asyncio
    async def test_review_special_request_multiple_results(
        self, mock_db, sample_user_id
    ):
        """Test reviewing a request that returns multiple results.

        Verifies that the service correctly handles and returns multiple
        result rows if the database returns them.
        """
        from src.services.special_requests.review_special_request import (
            review_special_request,
        )
        from uuid import UUID

        request_results = [
            {
                "request_id": 3,
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
            },
            {
                "request_id": 4,
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
            },
        ]
        mock_db.fetch.return_value = request_results

        with patch("src.services.special_requests.review_special_request.db", mock_db):
            result = await review_special_request(
                status="approved", reviewed_by=sample_user_id, request_id=3
            )

            assert len(result) == 2
            assert result[0]["request_id"] == 3
            assert result[1]["request_id"] == 4
