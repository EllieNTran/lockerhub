"""Exception tests for booking services."""

import pytest
from unittest.mock import patch


@pytest.mark.unit
class TestBookingsExceptions:
    """Tests for exception handling in booking services."""

    @pytest.mark.asyncio
    async def test_cancel_booking_database_error(self, mock_db):
        """Test cancel booking handles database errors."""
        from src.services.bookings.cancel_booking import cancel_booking

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.bookings.cancel_booking.db", mock_db):
            with pytest.raises(Exception):
                await cancel_booking("booking-id", "admin-id")

    @pytest.mark.asyncio
    async def test_create_booking_database_error(self, mock_db):
        """Test create booking handles database errors."""
        from src.services.bookings.create_booking import create_booking
        from datetime import date, timedelta
        from unittest.mock import AsyncMock

        today = date.today()
        start_date = today + timedelta(days=1)
        end_date = today + timedelta(days=3)

        # Mock the transaction to raise an error
        mock_transaction = AsyncMock()
        mock_transaction.__aenter__.side_effect = Exception("Database error")
        mock_transaction.__aexit__ = AsyncMock()
        mock_db.transaction.return_value = mock_transaction

        with patch("src.services.bookings.create_booking.db", mock_db):
            with pytest.raises(Exception):
                await create_booking(
                    user_id="user-id",
                    locker_id="locker-id",
                    start_date=start_date,
                    end_date=end_date,
                    admin_id="admin-id",
                )

    @pytest.mark.asyncio
    async def test_confirm_key_handover_database_error(self, mock_db):
        """Test confirm key handover handles database errors."""
        from src.services.bookings.confirm_key_handover import confirm_key_handover

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.bookings.confirm_key_handover.db", mock_db):
            with pytest.raises(Exception):
                await confirm_key_handover("admin-id", "booking-id")

    @pytest.mark.asyncio
    async def test_confirm_key_return_database_error(self, mock_db):
        """Test confirm key return handles database errors."""
        from src.services.bookings.confirm_key_return import confirm_key_return

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.bookings.confirm_key_return.db", mock_db):
            with pytest.raises(Exception):
                await confirm_key_return("admin-id", "booking-id")

    @pytest.mark.asyncio
    async def test_get_all_bookings_database_error(self, mock_db):
        """Test get all bookings handles database errors."""
        from src.services.bookings.get_all_bookings import get_all_bookings

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.bookings.get_all_bookings.db", mock_db):
            with pytest.raises(Exception):
                await get_all_bookings()
