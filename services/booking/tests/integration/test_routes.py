"""Integration tests for booking routes."""

import pytest
from unittest.mock import patch, AsyncMock
from datetime import date, datetime, timedelta
from uuid import uuid4


class TestBookingRoutes:
    """Test booking HTTP endpoints."""

    pytestmark = pytest.mark.asyncio

    async def test_create_booking_success(self, test_client):
        """
        Verify end-to-end booking creation through HTTP endpoint.
        Mock service returns successful booking response.
        Expect 200 status with booking details.
        """
        booking_id = uuid4()
        locker_id = str(uuid4())
        today = date.today()
        end_date = today + timedelta(days=3)

        mock_result = {
            "booking_id": booking_id,
        }

        with patch(
            "src.routes.bookings.create_booking", AsyncMock(return_value=mock_result)
        ):
            response = await test_client.post(
                "/bookings",
                json={
                    "locker_id": locker_id,
                    "start_date": str(today),
                    "end_date": str(end_date),
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["booking_id"] == str(booking_id)

    async def test_create_booking_conflict(self, test_client):
        """
        Verify error handling for booking conflicts.
        Mock service raises ValueError for overlapping bookings.
        Expect 409 status.
        """
        locker_id = str(uuid4())
        today = date.today()

        with patch(
            "src.routes.bookings.create_booking",
            AsyncMock(
                side_effect=ValueError("Locker is not available for the selected dates")
            ),
        ):
            response = await test_client.post(
                "/bookings",
                json={
                    "locker_id": locker_id,
                    "start_date": str(today),
                    "end_date": str(today + timedelta(days=2)),
                },
            )

        assert response.status_code == 409
        assert "not available" in response.json()["detail"]

    async def test_get_user_bookings(self, test_client):
        """
        Verify retrieval of user bookings through HTTP endpoint.
        Mock service returns list of bookings.
        Expect 200 status with bookings array.
        """
        booking_id = uuid4()
        user_id = uuid4()
        locker_id = uuid4()
        today = date.today()
        now = datetime.now()

        mock_bookings = [
            {
                "booking_id": booking_id,
                "user_id": user_id,
                "locker_id": locker_id,
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "start_date": today,
                "end_date": today + timedelta(days=3),
                "booking_status": "active",
                "special_request_id": None,
                "created_at": now,
                "updated_at": now,
            }
        ]

        from src.models.responses import BookingListResponse, BookingResponse

        mock_response = BookingListResponse(
            bookings=[BookingResponse(**booking) for booking in mock_bookings]
        )

        with patch(
            "src.routes.bookings.get_user_bookings",
            AsyncMock(return_value=mock_response),
        ):
            response = await test_client.get("/bookings")

        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        assert len(data["bookings"]) == 1
        assert data["bookings"][0]["booking_id"] == str(booking_id)

    async def test_get_booking_by_id(self, test_client):
        """
        Verify retrieval of specific booking by ID.
        Mock service returns booking details.
        Expect 200 status with booking data.
        """
        booking_id = uuid4()
        user_id = uuid4()
        locker_id = uuid4()
        today = date.today()
        now = datetime.now()

        mock_booking = {
            "booking_id": booking_id,
            "user_id": user_id,
            "locker_id": locker_id,
            "locker_number": "DL10-01-01",
            "floor_number": "10",
            "start_date": today,
            "end_date": today + timedelta(days=3),
            "booking_status": "active",
            "special_request_id": None,
            "created_at": now,
            "updated_at": now,
        }

        from src.models.responses import BookingResponse

        mock_response = BookingResponse(**mock_booking)

        with patch(
            "src.routes.bookings.get_booking", AsyncMock(return_value=mock_response)
        ):
            response = await test_client.get(f"/bookings/{str(booking_id)}")

        assert response.status_code == 200
        data = response.json()
        assert data["booking_id"] == str(booking_id)
        assert data["locker_number"] == "DL10-01-01"

    async def test_get_booking_not_found(self, test_client):
        """
        Verify error handling for non-existent booking.
        Mock service raises ValueError.
        Expect 404 status.
        """
        booking_id = str(uuid4())

        with patch(
            "src.routes.bookings.get_booking",
            AsyncMock(side_effect=ValueError("Booking not found")),
        ):
            response = await test_client.get(f"/bookings/{booking_id}")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    async def test_cancel_booking(self, test_client):
        """
        Verify booking cancellation through HTTP endpoint.
        Mock service returns cancellation confirmation.
        Expect 200 status with success message.
        """
        booking_id = uuid4()

        mock_result = {
            "booking_id": booking_id,
        }

        with patch(
            "src.routes.bookings.cancel_booking", AsyncMock(return_value=mock_result)
        ):
            response = await test_client.put(f"/bookings/{str(booking_id)}/cancel")

        assert response.status_code == 200
        data = response.json()
        assert data["booking_id"] == str(booking_id)

    async def test_extend_booking(self, test_client):
        """
        Verify booking extension through HTTP endpoint.
        Mock service returns extension confirmation.
        Expect 200 status with request details.
        """
        booking_id = uuid4()
        new_end_date = date.today() + timedelta(days=7)

        mock_result = {
            "request_id": 123,
            "status": "pending",
        }

        with patch(
            "src.routes.bookings.extend_booking", AsyncMock(return_value=mock_result)
        ):
            response = await test_client.post(
                f"/bookings/{str(booking_id)}/extend",
                json={"new_end_date": str(new_end_date)},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == 123
        assert data["status"] == "pending"

    async def test_update_booking(self, test_client):
        """
        Verify booking update (shorten) through HTTP endpoint.
        Mock service returns update confirmation.
        Expect 200 status with booking_id.
        """
        booking_id = uuid4()
        new_end_date = date.today() + timedelta(days=2)

        # UpdateBookingResponse only expects booking_id
        mock_result = {
            "booking_id": booking_id,
        }

        with patch(
            "src.routes.bookings.update_booking", AsyncMock(return_value=mock_result)
        ):
            response = await test_client.put(
                f"/bookings/{str(booking_id)}",
                json={"new_end_date": str(new_end_date)},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["booking_id"] == str(booking_id)


class TestLockerRoutes:
    """Test locker availability HTTP endpoints."""

    pytestmark = pytest.mark.asyncio

    async def test_get_available_lockers(self, test_client):
        """
        Verify retrieval of available lockers for a floor.
        Mock service returns list of lockers with availability.
        Expect 200 status with lockers array.
        """
        floor_id = str(uuid4())
        today = date.today()
        end_date = today + timedelta(days=3)
        now = datetime.now()

        mock_lockers = [
            {
                "locker_id": uuid4(),
                "locker_number": "DL10-01-01",
                "floor_id": uuid4(),
                "location": "Near elevator",
                "status": "available",
                "x_coordinate": 100,
                "y_coordinate": 200,
                "created_at": now,
                "updated_at": now,
                "is_available": True,
                "is_permanently_allocated": False,
            },
            {
                "locker_id": uuid4(),
                "locker_number": "DL10-01-02",
                "floor_id": uuid4(),
                "location": "Near stairs",
                "status": "occupied",
                "x_coordinate": 150,
                "y_coordinate": 250,
                "created_at": now,
                "updated_at": now,
                "is_available": False,
                "is_permanently_allocated": False,
            },
        ]

        with patch(
            "src.routes.bookings.get_available_lockers",
            AsyncMock(return_value=mock_lockers),
        ):
            response = await test_client.get(
                f"/bookings/lockers/available?floor_id={floor_id}&start_date={today}&end_date={end_date}"
            )

        assert response.status_code == 200
        data = response.json()
        assert "lockers" in data
        assert len(data["lockers"]) == 2

    async def test_check_locker_availability(self, test_client):
        """
        Verify locker availability check for date range.
        Mock service returns availability status.
        Expect 200 status with availability boolean.
        """
        locker_id = str(uuid4())
        today = date.today()
        end_date = today + timedelta(days=3)

        with patch(
            "src.routes.bookings.check_locker_availability",
            AsyncMock(return_value=True),
        ):
            response = await test_client.get(
                f"/bookings/lockers/{locker_id}/availability?start_date={today}&end_date={end_date}"
            )

        assert response.status_code == 200
        data = response.json()
        assert data["available"] is True
        assert data["locker_id"] == locker_id


class TestFloorRoutes:
    """Test floor HTTP endpoints."""

    pytestmark = pytest.mark.asyncio

    async def test_get_floors(self, test_client):
        """
        Verify retrieval of all open floors.
        Mock service returns list of floors.
        Expect 200 status with floors array.
        """
        now = datetime.now()

        mock_floors = [
            {
                "floor_id": uuid4(),
                "floor_number": "10",
                "status": "open",
                "created_at": now,
                "updated_at": now,
            },
            {
                "floor_id": uuid4(),
                "floor_number": "11",
                "status": "open",
                "created_at": now,
                "updated_at": now,
            },
        ]

        from src.models.responses import FloorsResponse, FloorResponse

        mock_response = FloorsResponse(
            floors=[FloorResponse(**floor) for floor in mock_floors]
        )

        with patch(
            "src.routes.bookings.get_floors", AsyncMock(return_value=mock_response)
        ):
            response = await test_client.get("/bookings/floors")

        assert response.status_code == 200
        data = response.json()
        assert "floors" in data
        assert len(data["floors"]) == 2


class TestWaitlistRoutes:
    """Test waitlist HTTP endpoints."""

    pytestmark = pytest.mark.asyncio

    async def test_join_waitlist(self, test_client):
        """
        Verify joining floor waitlist through HTTP endpoint.
        Mock service returns queue position.
        Expect 200 status with queue details.
        """
        floor_id = str(uuid4())
        today = date.today()
        end_date = today + timedelta(days=3)

        mock_result = {
            "floor_queue_id": 123,
            "request_id": 456,
            "floor_number": "10",
        }

        with patch(
            "src.routes.bookings.join_floor_queue", AsyncMock(return_value=mock_result)
        ):
            response = await test_client.post(
                "/bookings/waitlist/join",
                json={
                    "floor_id": floor_id,
                    "start_date": str(today),
                    "end_date": str(end_date),
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["floor_queue_id"] == 123
        assert data["request_id"] == 456
        assert data["floor_number"] == "10"

    async def test_join_waitlist_duplicate(self, test_client):
        """
        Verify error handling for duplicate waitlist entries.
        Mock service raises ValueError.
        Expect 409 status.
        """
        floor_id = str(uuid4())
        today = date.today()

        with patch(
            "src.routes.bookings.join_floor_queue",
            AsyncMock(side_effect=ValueError("Already in waitlist")),
        ):
            response = await test_client.post(
                "/bookings/waitlist/join",
                json={
                    "floor_id": floor_id,
                    "start_date": str(today),
                    "end_date": str(today + timedelta(days=2)),
                },
            )

        assert response.status_code == 409


class TestScheduledJobRoutes:
    """Test scheduled job HTTP endpoints."""

    pytestmark = pytest.mark.asyncio

    async def test_process_floor_queues(self, test_client):
        """
        Verify processing of floor queues through HTTP endpoint.
        Mock job returns processing results.
        Expect 200 status with allocation count.
        """
        from src.models.responses import ProcessFloorQueuesResponse

        mock_result = ProcessFloorQueuesResponse(
            success=True,
            allocations_made=3,
            message="Processed floor queues",
        )

        with patch(
            "src.routes.scheduled_jobs.process_floor_queues",
            AsyncMock(return_value=mock_result),
        ):
            response = await test_client.post("/scheduled-jobs/process-floor-queues")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Process floor queues job completed"


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
