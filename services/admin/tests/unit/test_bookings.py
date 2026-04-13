"""Unit tests for booking services."""

import pytest
from unittest.mock import patch
from datetime import date, timedelta, datetime
from uuid import uuid4
from ..conftest import create_booking_dict


@pytest.mark.unit
class TestCancelBooking:
    """Tests for cancel_booking service."""

    @pytest.mark.asyncio
    async def test_cancel_booking_success(
        self,
        mock_db,
        mock_notifications_client,
        sample_booking_data,
    ):
        """Test successful booking cancellation."""
        from src.services.bookings.cancel_booking import cancel_booking

        mock_db.fetchrow.return_value = {
            **sample_booking_data,
            "cancelled_booking_id": sample_booking_data["booking_id"],
            "cancelled_status": "cancelled",
            "cancelled_request_id": None,
            "new_key_status": "available",
        }

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            result = await cancel_booking(
                str(sample_booking_data["booking_id"]), "admin-id"
            )

            assert result.booking_id == sample_booking_data["booking_id"]
            assert result.message == "Booking cancelled"
            assert mock_db.fetchrow.call_count == 1
            mock_notifications_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_booking_not_found(self, mock_db):
        """Test canceling a non-existent booking."""
        from src.services.bookings.cancel_booking import cancel_booking

        mock_db.fetchrow.return_value = None

        with patch("src.services.bookings.cancel_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking not found"):
                await cancel_booking("non-existent-id", "admin-id")

    @pytest.mark.asyncio
    async def test_cancel_booking_resets_key_awaiting_handover(
        self, mock_db, mock_notifications_client, sample_booking_id
    ):
        """Test that key in awaiting_handover status is reset to available.

        Verifies that canceling a booking with a key in awaiting_handover status
        resets both the key to available and the reserved locker to available.
        CTE handles all updates in one query.
        """
        from src.services.bookings.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            key_status="awaiting_handover",
            locker_status="reserved",
        )

        mock_db.fetchrow.return_value = {
            **booking_data,
            "cancelled_booking_id": booking_data["booking_id"],
            "cancelled_status": "cancelled",
            "cancelled_request_id": None,
            "new_key_status": "available",
        }

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            await cancel_booking(booking_data["booking_id"], "admin-id")

            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_cancel_booking_with_special_request(
        self, mock_db, mock_notifications_client, sample_booking_id
    ):
        """Test that cancelling a booking also cancels associated special request.

        Verifies that when a booking created from a special request is cancelled,
        the associated special request status is also updated to cancelled.
        CTE handles all updates including special request.
        """
        from src.services.bookings.cancel_booking import cancel_booking

        special_request_id = 456
        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            special_request_id=special_request_id,
            key_status="awaiting_handover",
            locker_status="reserved",
        )

        mock_db.fetchrow.return_value = {
            **booking_data,
            "cancelled_booking_id": booking_data["booking_id"],
            "cancelled_status": "cancelled",
            "cancelled_request_id": special_request_id,
            "new_key_status": "available",
        }

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            await cancel_booking(booking_data["booking_id"], "admin-id")

            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_cancel_booking_without_special_request(
        self, mock_db, mock_notifications_client, sample_booking_id
    ):
        """Test that cancelling a normal booking works without special request logic.

        Verifies that cancelling a booking without an associated special request
        only performs key and locker resets without special request cancellation.
        CTE handles all updates in one query.
        """
        from src.services.bookings.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
            special_request_id=None,
            key_status="awaiting_handover",
            locker_status="reserved",
        )

        mock_db.fetchrow.return_value = {
            **booking_data,
            "cancelled_booking_id": booking_data["booking_id"],
            "cancelled_status": "cancelled",
            "cancelled_request_id": None,
            "new_key_status": "available",
        }

        with patch("src.services.bookings.cancel_booking.db", mock_db), patch(
            "src.services.bookings.cancel_booking.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):

            await cancel_booking(booking_data["booking_id"], "admin-id")

            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_cancel_booking_update_failed(self, mock_db, sample_booking_id):
        """Test cancelling a booking when the update fails.

        Verifies that when the booking exists but the CTE update fails
        (cancelled_booking_id is None), a ValueError is raised.
        """
        from src.services.bookings.cancel_booking import cancel_booking

        booking_data = create_booking_dict(
            booking_id=sample_booking_id,
        )

        # Return booking info but with cancelled_booking_id as None
        mock_db.fetchrow.return_value = {
            **booking_data,
            "cancelled_booking_id": None,  # Update failed
            "cancelled_status": None,
            "cancelled_request_id": None,
            "new_key_status": None,
        }

        with patch("src.services.bookings.cancel_booking.db", mock_db):
            with pytest.raises(ValueError, match="Failed to cancel booking"):
                await cancel_booking(booking_data["booking_id"], "admin-id")


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

        today = date.today()
        start_date = today + timedelta(days=1)
        end_date = today + timedelta(days=3)
        new_booking_id = uuid4()

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
                admin_id=sample_user_id,
            )

            assert result.booking_id == new_booking_id
            mock_notifications_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_booking_starts_today(
        self,
        mock_db,
        mock_notifications_client,
        sample_user_id,
        sample_locker_id,
    ):
        """Test booking creation when start date is today.

        Verifies that when a booking starts today, the system triggers
        pg_notify to update booking statuses immediately.
        """
        from src.services.bookings.create_booking import create_booking
        from unittest.mock import AsyncMock, MagicMock

        today = date.today()
        end_date = today + timedelta(days=2)
        new_booking_id = uuid4()

        # Create mock connection for transaction
        mock_connection = AsyncMock()
        mock_connection.fetchval.return_value = new_booking_id
        mock_connection.execute.return_value = None

        # Mock the transaction context manager
        mock_transaction = MagicMock()
        mock_transaction.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_transaction.__aexit__ = AsyncMock(return_value=None)
        mock_db.transaction.return_value = mock_transaction

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
                start_date=today,
                end_date=end_date,
                admin_id=sample_user_id,
            )

            assert result.booking_id == new_booking_id
            # Verify execute was called for pg_notify
            assert mock_connection.execute.call_count == 1
            call_args = mock_connection.execute.call_args[0]
            assert "pg_notify" in call_args[0]
            mock_notifications_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_booking_conflict(
        self,
        mock_db,
        sample_user_id,
        sample_locker_id,
    ):
        """Test booking creation with conflict.

        Verifies that when there's a booking conflict (overlapping dates on same locker),
        ExclusionViolationError is caught and converted to ValueError.
        """
        from src.services.bookings.create_booking import create_booking
        from asyncpg.exceptions import ExclusionViolationError
        from unittest.mock import AsyncMock, MagicMock

        today = date.today()
        start_date = today + timedelta(days=1)
        end_date = today + timedelta(days=3)

        # Create mock connection that raises ExclusionViolationError
        mock_connection = AsyncMock()
        mock_connection.fetchval.side_effect = ExclusionViolationError(
            "booking conflict"
        )

        # Mock the transaction context manager
        mock_transaction = MagicMock()
        mock_transaction.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_transaction.__aexit__ = AsyncMock(return_value=None)
        mock_db.transaction.return_value = mock_transaction

        with patch("src.services.bookings.create_booking.db", mock_db):
            with pytest.raises(ValueError, match="Booking conflict"):
                await create_booking(
                    user_id=sample_user_id,
                    locker_id=sample_locker_id,
                    start_date=start_date,
                    end_date=end_date,
                    admin_id=sample_user_id,
                )


@pytest.mark.unit
class TestConfirmKeyHandover:
    """Tests for confirm_key_handover service."""

    @pytest.mark.asyncio
    async def test_confirm_key_handover_success(
        self,
        mock_db,
        mock_notifications_client,
        sample_booking_id,
        sample_user_id,
    ):
        """Test successful key handover confirmation.

        Verifies that confirming key handover updates the key status to with_employee
        and the locker status to occupied. CTE returns all updates in one query.
        """
        from src.services.bookings.confirm_key_handover import confirm_key_handover

        key_id = uuid4()

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "locker_number": "DL10-01-01",
            "key_id": key_id,
            "key_number": "AA123",
            "key_status": "with_employee",
            "booking_updated": sample_booking_id,
            "booking_status": "active",
        }

        with patch("src.services.bookings.confirm_key_handover.db", mock_db), patch(
            "src.services.bookings.confirm_key_handover.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await confirm_key_handover(sample_user_id, str(sample_booking_id))

            assert result.booking_id == sample_booking_id
            assert result.key_number == "AA123"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_confirm_key_handover_booking_not_found(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test key handover when booking is not found or in invalid state.

        Verifies that attempting to confirm handover for a non-existent booking,
        a booking not in 'upcoming' status, or with future start date raises ValueError.
        """
        from src.services.bookings.confirm_key_handover import confirm_key_handover

        mock_db.fetchrow.return_value = None

        with patch("src.services.bookings.confirm_key_handover.db", mock_db):
            with pytest.raises(
                ValueError,
                match="Booking not found, not 'upcoming', or start date is in the future",
            ):
                await confirm_key_handover(sample_user_id, str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_confirm_key_handover_key_not_found(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test key handover when key doesn't exist for the locker.

        Verifies that attempting to confirm handover when no key is associated
        with the locker raises ValueError.
        """
        from src.services.bookings.confirm_key_handover import confirm_key_handover

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "locker_number": "DL10-01-01",
            "key_id": None,  # No key found
            "key_number": None,
            "key_status": None,
            "booking_updated": sample_booking_id,
            "booking_status": "active",
        }

        with patch("src.services.bookings.confirm_key_handover.db", mock_db):
            with pytest.raises(ValueError, match="Key not found for this locker"):
                await confirm_key_handover(sample_user_id, str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_confirm_key_handover_booking_update_failed(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test key handover when booking update fails.

        Verifies that when the booking status update fails in the CTE,
        a ValueError is raised.
        """
        from src.services.bookings.confirm_key_handover import confirm_key_handover

        key_id = uuid4()

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "locker_number": "DL10-01-01",
            "key_id": key_id,
            "key_number": "AA123",
            "key_status": "with_employee",
            "booking_updated": None,  # Booking update failed
            "booking_status": None,
        }

        with patch("src.services.bookings.confirm_key_handover.db", mock_db):
            with pytest.raises(ValueError, match="Failed to update booking status"):
                await confirm_key_handover(sample_user_id, str(sample_booking_id))


@pytest.mark.unit
class TestConfirmKeyReturn:
    """Tests for confirm_key_return service."""

    @pytest.mark.asyncio
    async def test_confirm_key_return_success(
        self,
        mock_db,
        mock_notifications_client,
        sample_booking_id,
        sample_user_id,
    ):
        """Test successful key return confirmation.

        Verifies that confirming key return updates the booking status to completed,
        key status to available, and locker status to available. CTE handles all updates.
        """
        from src.services.bookings.confirm_key_return import confirm_key_return

        key_id = uuid4()
        floor_id = uuid4()

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "locker_number": "DL10-01-01",
            "floor_id": floor_id,
            "special_request_id": None,
            "key_id": key_id,
            "key_number": "AA123",
            "key_status": "available",
            "booking_updated": sample_booking_id,
            "booking_status": "completed",
            "special_request_updated": None,
        }

        with patch("src.services.bookings.confirm_key_return.db", mock_db), patch(
            "src.services.bookings.confirm_key_return.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await confirm_key_return(sample_user_id, str(sample_booking_id))

            assert result.booking_id == sample_booking_id
            assert result.key_number == "AA123"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_confirm_key_return_invalid_status(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test key return with invalid key status.

        Verifies that attempting to return a key when booking is not active
        raises a ValueError. CTE returns None when conditions aren't met.
        """
        from src.services.bookings.confirm_key_return import confirm_key_return

        mock_db.fetchrow.return_value = None

        with patch("src.services.bookings.confirm_key_return.db", mock_db):
            with pytest.raises(
                ValueError,
                match="Booking not found or in 'upcoming'/'completed' status",
            ):
                await confirm_key_return(sample_user_id, str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_confirm_key_return_key_not_found(
        self, mock_db, sample_booking_id, sample_user_id
    ):
        """Test key return when key doesn't exist for the locker.

        Verifies that attempting to confirm return when no key is associated
        with the locker raises ValueError.
        """
        from src.services.bookings.confirm_key_return import confirm_key_return

        floor_id = uuid4()

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "locker_number": "DL10-01-01",
            "floor_id": floor_id,
            "special_request_id": None,
            "key_id": None,  # No key found
            "key_number": None,
            "key_status": None,
            "booking_updated": sample_booking_id,
            "booking_status": "completed",
            "special_request_updated": None,
        }

        with patch("src.services.bookings.confirm_key_return.db", mock_db):
            with pytest.raises(ValueError, match="Key not found for this locker"):
                await confirm_key_return(sample_user_id, str(sample_booking_id))

    @pytest.mark.asyncio
    async def test_confirm_key_return_with_special_request(
        self,
        mock_db,
        mock_notifications_client,
        sample_booking_id,
        sample_user_id,
    ):
        """Test successful key return with special request completion.

        Verifies that confirming key return for a booking linked to a special request
        also updates the special request status to completed.
        """
        from src.services.bookings.confirm_key_return import confirm_key_return

        key_id = uuid4()
        floor_id = uuid4()
        special_request_id = 789

        mock_db.fetchrow.return_value = {
            "booking_id": sample_booking_id,
            "user_id": sample_user_id,
            "locker_number": "DL10-01-01",
            "floor_id": floor_id,
            "special_request_id": special_request_id,
            "key_id": key_id,
            "key_number": "AA123",
            "key_status": "available",
            "booking_updated": sample_booking_id,
            "booking_status": "completed",
            "special_request_updated": special_request_id,
        }

        with patch("src.services.bookings.confirm_key_return.db", mock_db), patch(
            "src.services.bookings.confirm_key_return.NotificationsServiceClient",
            return_value=mock_notifications_client,
        ):
            result = await confirm_key_return(sample_user_id, str(sample_booking_id))

            assert result.booking_id == sample_booking_id
            assert result.key_number == "AA123"
            assert mock_db.fetchrow.call_count == 1
            # Verify execute was called for pg_notify
            assert mock_db.execute.call_count == 1


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
