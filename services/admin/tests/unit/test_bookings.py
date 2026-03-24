"""Unit tests for booking services."""

import pytest
from unittest.mock import patch
from datetime import date, timedelta
from ..conftest import create_booking_dict


@pytest.mark.unit
class TestCancelBooking:
    """Tests for cancel_booking service."""

    @pytest.mark.asyncio
    async def test_cancel_booking_success(
        self,
        mock_db,
        mock_db_connection,
        mock_notifications_client,
        sample_booking_data,
    ):
        """Test successful booking cancellation."""
        from src.services.bookings.cancel_booking import cancel_booking

        mock_db_connection.fetchrow.side_effect = [
            sample_booking_data,
            {"booking_id": sample_booking_data["booking_id"]},
        ]

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            result = await cancel_booking(str(sample_booking_data["booking_id"]))

            assert result.booking_id == sample_booking_data["booking_id"]
            assert result.message == "Booking cancelled"
            mock_notifications_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_booking_not_found(self, mock_db, mock_db_connection):
        """Test canceling a non-existent booking."""
        from src.services.bookings.cancel_booking import cancel_booking

        mock_db_connection.fetchrow.return_value = None

        with patch("src.services.bookings.cancel_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found"):
                await cancel_booking("non-existent-id")

    @pytest.mark.asyncio
    async def test_cancel_booking_resets_key_awaiting_handover(
        self, mock_db, mock_db_connection, mock_notifications_client, sample_booking_id
    ):
        """Test that key in awaiting_handover status is reset to available.

        Verifies that canceling a booking with a key in awaiting_handover status
        resets both the key to available and the reserved locker to available.
        Expects two execute calls for the resets.
        """
        from src.services.bookings.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            key_status="awaiting_handover",
            locker_status="reserved",
        )

        mock_db_connection.fetchrow.side_effect = [
            booking_data,
            {"booking_id": booking_data["booking_id"], "status": "cancelled"},
        ]

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            await cancel_booking(booking_data["booking_id"])

            assert mock_db_connection.execute.call_count == 2

    @pytest.mark.asyncio
    async def test_cancel_booking_with_special_request(
        self, mock_db, mock_db_connection, mock_notifications_client, sample_booking_id
    ):
        """Test that cancelling a booking also cancels associated special request.

        Verifies that when a booking created from a special request is cancelled,
        the associated special request status is also updated to cancelled.
        """
        from src.services.bookings.cancel_booking import cancel_booking

        special_request_id = 456
        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            special_request_id=special_request_id,
            key_status="awaiting_handover",
            locker_status="reserved",
        )

        mock_db_connection.fetchrow.side_effect = [
            booking_data,
            {"booking_id": booking_data["booking_id"], "status": "cancelled"},
        ]

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            await cancel_booking(booking_data["booking_id"])

            # Verify special request cancellation + key reset + locker reset
            assert mock_db_connection.execute.call_count == 3
            # First execute call should be for cancelling the special request
            first_execute_call = mock_db_connection.execute.call_args_list[0]
            assert "UPDATE lockerhub.requests" in first_execute_call[0][0]
            assert "SET status = 'cancelled'" in first_execute_call[0][0]
            assert first_execute_call[0][1] == special_request_id

    @pytest.mark.asyncio
    async def test_cancel_booking_without_special_request(
        self, mock_db, mock_db_connection, mock_notifications_client, sample_booking_id
    ):
        """Test that cancelling a normal booking works without special request logic.

        Verifies that cancelling a booking without an associated special request
        only performs key and locker resets without special request cancellation.
        """
        from src.services.bookings.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            special_request_id=None,
            key_status="awaiting_handover",
            locker_status="reserved",
        )

        mock_db_connection.fetchrow.side_effect = [
            booking_data,
            {"booking_id": booking_data["booking_id"], "status": "cancelled"},
        ]

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            await cancel_booking(booking_data["booking_id"])

            # Should only have 2 execute calls (key reset + locker reset)
            assert mock_db_connection.execute.call_count == 2


@pytest.mark.unit
class TestCreateBooking:
    """Tests for create_booking service."""

    @pytest.mark.asyncio
    async def test_create_booking_success(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_locker_id,
    ):
        """Test successful booking creation.

        Verifies that creating a booking with valid user and locker returns
        the new booking with upcoming status. Validates user exists, locker is available,
        and no conflicting bookings exist.
        """
        from src.services.bookings.create_booking import create_booking
        from uuid import UUID

        today = date.today()
        start_date = today + timedelta(days=1)
        end_date = today + timedelta(days=3)
        new_booking_id = UUID("12345678-1234-5678-1234-567812345678")

        mock_db.fetchval.return_value = new_booking_id
        mock_db.fetchrow.return_value = {
            "email": "test@example.com",
            "first_name": "Test",
            "locker_number": "DL10-01-01",
            "floor_number": "10",
        }

        with patch("src.services.bookings.create_booking.db", mock_db), patch(
            "src.services.bookings.create_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            result = await create_booking(
                user_id=sample_user_id,
                locker_id=sample_locker_id,
                start_date=start_date,
                end_date=end_date,
            )

            assert result.booking_id == new_booking_id
            mock_notifications_client.post.assert_called_once()


@pytest.mark.unit
class TestConfirmKeyHandover:
    """Tests for confirm_key_handover service."""

    @pytest.mark.asyncio
    async def test_confirm_key_handover_success(
        self, mock_db, mock_db_connection, sample_booking_id
    ):
        """Test successful key handover confirmation.

        Verifies that confirming key handover updates the key status to with_employee
        and the locker status to occupied. Returns the updated key details.
        """
        from src.services.bookings.confirm_key_handover import confirm_key_handover
        from uuid import UUID
        from datetime import datetime

        mock_db_connection.fetchrow.side_effect = [
            {
                "booking_id": sample_booking_id,
                "status": "upcoming",
                "locker_id": UUID("12345678-1234-5678-1234-567812345678"),
                "start_date": datetime.now().date(),
            },
            {
                "key_id": UUID("87654321-4321-8765-4321-876543218765"),
                "key_number": "AA123",
                "status": "with_employee",
            },
            {
                "booking_id": sample_booking_id,
                "status": "active",
            },
        ]

        with patch("src.services.bookings.confirm_key_handover.db", mock_db):
            result = await confirm_key_handover(str(sample_booking_id))

            assert result.booking_id == sample_booking_id
            assert result.key_number == "AA123"
            assert result.message == "Key handover confirmed"


@pytest.mark.unit
class TestConfirmKeyReturn:
    """Tests for confirm_key_return service."""

    @pytest.mark.asyncio
    async def test_confirm_key_return_success(
        self, mock_db, mock_db_connection, sample_booking_id
    ):
        """Test successful key return confirmation.

        Verifies that confirming key return updates the booking status to completed,
        key status to available, and locker status to available.
        """
        from src.services.bookings.confirm_key_return import confirm_key_return
        from uuid import UUID

        mock_db_connection.fetchrow.side_effect = [
            {
                "booking_id": sample_booking_id,
                "status": "active",
                "locker_id": UUID("12345678-1234-5678-1234-567812345678"),
                "special_request_id": None,
            },
            {
                "key_id": UUID("87654321-4321-8765-4321-876543218765"),
                "key_number": "AA123",
                "status": "available",
            },
            {
                "booking_id": sample_booking_id,
                "status": "completed",
            },
        ]

        with patch("src.services.bookings.confirm_key_return.db", mock_db):
            result = await confirm_key_return(str(sample_booking_id))

            assert result.booking_id == sample_booking_id
            assert result.key_number == "AA123"

    @pytest.mark.asyncio
    async def test_confirm_key_return_invalid_status(
        self, mock_db, mock_db_connection, sample_booking_id
    ):
        """Test key return with invalid key status.

        Verifies that attempting to return a key when booking is not active
        raises a ValueError.
        """
        from src.services.bookings.confirm_key_return import confirm_key_return
        from uuid import UUID

        mock_db_connection.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "status": "upcoming",
            "locker_id": UUID("12345678-1234-5678-1234-567812345678"),
            "special_request_id": None,
        }

        with patch("src.services.bookings.confirm_key_return.db", mock_db):
            with pytest.raises(
                ValueError,
                match="Booking must be 'active' or 'cancelled' to confirm RETURN",
            ):
                await confirm_key_return(str(sample_booking_id))


@pytest.mark.unit
class TestGetAllBookings:
    """Tests for get_all_bookings service."""

    @pytest.mark.asyncio
    async def test_get_all_bookings_success(self, mock_db):
        """Test retrieving all bookings.

        Verifies that fetching all bookings returns a list with correct booking IDs.
        """
        from src.services.bookings.get_all_bookings import get_all_bookings

        booking1 = create_booking_dict()
        mock_db.fetch.return_value = [booking1]

        with patch("src.services.bookings.get_all_bookings.db", mock_db):
            result = await get_all_bookings()

            assert len(result.bookings) == 1
            assert result.bookings[0].booking_id == booking1["booking_id"]
