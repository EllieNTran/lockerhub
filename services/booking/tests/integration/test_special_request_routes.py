"""Integration tests for special request routes."""

import pytest
from unittest.mock import patch, AsyncMock
from datetime import date, datetime, timedelta
from uuid import uuid4


class TestSpecialRequestRoutes:
    """Test special request HTTP endpoints."""

    pytestmark = pytest.mark.asyncio

    async def test_create_special_request_success(self, test_client):
        """
        Verify end-to-end special request creation through HTTP endpoint.
        Mock service returns successful request response.
        Expect 200 status with request_id.
        """
        request_id = 123
        floor_id = str(uuid4())
        today = date.today()
        end_date = today + timedelta(days=30)

        mock_result = {
            "request_id": request_id,
        }

        with patch(
            "src.routes.bookings.create_special_request",
            AsyncMock(return_value=mock_result),
        ):
            response = await test_client.post(
                "/bookings/special-requests",
                json={
                    "floor_id": floor_id,
                    "start_date": str(today),
                    "end_date": str(end_date),
                    "justification": "Need locker for extended research project",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == request_id

    async def test_create_special_request_permanent(self, test_client):
        """
        Verify creation of permanent allocation special request.
        End date is omitted for permanent allocation.
        Expect 200 status.
        """
        request_id = 124
        floor_id = str(uuid4())
        today = date.today()

        mock_result = {
            "request_id": request_id,
        }

        with patch(
            "src.routes.bookings.create_special_request",
            AsyncMock(return_value=mock_result),
        ):
            response = await test_client.post(
                "/bookings/special-requests",
                json={
                    "floor_id": floor_id,
                    "start_date": str(today),
                    "justification": "Need permanent locker allocation for long-term research",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == request_id

    async def test_create_special_request_with_locker_preference(self, test_client):
        """
        Verify creation with preferred locker specified.
        Mock service processes request with locker_id.
        Expect 200 status.
        """
        request_id = 125
        floor_id = str(uuid4())
        locker_id = str(uuid4())
        today = date.today()

        mock_result = {
            "request_id": request_id,
        }

        with patch(
            "src.routes.bookings.create_special_request",
            AsyncMock(return_value=mock_result),
        ):
            response = await test_client.post(
                "/bookings/special-requests",
                json={
                    "floor_id": floor_id,
                    "locker_id": locker_id,
                    "start_date": str(today),
                    "end_date": str(today + timedelta(days=45)),
                    "justification": "Need specific locker near my department",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == request_id

    async def test_create_special_request_validation_error(self, test_client):
        """
        Verify validation error for missing required fields.
        Omit required justification field.
        Expect 422 validation error.
        """
        floor_id = str(uuid4())
        today = date.today()

        response = await test_client.post(
            "/bookings/special-requests",
            json={
                "floor_id": floor_id,
                "start_date": str(today),
                # Missing justification
            },
        )

        assert response.status_code == 422

    async def test_create_special_request_service_error(self, test_client):
        """
        Verify error handling when service layer fails.
        Mock service raises ValueError.
        Expect 400 status.
        """
        floor_id = str(uuid4())
        today = date.today()

        with patch(
            "src.routes.bookings.create_special_request",
            AsyncMock(side_effect=ValueError("Invalid request parameters")),
        ):
            response = await test_client.post(
                "/bookings/special-requests",
                json={
                    "floor_id": floor_id,
                    "start_date": str(today),
                    "justification": "Test request",
                },
            )

        assert response.status_code == 400
        assert "Invalid request parameters" in response.json()["detail"]

    async def test_get_user_special_requests_success(self, test_client):
        """
        Verify retrieval of user's special requests through HTTP endpoint.
        Mock service returns list of requests.
        Expect 200 status with requests array.
        """
        user_id = uuid4()
        floor_id = uuid4()
        today = date.today()
        now = datetime.now()

        mock_requests = {
            "requests": [
                {
                    "request_id": 1,
                    "user_id": str(user_id),
                    "floor_id": str(floor_id),
                    "locker_id": None,
                    "start_date": str(today),
                    "end_date": str(today + timedelta(days=30)),
                    "request_type": "special",
                    "justification": "Extended research project",
                    "status": "pending",
                    "created_at": now.isoformat(),
                    "reviewed_at": None,
                    "reviewed_by": None,
                    "floor_number": "10",
                    "locker_number": None,
                },
                {
                    "request_id": 2,
                    "user_id": str(user_id),
                    "floor_id": str(floor_id),
                    "locker_id": None,
                    "start_date": str(today - timedelta(days=10)),
                    "end_date": None,
                    "request_type": "special",
                    "justification": "Permanent allocation needed",
                    "status": "approved",
                    "created_at": (now - timedelta(days=10)).isoformat(),
                    "reviewed_at": (now - timedelta(days=5)).isoformat(),
                    "reviewed_by": str(uuid4()),
                    "floor_number": "10",
                    "locker_number": "DL10-01-05",
                },
            ]
        }

        with patch(
            "src.routes.bookings.get_user_special_requests",
            AsyncMock(return_value=mock_requests),
        ):
            response = await test_client.get("/bookings/special-requests")

        assert response.status_code == 200
        data = response.json()
        assert len(data["requests"]) == 2
        assert data["requests"][0]["status"] == "pending"
        assert data["requests"][1]["status"] == "approved"
        assert data["requests"][1]["end_date"] is None  # Permanent

    async def test_get_user_special_requests_empty(self, test_client):
        """
        Verify response when user has no special requests.
        Mock service returns empty list.
        Expect 200 status with empty requests array.
        """
        mock_requests = {"requests": []}

        with patch(
            "src.routes.bookings.get_user_special_requests",
            AsyncMock(return_value=mock_requests),
        ):
            response = await test_client.get("/bookings/special-requests")

        assert response.status_code == 200
        data = response.json()
        assert len(data["requests"]) == 0

    async def test_get_user_special_requests_service_error(self, test_client):
        """
        Verify error handling when retrieval fails.
        Mock service raises exception.
        Expect 500 status.
        """
        with patch(
            "src.routes.bookings.get_user_special_requests",
            AsyncMock(side_effect=Exception("Database error")),
        ):
            response = await test_client.get("/bookings/special-requests")

        assert response.status_code == 500
        assert "Failed to retrieve special requests" in response.json()["detail"]

    async def test_delete_special_request_success(self, test_client):
        """
        Verify successful deletion of special request through HTTP endpoint.
        Mock service deletes request and returns request_id.
        Expect 200 status.
        """
        request_id = 123

        mock_result = {
            "request_id": request_id,
        }

        with patch(
            "src.routes.bookings.delete_special_request",
            AsyncMock(return_value=mock_result),
        ):
            response = await test_client.delete(
                f"/bookings/special-requests/{request_id}"
            )

        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == request_id

    async def test_delete_special_request_not_found(self, test_client):
        """
        Verify error when deleting non-existent request.
        Mock service raises ValueError.
        Expect 400 status.
        """
        request_id = 999

        with patch(
            "src.routes.bookings.delete_special_request",
            AsyncMock(side_effect=ValueError("Special request not found")),
        ):
            response = await test_client.delete(
                f"/bookings/special-requests/{request_id}"
            )

        assert response.status_code == 400
        assert "not found" in response.json()["detail"]

    async def test_delete_special_request_unauthorized(self, test_client):
        """
        Verify error when user attempts to delete another user's request.
        Mock service raises ValueError for authorization.
        Expect 400 status.
        """
        request_id = 123

        with patch(
            "src.routes.bookings.delete_special_request",
            AsyncMock(
                side_effect=ValueError(
                    "User not authorized to delete this special request"
                )
            ),
        ):
            response = await test_client.delete(
                f"/bookings/special-requests/{request_id}"
            )

        assert response.status_code == 400
        assert "not authorized" in response.json()["detail"]
