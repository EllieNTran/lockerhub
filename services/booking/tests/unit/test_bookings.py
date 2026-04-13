"""Unit tests for booking services."""

import pytest
from unittest.mock import patch
from datetime import date, timedelta
from uuid import uuid4

from ..conftest import create_booking_dict, create_user_details_dict


class TestCreateBooking:
    """Tests for the create_booking service."""

    @pytest.mark.asyncio
    async def test_create_booking_success(
        self, mock_db, mock_notifications_client, sample_user_id, sample_locker_id
    ):
        """
        Verify successful booking creation without existing conflicts.
        Mock database returns CTE result with no overlap and new booking.
        Mock notifications service sends confirmation email.
        """
        from src.services.create_booking import create_booking

        today = date.today()
        end_date = today + timedelta(days=2)
        booking_id = uuid4()

        mock_db.fetchrow.return_value = {
            "booking_id": booking_id,
            "has_overlap": False,
            "email": "user@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-01",
            "floor_number": "10",
        }

        with patch("src.services.create_booking.db", mock_db), patch(
            "src.services.create_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await create_booking(
                str(sample_user_id), str(sample_locker_id), today, end_date
            )

        assert result.booking_id == booking_id
        assert mock_db.fetchrow.call_count == 1
        assert mock_notifications_client.post.call_count == 1

    @pytest.mark.asyncio
    async def test_create_booking_existing_conflict(
        self, mock_db, sample_user_id, sample_locker_id
    ):
        """
        Verify booking creation fails when user has overlapping booking.
        Mock database returns CTE result with has_overlap=True.
        Expect ValueError with appropriate message.
        """
        from src.services.create_booking import create_booking

        today = date.today()
        end_date = today + timedelta(days=2)

        mock_db.fetchrow.return_value = {
            "booking_id": None,
            "has_overlap": True,
            "email": None,
            "first_name": None,
            "locker_number": None,
            "floor_number": None,
        }

        with patch("src.services.create_booking.db", mock_db):
            with pytest.raises(ValueError, match="Existing overlapping booking"):
                await create_booking(
                    str(sample_user_id), str(sample_locker_id), today, end_date
                )

    @pytest.mark.asyncio
    async def test_create_booking_no_result(
        self, mock_db, sample_user_id, sample_locker_id
    ):
        """Test when create_booking returns no result."""
        from src.services.create_booking import create_booking

        today = date.today()
        mock_db.fetchrow.return_value = None

        with patch("src.services.create_booking.db", mock_db), patch(
            "src.services.create_booking.NotificationsServiceClient"
        ):
            with pytest.raises(ValueError, match="Failed to create booking"):
                await create_booking(
                    str(sample_user_id),
                    str(sample_locker_id),
                    today,
                    today + timedelta(days=7),
                )

    @pytest.mark.asyncio
    async def test_create_booking_no_booking_id(
        self, mock_db, sample_user_id, sample_locker_id
    ):
        """Test when result exists but booking_id is None."""
        from src.services.create_booking import create_booking

        today = date.today()
        mock_db.fetchrow.return_value = {
            "booking_id": None,
            "has_overlap": False,
            "email": "test@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-05",
            "floor_number": "10",
        }

        with patch("src.services.create_booking.db", mock_db), patch(
            "src.services.create_booking.NotificationsServiceClient"
        ):
            with pytest.raises(ValueError, match="Failed to create booking"):
                await create_booking(
                    str(sample_user_id),
                    str(sample_locker_id),
                    today,
                    today + timedelta(days=7),
                )

    @pytest.mark.asyncio
    async def test_create_booking_exclusion_violation(
        self, mock_db, sample_user_id, sample_locker_id
    ):
        """Test ExclusionViolationError handling (booking conflict)."""
        from src.services.create_booking import create_booking
        from asyncpg.exceptions import ExclusionViolationError

        today = date.today()
        mock_db.fetchrow.side_effect = ExclusionViolationError("exclusion constraint")

        with patch("src.services.create_booking.db", mock_db), patch(
            "src.services.create_booking.NotificationsServiceClient"
        ):
            with pytest.raises(ValueError, match="Booking conflict"):
                await create_booking(
                    str(sample_user_id),
                    str(sample_locker_id),
                    today,
                    today + timedelta(days=7),
                )

    @pytest.mark.asyncio
    async def test_create_booking_generic_exception(
        self, mock_db, sample_user_id, sample_locker_id
    ):
        """Test generic exception handler in create_booking."""
        from src.services.create_booking import create_booking

        today = date.today()
        mock_db.fetchrow.side_effect = Exception("Unexpected database error")

        with patch("src.services.create_booking.db", mock_db), patch(
            "src.services.create_booking.NotificationsServiceClient"
        ):
            with pytest.raises(Exception):
                await create_booking(
                    str(sample_user_id),
                    str(sample_locker_id),
                    today,
                    today + timedelta(days=7),
                )


class TestGetBooking:
    """Tests for the get_booking service."""

    @pytest.mark.asyncio
    async def test_get_booking_success(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify successful retrieval of booking details.
        Mock database returns booking with matching user_id.
        Verify response contains all booking fields.
        """
        from src.services.get_booking import get_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id, user_id=sample_user_id
        )
        mock_db.fetchrow.return_value = booking_data

        with patch("src.services.get_booking.db", mock_db):
            result = await get_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        assert result.user_id == sample_user_id
        assert result.locker_number == "DL10-01-01"

    @pytest.mark.asyncio
    async def test_get_booking_not_found(self, mock_db, sample_user_id):
        """
        Verify error handling when booking does not exist.
        Mock database returns None for booking lookup.
        Expect ValueError with not found message.
        """
        from src.services.get_booking import get_booking

        mock_db.fetchrow.return_value = None

        with patch("src.services.get_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found"):
                await get_booking(str(sample_user_id), "nonexistent-id")

    @pytest.mark.asyncio
    async def test_get_booking_unauthorized(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify authorization check for booking access.
        Mock database returns booking owned by different user.
        Expect ValueError with unauthorized message.
        """
        from src.services.get_booking import get_booking

        other_user_id = uuid4()
        booking_data = create_booking_dict(
            booking_id=sample_booking_id, user_id=other_user_id
        )
        mock_db.fetchrow.return_value = booking_data

        with patch("src.services.get_booking.db", mock_db):
            with pytest.raises(ValueError, match="Unauthorized"):
                await get_booking(str(sample_user_id), str(sample_booking_id))


class TestGetUserBookings:
    """Tests for the get_user_bookings service."""

    @pytest.mark.asyncio
    async def test_get_user_bookings_success(self, mock_db, sample_user_id):
        """
        Verify retrieval of all bookings for a user.
        Mock database returns list of bookings sorted by status.
        Verify response contains multiple booking records.
        """
        from src.services.get_user_bookings import get_user_bookings

        bookings = [
            create_booking_dict(
                user_id=sample_user_id, status="active", booking_status="active"
            ),
            create_booking_dict(
                user_id=sample_user_id, status="upcoming", booking_status="upcoming"
            ),
            create_booking_dict(
                user_id=sample_user_id, status="completed", booking_status="completed"
            ),
        ]
        mock_db.fetch.return_value = bookings

        with patch("src.services.get_user_bookings.db", mock_db):
            result = await get_user_bookings(str(sample_user_id))

        assert len(result.bookings) == 3
        assert all(booking.user_id == sample_user_id for booking in result.bookings)

    @pytest.mark.asyncio
    async def test_get_user_bookings_empty(self, mock_db, sample_user_id):
        """
        Verify handling of user with no bookings.
        Mock database returns empty list.
        Expect empty list response without errors.
        """
        from src.services.get_user_bookings import get_user_bookings

        mock_db.fetch.return_value = []

        with patch("src.services.get_user_bookings.db", mock_db):
            result = await get_user_bookings(str(sample_user_id))

        assert len(result.bookings) == 0

    @pytest.mark.asyncio
    async def test_get_user_bookings_database_error(self, mock_db, sample_user_id):
        """Test exception handler in get_user_bookings."""
        from src.services.get_user_bookings import get_user_bookings

        mock_db.fetch.side_effect = Exception("Database connection failed")

        with patch("src.services.get_user_bookings.db", mock_db):
            with pytest.raises(Exception):
                await get_user_bookings(str(sample_user_id))


class TestCancelBooking:
    """Tests for the cancel_booking service."""

    @pytest.mark.asyncio
    async def test_cancel_booking_success(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify successful booking cancellation.
        Mock database returns CTE result with cancelled booking.
        Verify notification sending.
        """
        from src.services.cancel_booking import cancel_booking

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "status": "active",
            "locker_id": uuid4(),
            "special_request_id": None,
            "email": "user@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-01",
            "floor_number": "10",
            "floor_id": uuid4(),
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=2),
            "key_status": "awaiting_handover",
            "key_number": "K123",
            "cancelled_booking_id": sample_booking_id,
            "new_key_status": "available",
        }
        mock_db.execute.return_value = None

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await cancel_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_cancel_booking_not_found(self, mock_db, sample_user_id):
        """
        Verify error when cancelling non-existent booking.
        Mock database returns None for booking lookup.
        Expect ValueError with not found message.
        """
        from src.services.cancel_booking import cancel_booking

        mock_db.fetchrow.return_value = None

        with patch("src.services.cancel_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found"):
                await cancel_booking(str(sample_user_id), "nonexistent-id")

    @pytest.mark.asyncio
    async def test_cancel_booking_already_cancelled(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify error when cancelling already cancelled booking.
        Mock database returns booking info but no cancelled_booking_id.
        Expect ValueError indicating booking already cancelled.
        """
        from src.services.cancel_booking import cancel_booking

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "status": "cancelled",
            "locker_id": uuid4(),
            "special_request_id": None,
            "email": "user@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-01",
            "locker_status": "available",
            "floor_number": "10",
            "floor_id": uuid4(),
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=2),
            "key_id": uuid4(),
            "key_status": "available",
            "key_number": "K123",
            "cancelled_booking_id": None,
            "cancelled_status": None,
            "cancelled_request_id": None,
            "new_key_status": None,
        }

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            with pytest.raises(ValueError, match="already cancelled"):
                await cancel_booking(str(sample_user_id), str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_cancel_booking_with_special_request(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify that cancelling a booking also cancels associated special request.
        Mock database returns booking with special_request_id in CTE result.
        Verify special request was cancelled in CTE.
        """
        from src.services.cancel_booking import cancel_booking

        special_request_id = 123
        # CTE returns result with cancelled_request_id
        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "status": "active",
            "locker_id": uuid4(),
            "special_request_id": special_request_id,
            "email": "user@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-01",
            "locker_status": "reserved",
            "floor_number": "10",
            "floor_id": uuid4(),
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=2),
            "key_id": uuid4(),
            "key_status": "awaiting_handover",
            "key_number": "K123",
            "cancelled_booking_id": sample_booking_id,
            "cancelled_status": "cancelled",
            "cancelled_request_id": special_request_id,  # Special request was cancelled
            "new_key_status": "available",
        }
        mock_db.execute.return_value = None

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await cancel_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_cancel_booking_without_special_request(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify that cancelling a booking without special request works correctly.
        Mock database returns booking with no special_request_id.
        Verify no special request cancellation in CTE result.
        """
        from src.services.cancel_booking import cancel_booking

        # CTE returns result without special request
        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "status": "active",
            "locker_id": uuid4(),
            "special_request_id": None,
            "email": "user@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-01",
            "locker_status": "reserved",
            "floor_number": "10",
            "floor_id": uuid4(),
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=2),
            "key_id": uuid4(),
            "key_status": "awaiting_handover",
            "key_number": "K123",
            "cancelled_booking_id": sample_booking_id,
            "cancelled_status": "cancelled",
            "cancelled_request_id": None,  # No special request
            "new_key_status": "available",
        }
        mock_db.execute.return_value = None

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await cancel_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_cancel_booking_already_cancelled_no_update(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """Test when booking is already cancelled and update fails."""
        from src.services.cancel_booking import cancel_booking

        # Booking exists and is cancelled, but cancelled_booking_id is None (update failed)
        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "status": "cancelled",
            "cancelled_booking_id": None,
            "locker_id": uuid4(),
            "special_request_id": None,
            "email": "test@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-05",
            "floor_number": "10",
            "floor_id": uuid4(),
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=7),
            "key_status": "awaiting_handover",
            "key_number": "12345",
            "new_key_status": None,
        }

        with patch("src.services.cancel_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking is already cancelled"):
                await cancel_booking(str(sample_user_id), str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_cancel_booking_update_failed(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """Test when booking exists but update fails (cancelled_booking_id is None)."""
        from src.services.cancel_booking import cancel_booking

        # Booking exists and is not cancelled, but update still fails
        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "status": "active",
            "cancelled_booking_id": None,  # Update failed
            "locker_id": uuid4(),
            "special_request_id": None,
            "email": "test@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-05",
            "floor_number": "10",
            "floor_id": uuid4(),
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=7),
            "key_status": "awaiting_handover",
            "key_number": "12345",
            "new_key_status": None,
        }

        with patch("src.services.cancel_booking.db", mock_db):
            with pytest.raises(ValueError, match="Failed to cancel booking"):
                await cancel_booking(str(sample_user_id), str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_cancel_booking_generic_exception(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """Test generic exception handler in cancel_booking."""
        from src.services.cancel_booking import cancel_booking

        mock_db.fetchrow.side_effect = Exception("Unexpected database error")

        with patch("src.services.cancel_booking.db", mock_db):
            with pytest.raises(Exception):
                await cancel_booking(str(sample_user_id), str(sample_booking_id))


class TestExtendBooking:
    """Tests for the extend_booking service."""

    @pytest.mark.asyncio
    async def test_extend_booking_approved(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify successful booking extension when locker is available.
        Mock database returns booking and confirms availability.
        Expect approved extension request with request_id.
        """
        from src.services.extend_booking import extend_booking

        today = date.today()
        new_end_date = today + timedelta(days=5)
        request_id = 1

        # First query: check current end_date
        # Second query: CTE with availability check and extension
        mock_db.fetchrow.side_effect = [
            {"end_date": today + timedelta(days=2)},
            {
                "booking_id": sample_booking_id,
                "user_id": sample_user_id,
                "locker_id": uuid4(),
                "start_date": today,
                "end_date": today + timedelta(days=2),
                "status": "active",
                "special_request_id": None,
                "email": "user@example.com",
                "first_name": "Test",
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "request_id": request_id,
                "request_status": "approved",
                "is_locker_available": True,
                "is_user_available": True,
                "was_extended": sample_booking_id,
            },
        ]

        with patch("src.services.extend_booking.db", mock_db), patch(
            "src.services.extend_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await extend_booking(
                str(sample_booking_id), str(new_end_date), str(sample_user_id)
            )

        assert result.request_id == request_id
        assert result.status == "approved"
        assert mock_db.fetchrow.call_count == 2

    @pytest.mark.asyncio
    async def test_extend_booking_rejected(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify booking extension rejection when locker is unavailable.
        Mock availability check returns False indicating conflict.
        Expect ValueError with appropriate message.
        """
        from src.services.extend_booking import extend_booking

        today = date.today()
        new_end_date = today + timedelta(days=5)
        request_id = 1

        # First query: check current end_date
        # Second query: CTE with availability check (unavailable)
        mock_db.fetchrow.side_effect = [
            {"end_date": today + timedelta(days=2)},
            {
                "booking_id": sample_booking_id,
                "user_id": sample_user_id,
                "locker_id": uuid4(),
                "start_date": today,
                "end_date": today + timedelta(days=2),
                "status": "active",
                "special_request_id": None,
                "email": "user@example.com",
                "first_name": "Test",
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "request_id": request_id,
                "request_status": "rejected",
                "is_locker_available": False,
                "is_user_available": True,
                "was_extended": None,
            },
        ]

        with patch("src.services.extend_booking.db", mock_db), patch(
            "src.services.extend_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            with pytest.raises(
                ValueError, match="already booked during the requested extension period"
            ):
                await extend_booking(
                    str(sample_booking_id), str(new_end_date), str(sample_user_id)
                )

    @pytest.mark.asyncio
    async def test_extend_booking_invalid_date(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify error when new end date is before current end date.
        Mock database returns booking with later end date.
        Expect ValueError indicating invalid date.
        """
        from src.services.extend_booking import extend_booking

        today = date.today()
        current_end = today + timedelta(days=5)
        new_end_date = today + timedelta(days=2)

        mock_db.fetchrow.return_value = {"end_date": current_end}

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(ValueError, match="must be after current end date"):
                await extend_booking(
                    str(sample_booking_id), str(new_end_date), str(sample_user_id)
                )

    @pytest.mark.asyncio
    async def test_extend_booking_not_found(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test when booking not found or unauthorized."""
        from src.services.extend_booking import extend_booking

        mock_db.fetchrow.return_value = None

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found or unauthorized"):
                await extend_booking(
                    str(sample_booking_id),
                    (date.today() + timedelta(days=20)).isoformat(),
                    str(sample_user_id),
                )

    @pytest.mark.asyncio
    async def test_extend_booking_no_result(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test when extension request processing fails (no result)."""
        from src.services.extend_booking import extend_booking

        # First call returns booking, second call returns None
        mock_db.fetchrow.side_effect = [
            {"end_date": date.today() + timedelta(days=7)},
            None,
        ]

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(ValueError, match="Failed to process extension request"):
                await extend_booking(
                    str(sample_booking_id),
                    (date.today() + timedelta(days=20)).isoformat(),
                    str(sample_user_id),
                )

    @pytest.mark.asyncio
    async def test_extend_booking_locker_not_available(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test when extension rejected because locker not available."""
        from src.services.extend_booking import extend_booking

        # First call returns booking, second call returns rejected request
        mock_db.fetchrow.side_effect = [
            {"end_date": date.today() + timedelta(days=7)},
            {
                "request_id": 123,
                "request_status": "rejected",
                "is_locker_available": False,
                "is_user_available": True,
                "email": "test@example.com",
                "first_name": "Test",
                "locker_number": "DL10-01-05",
                "floor_number": "10",
                "end_date": date.today() + timedelta(days=7),
            },
        ]

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(
                ValueError,
                match="This locker is already booked during the requested extension period",
            ):
                await extend_booking(
                    str(sample_booking_id),
                    (date.today() + timedelta(days=20)).isoformat(),
                    str(sample_user_id),
                )

    @pytest.mark.asyncio
    async def test_extend_booking_user_not_available(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test when extension rejected because user has overlapping booking."""
        from src.services.extend_booking import extend_booking

        # First call returns booking, second call returns rejected request
        mock_db.fetchrow.side_effect = [
            {"end_date": date.today() + timedelta(days=7)},
            {
                "request_id": 123,
                "request_status": "rejected",
                "is_locker_available": True,
                "is_user_available": False,
                "email": "test@example.com",
                "first_name": "Test",
                "locker_number": "DL10-01-05",
                "floor_number": "10",
                "end_date": date.today() + timedelta(days=7),
            },
        ]

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(
                ValueError,
                match="You have another active booking that overlaps with this extension period",
            ):
                await extend_booking(
                    str(sample_booking_id),
                    (date.today() + timedelta(days=20)).isoformat(),
                    str(sample_user_id),
                )

    @pytest.mark.asyncio
    async def test_extend_booking_rejected_other_reason(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test when extension rejected for other reasons."""
        from src.services.extend_booking import extend_booking

        # First call returns booking, second call returns rejected request
        mock_db.fetchrow.side_effect = [
            {"end_date": date.today() + timedelta(days=7)},
            {
                "request_id": 123,
                "request_status": "rejected",
                "is_locker_available": True,
                "is_user_available": True,
                "email": "test@example.com",
                "first_name": "Test",
                "locker_number": "DL10-01-05",
                "floor_number": "10",
                "end_date": date.today() + timedelta(days=7),
            },
        ]

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(
                ValueError,
                match="Extension request was rejected. Please contact support",
            ):
                await extend_booking(
                    str(sample_booking_id),
                    (date.today() + timedelta(days=20)).isoformat(),
                    str(sample_user_id),
                )

    @pytest.mark.asyncio
    async def test_extend_booking_generic_exception(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test generic exception handler in extend_booking."""
        from src.services.extend_booking import extend_booking

        mock_db.fetchrow.side_effect = Exception("Unexpected database error")

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(Exception):
                await extend_booking(
                    str(sample_booking_id),
                    (date.today() + timedelta(days=20)).isoformat(),
                    str(sample_user_id),
                )


class TestDeleteBooking:
    """Tests for the delete_booking service."""

    @pytest.mark.asyncio
    async def test_delete_booking_success(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify successful booking deletion.
        Mock database returns CTE result with deleted booking and key info.
        """
        from src.services.delete_booking import delete_booking

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "key_number": "AA123",
            "key_status": "handed_over",
        }

        with patch("src.services.delete_booking.db", mock_db):
            result = await delete_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        assert result.key_number == "AA123"
        assert result.key_status == "handed_over"
        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_delete_booking_not_found(self, mock_db, sample_user_id):
        """
        Verify error when deleting non-existent booking.
        Mock database returns None for booking lookup.
        Expect ValueError with not found message.
        """
        from src.services.delete_booking import delete_booking

        mock_db.fetchrow.return_value = None

        with patch("src.services.delete_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found"):
                await delete_booking(str(sample_user_id), "nonexistent-id")

    @pytest.mark.asyncio
    async def test_delete_booking_unauthorized(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify authorization check for booking deletion.
        CTE returns None when user_id doesn't match (no delete occurs).
        Expect ValueError with unauthorized message.
        """
        from src.services.delete_booking import delete_booking

        mock_db.fetchrow.return_value = None

        with patch("src.services.delete_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found or unauthorized"):
                await delete_booking(str(sample_user_id), str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_delete_booking_generic_exception(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """Test generic exception handler in delete_booking."""
        from src.services.delete_booking import delete_booking

        mock_db.fetchrow.side_effect = Exception("Unexpected database error")

        with patch("src.services.delete_booking.db", mock_db):
            with pytest.raises(Exception):
                await delete_booking(str(sample_user_id), str(sample_booking_id))


class TestUpdateBooking:
    """Tests for the update_booking service."""

    @pytest.mark.asyncio
    async def test_update_booking_shorten_end_date(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify successful booking update by shortening end date.
        Mock database returns booking and updates end date.
        Verify updated booking_id is returned.
        """
        from src.services.update_booking import update_booking

        today = date.today()
        original_end = today + timedelta(days=5)
        new_end_date = today + timedelta(days=3)

        # First query: check booking
        # Second query: CTE update
        mock_db.fetchrow.side_effect = [
            {
                "start_date": today,
                "end_date": original_end,
            },
            {
                "original_start": today,
                "original_end": original_end,
                "booking_id": sample_booking_id,
            },
        ]

        with patch("src.services.update_booking.db", mock_db):
            result = await update_booking(
                str(sample_user_id),
                str(sample_booking_id),
                new_end_date=str(new_end_date),
            )

        assert result.booking_id == sample_booking_id
        assert mock_db.fetchrow.call_count == 2

    @pytest.mark.asyncio
    async def test_update_booking_move_start_date_later(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify successful booking update by moving start date later.
        Mock database returns booking and updates start date.
        Verify updated booking_id is returned.
        """
        from src.services.update_booking import update_booking

        today = date.today()
        original_start = today
        new_start_date = today + timedelta(days=2)
        end_date = today + timedelta(days=5)

        # First query: check booking
        # Second query: CTE update
        mock_db.fetchrow.side_effect = [
            {
                "start_date": original_start,
                "end_date": end_date,
            },
            {
                "original_start": original_start,
                "original_end": end_date,
                "booking_id": sample_booking_id,
            },
        ]

        with patch("src.services.update_booking.db", mock_db):
            result = await update_booking(
                str(sample_user_id),
                str(sample_booking_id),
                new_start_date=str(new_start_date),
            )

        assert result.booking_id == sample_booking_id
        assert mock_db.fetchrow.call_count == 2

    @pytest.mark.asyncio
    async def test_update_booking_not_found(self, mock_db, sample_user_id):
        """
        Verify error when updating non-existent booking.
        Mock database returns None for booking lookup.
        Expect ValueError with not found message.
        """
        from src.services.update_booking import update_booking

        today = date.today()
        mock_db.fetchrow.return_value = None

        with patch("src.services.update_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found"):
                await update_booking(
                    str(sample_user_id),
                    "nonexistent-id",
                    new_end_date=str(today + timedelta(days=3)),
                )

    @pytest.mark.asyncio
    async def test_update_booking_unauthorized(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify authorization check for booking update.
        Mock database returns None when user doesn't own booking.
        Expect ValueError with unauthorized message.
        """
        from src.services.update_booking import update_booking

        today = date.today()
        mock_db.fetchrow.return_value = None

        with patch("src.services.update_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found or unauthorized"):
                await update_booking(
                    str(sample_user_id),
                    str(sample_booking_id),
                    new_end_date=str(today + timedelta(days=3)),
                )

    @pytest.mark.asyncio
    async def test_update_booking_extend_end_date_not_allowed(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify error when trying to extend end date (not allowed in update).
        Mock database returns booking with earlier end date.
        Expect ValueError indicating extension requests should be used.
        """
        from src.services.update_booking import update_booking

        today = date.today()
        original_end = today + timedelta(days=3)
        new_end_date = today + timedelta(days=5)

        mock_db.fetchrow.return_value = {
            "start_date": today,
            "end_date": original_end,
        }

        with patch("src.services.update_booking.db", mock_db):
            with pytest.raises(
                ValueError, match="Cannot move end date later.*extension request"
            ):
                await update_booking(
                    str(sample_user_id),
                    str(sample_booking_id),
                    new_end_date=str(new_end_date),
                )

    @pytest.mark.asyncio
    async def test_update_booking_move_start_date_earlier_not_allowed(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify error when trying to move start date earlier (not allowed).
        Mock database returns booking with later start date.
        Expect ValueError indicating start date cannot be moved earlier.
        """
        from src.services.update_booking import update_booking

        today = date.today()
        original_start = today + timedelta(days=2)
        new_start_date = today

        mock_db.fetchrow.return_value = {
            "start_date": original_start,
            "end_date": today + timedelta(days=5),
        }

        with patch("src.services.update_booking.db", mock_db):
            with pytest.raises(ValueError, match="Cannot move start date earlier"):
                await update_booking(
                    str(sample_user_id),
                    str(sample_booking_id),
                    new_start_date=str(new_start_date),
                )

    @pytest.mark.asyncio
    async def test_update_booking_invalid_date_range(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """
        Verify error when start date is after or equal to end date.
        Mock database returns booking and validates date range.
        Expect ValueError indicating invalid date range.
        """
        from src.services.update_booking import update_booking

        today = date.today()
        start_date = today + timedelta(days=3)
        end_date = today + timedelta(days=2)

        mock_db.fetchrow.return_value = {
            "start_date": today,
            "end_date": today + timedelta(days=5),
        }

        with patch("src.services.update_booking.db", mock_db):
            with pytest.raises(ValueError, match="Start date must be before end date"):
                await update_booking(
                    str(sample_user_id),
                    str(sample_booking_id),
                    new_start_date=str(start_date),
                    new_end_date=str(end_date),
                )

    @pytest.mark.asyncio
    async def test_update_booking_update_failed(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """Test when update fails (no booking_id returned)."""
        from src.services.update_booking import update_booking

        today = date.today()

        # First call returns booking, second call returns no booking_id
        mock_db.fetchrow.side_effect = [
            {
                "start_date": today,
                "end_date": today + timedelta(days=7),
            },
            {
                "original_start": today,
                "original_end": today + timedelta(days=7),
                "booking_id": None,
            },
        ]

        with patch("src.services.update_booking.db", mock_db):
            with pytest.raises(ValueError, match="Failed to update booking"):
                await update_booking(
                    str(sample_user_id),
                    str(sample_booking_id),
                    new_start_date=(today + timedelta(days=1)).isoformat(),
                    new_end_date=(today + timedelta(days=5)).isoformat(),
                )

    @pytest.mark.asyncio
    async def test_update_booking_generic_exception(
        self, mock_db, sample_user_id, sample_booking_id
    ):
        """Test generic exception handler in update_booking."""
        from src.services.update_booking import update_booking

        today = date.today()
        mock_db.fetchrow.side_effect = Exception("Unexpected database error")

        with patch("src.services.update_booking.db", mock_db):
            with pytest.raises(Exception):
                await update_booking(
                    str(sample_user_id),
                    str(sample_booking_id),
                    new_start_date=(today + timedelta(days=1)).isoformat(),
                    new_end_date=(today + timedelta(days=5)).isoformat(),
                )
