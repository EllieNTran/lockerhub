"""Unit tests for booking services."""

import pytest
from unittest.mock import patch
from datetime import date, timedelta
from uuid import UUID

from ..conftest import create_booking_dict, create_user_details_dict


class TestCreateBooking:
    """Tests for the create_booking service."""

    @pytest.mark.asyncio
    async def test_create_booking_success(
        self, mock_db, mock_notifications_client, sample_user_id, sample_locker_id
    ):
        """
        Verify successful booking creation without existing conflicts.
        Mock database returns no existing bookings and creates new booking.
        Mock notifications service sends confirmation email.
        """
        from src.services.create_booking import create_booking

        today = date.today()
        end_date = today + timedelta(days=2)
        booking_id = UUID("12345678-1234-1234-1234-123456789abc")

        mock_db.fetchrow.side_effect = [
            None,
            create_user_details_dict(),
        ]
        mock_db.fetchval.return_value = booking_id

        with patch("src.services.create_booking.db", mock_db), patch(
            "src.services.create_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await create_booking(
                str(sample_user_id), str(sample_locker_id), today, end_date
            )

        assert result.booking_id == booking_id
        assert mock_db.fetchrow.call_count == 2
        assert mock_db.fetchval.call_count == 1
        assert mock_notifications_client.post.call_count == 1

    @pytest.mark.asyncio
    async def test_create_booking_existing_conflict(
        self, mock_db, sample_user_id, sample_locker_id
    ):
        """
        Verify booking creation fails when user has overlapping booking.
        Mock database returns existing booking with date conflict.
        Expect ValueError with appropriate message.
        """
        from src.services.create_booking import create_booking

        today = date.today()
        end_date = today + timedelta(days=2)

        mock_db.fetchrow.return_value = create_booking_dict()

        with patch("src.services.create_booking.db", mock_db):
            with pytest.raises(ValueError, match="Existing overlapping booking"):
                await create_booking(
                    str(sample_user_id), str(sample_locker_id), today, end_date
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
        from uuid import uuid4

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


class TestCancelBooking:
    """Tests for the cancel_booking service."""

    @pytest.mark.asyncio
    async def test_cancel_booking_success(
        self,
        mock_db_connection,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify successful booking cancellation.
        Mock database updates booking status to cancelled.
        Verify transaction management and notification sending.
        """
        from src.services.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            user_id=sample_user_id,
            status="active",
            booking_status="active",
            key_status="awaiting_handover",
        )
        mock_db_connection.fetchrow.return_value = booking_data
        mock_db_connection.fetchval.return_value = sample_booking_id

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await cancel_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        assert mock_db_connection.fetchrow.call_count == 1
        assert mock_db_connection.fetchval.call_count == 1

    @pytest.mark.asyncio
    async def test_cancel_booking_not_found(
        self, mock_db_connection, mock_db, sample_user_id
    ):
        """
        Verify error when cancelling non-existent booking.
        Mock database returns None for booking lookup.
        Expect ValueError with not found message.
        """
        from src.services.cancel_booking import cancel_booking

        mock_db_connection.fetchrow.return_value = None

        with patch("src.services.cancel_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found"):
                await cancel_booking(str(sample_user_id), "nonexistent-id")

    @pytest.mark.asyncio
    async def test_cancel_booking_already_cancelled(
        self,
        mock_db_connection,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify error when cancelling already cancelled booking.
        Mock database returns booking with cancelled status.
        Expect ValueError indicating booking already cancelled.
        """
        from src.services.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            user_id=sample_user_id,
            status="cancelled",
            booking_status="cancelled",
        )
        mock_db_connection.fetchrow.return_value = booking_data

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            with pytest.raises(ValueError, match="already cancelled"):
                await cancel_booking(str(sample_user_id), str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_cancel_booking_with_special_request(
        self,
        mock_db_connection,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify that cancelling a booking also cancels associated special request.
        Mock database returns booking with special_request_id.
        Verify special request status is updated to cancelled.
        """
        from src.services.cancel_booking import cancel_booking

        special_request_id = 123
        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            user_id=sample_user_id,
            status="active",
            booking_status="active",
            special_request_id=special_request_id,
            key_status="awaiting_handover",  # Set to trigger key reset
        )
        mock_db_connection.fetchrow.return_value = booking_data
        mock_db_connection.fetchval.return_value = sample_booking_id

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await cancel_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        # Verify special request cancellation was called
        assert (
            mock_db_connection.execute.call_count == 3
        )  # Cancel request + reset key + reset locker
        # First execute call should be for cancelling the special request
        first_execute_call = mock_db_connection.execute.call_args_list[0]
        assert "UPDATE lockerhub.requests" in first_execute_call[0][0]
        assert "SET status = 'cancelled'" in first_execute_call[0][0]
        assert first_execute_call[0][1] == special_request_id

    @pytest.mark.asyncio
    async def test_cancel_booking_without_special_request(
        self,
        mock_db_connection,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify that cancelling a booking without special request works correctly.
        Mock database returns booking with no special_request_id.
        Verify only key and locker resets are executed.
        """
        from src.services.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            user_id=sample_user_id,
            status="active",
            booking_status="active",
            special_request_id=None,
            key_status="awaiting_handover",
        )
        mock_db_connection.fetchrow.return_value = booking_data
        mock_db_connection.fetchval.return_value = sample_booking_id

        with patch("src.services.cancel_booking.db", mock_db), patch(
            "src.services.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await cancel_booking(str(sample_user_id), str(sample_booking_id))

        assert result.booking_id == sample_booking_id
        # Should only have 2 execute calls (reset key + reset locker), no special request cancellation
        assert mock_db_connection.execute.call_count == 2


class TestExtendBooking:
    """Tests for the extend_booking service."""

    @pytest.mark.asyncio
    async def test_extend_booking_approved(
        self,
        mock_db_connection,
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

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            user_id=sample_user_id,
            end_date=today + timedelta(days=2),
        )
        request_id = 1

        mock_db_connection.fetchrow.return_value = booking_data
        mock_db_connection.fetchval.return_value = request_id

        with patch("src.services.extend_booking.db", mock_db), patch(
            "src.services.extend_booking.check_locker_availability",
            return_value=True,
        ), patch(
            "src.services.extend_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await extend_booking(
                str(sample_booking_id), str(new_end_date), str(sample_user_id)
            )

        assert result.request_id == request_id
        assert result.status == "approved"

    @pytest.mark.asyncio
    async def test_extend_booking_rejected(
        self,
        mock_db_connection,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_booking_id,
    ):
        """
        Verify booking extension rejection when locker is unavailable.
        Mock availability check returns False indicating conflict.
        Expect rejected extension request.
        """
        from src.services.extend_booking import extend_booking

        today = date.today()
        new_end_date = today + timedelta(days=5)

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            user_id=sample_user_id,
            end_date=today + timedelta(days=2),
        )
        request_id = 1

        mock_db_connection.fetchrow.return_value = booking_data
        mock_db_connection.fetchval.return_value = request_id

        with patch("src.services.extend_booking.db", mock_db), patch(
            "src.services.extend_booking.check_locker_availability",
            return_value=False,
        ), patch(
            "src.services.extend_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await extend_booking(
                str(sample_booking_id), str(new_end_date), str(sample_user_id)
            )

        assert result.request_id == request_id
        assert result.status == "rejected"

    @pytest.mark.asyncio
    async def test_extend_booking_invalid_date(
        self, mock_db_connection, mock_db, sample_user_id, sample_booking_id
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

        booking_data = create_booking_dict(
            booking_id=sample_booking_id, user_id=sample_user_id, end_date=current_end
        )
        mock_db_connection.fetchrow.return_value = booking_data

        with patch("src.services.extend_booking.db", mock_db):
            with pytest.raises(ValueError, match="must be after current end date"):
                await extend_booking(
                    str(sample_booking_id), str(new_end_date), str(sample_user_id)
                )
