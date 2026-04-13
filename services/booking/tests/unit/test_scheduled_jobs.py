"""Unit tests for scheduled job functions."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import date, timedelta
from uuid import uuid4


class TestUpdateBookingStatuses:
    """Tests for the update_booking_statuses scheduled job."""

    @pytest.mark.asyncio
    async def test_bookings_starting_today_success(self, mock_db):
        """
        Verify successful processing of bookings starting today.
        Mock database returns counts of updated lockers and keys.
        Verify appropriate updates and logging.
        """
        from src.scheduled_jobs.jobs.update_booking_statuses import (
            update_booking_statuses,
        )

        today = date.today()
        mock_db.fetchrow.side_effect = [
            {"lockers_count": 2, "keys_count": 2},  # Starting bookings
            {"keys_count": 3},  # Ending bookings
        ]

        with patch("src.scheduled_jobs.jobs.update_booking_statuses.db", mock_db):
            await update_booking_statuses()

        assert mock_db.fetchrow.call_count == 2
        # Verify the queries were called with today's date
        call_args_list = mock_db.fetchrow.call_args_list
        assert call_args_list[0][0][1] == today
        assert call_args_list[1][0][1] == today

    @pytest.mark.asyncio
    async def test_bookings_ending_today_success(self, mock_db):
        """
        Verify successful processing of bookings ending today.
        Mock database returns count of updated keys.
        Verify keys are updated to awaiting_return.
        """
        from src.scheduled_jobs.jobs.update_booking_statuses import (
            update_booking_statuses,
        )

        mock_db.fetchrow.side_effect = [
            {"lockers_count": 0, "keys_count": 0},  # No starting bookings
            {"keys_count": 5},  # 5 ending bookings
        ]

        with patch("src.scheduled_jobs.jobs.update_booking_statuses.db", mock_db):
            await update_booking_statuses()

        assert mock_db.fetchrow.call_count == 2

    @pytest.mark.asyncio
    async def test_no_bookings_to_process(self, mock_db):
        """
        Verify handling when no bookings need processing.
        Mock database returns zero counts.
        Expect no errors, just logging.
        """
        from src.scheduled_jobs.jobs.update_booking_statuses import (
            update_booking_statuses,
        )

        mock_db.fetchrow.side_effect = [
            {"lockers_count": 0, "keys_count": 0},  # No starting bookings
            {"keys_count": 0},  # No ending bookings
        ]

        with patch("src.scheduled_jobs.jobs.update_booking_statuses.db", mock_db):
            await update_booking_statuses()

        assert mock_db.fetchrow.call_count == 2

    @pytest.mark.asyncio
    async def test_only_lockers_updated(self, mock_db):
        """
        Verify handling when only lockers are updated (no keys exist yet).
        Mock database returns locker updates but no key updates.
        """
        from src.scheduled_jobs.jobs.update_booking_statuses import (
            update_booking_statuses,
        )

        mock_db.fetchrow.side_effect = [
            {"lockers_count": 3, "keys_count": 0},  # Lockers but no keys
            {"keys_count": 0},  # No ending bookings
        ]

        with patch("src.scheduled_jobs.jobs.update_booking_statuses.db", mock_db):
            await update_booking_statuses()

        assert mock_db.fetchrow.call_count == 2

    @pytest.mark.asyncio
    async def test_database_error(self, mock_db):
        """
        Verify error handling when database query fails.
        Mock database raises exception.
        Expect exception to be raised and logged.
        """
        from src.scheduled_jobs.jobs.update_booking_statuses import (
            update_booking_statuses,
        )

        mock_db.fetchrow.side_effect = Exception("Database connection error")

        with patch("src.scheduled_jobs.jobs.update_booking_statuses.db", mock_db):
            with pytest.raises(Exception, match="Database connection error"):
                await update_booking_statuses()

    @pytest.mark.asyncio
    async def test_handle_bookings_starting_today_null_result(self, mock_db):
        """
        Verify handling when database returns None.
        Mock database returns None for query result.
        Expect no errors.
        """
        from src.scheduled_jobs.jobs.update_booking_statuses import (
            handle_bookings_starting_today,
        )

        mock_db.fetchrow.return_value = None

        with patch("src.scheduled_jobs.jobs.update_booking_statuses.db", mock_db):
            await handle_bookings_starting_today(date.today())

        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_handle_bookings_ending_today_null_result(self, mock_db):
        """
        Verify handling when database returns None for ending bookings.
        Mock database returns None for query result.
        Expect no errors.
        """
        from src.scheduled_jobs.jobs.update_booking_statuses import (
            handle_bookings_ending_today,
        )

        mock_db.fetchrow.return_value = None

        with patch("src.scheduled_jobs.jobs.update_booking_statuses.db", mock_db):
            await handle_bookings_ending_today(date.today())

        assert mock_db.fetchrow.call_count == 1


class TestExpireOverdueBookings:
    """Tests for the expire_overdue_bookings scheduled job."""

    @pytest.mark.asyncio
    async def test_expire_overdue_bookings_success(self, mock_db):
        """
        Verify successful expiration of overdue bookings.
        Mock database returns expired bookings and updated keys.
        Verify bookings are marked as expired and keys updated.
        """
        from src.scheduled_jobs.jobs.expire_overdue_bookings import (
            expire_overdue_bookings,
        )

        booking_id_1 = uuid4()
        booking_id_2 = uuid4()
        key_id_1 = uuid4()
        key_id_2 = uuid4()

        mock_db.fetchrow.return_value = {
            "expired_count": 2,
            "keys_updated_count": 2,
            "booking_ids": [booking_id_1, booking_id_2],
            "key_ids": [key_id_1, key_id_2],
        }

        with patch("src.scheduled_jobs.jobs.expire_overdue_bookings.db", mock_db):
            await expire_overdue_bookings()

        assert mock_db.fetchrow.call_count == 1
        # Verify query was called with today's date
        call_args = mock_db.fetchrow.call_args
        assert call_args[0][1] == date.today()

    @pytest.mark.asyncio
    async def test_expire_overdue_bookings_no_bookings(self, mock_db):
        """
        Verify handling when no overdue bookings exist.
        Mock database returns zero expired count.
        Expect successful completion with logging.
        """
        from src.scheduled_jobs.jobs.expire_overdue_bookings import (
            expire_overdue_bookings,
        )

        mock_db.fetchrow.return_value = {
            "expired_count": 0,
            "keys_updated_count": 0,
            "booking_ids": [],
            "key_ids": [],
        }

        with patch("src.scheduled_jobs.jobs.expire_overdue_bookings.db", mock_db):
            await expire_overdue_bookings()

        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_expire_overdue_bookings_null_result(self, mock_db):
        """
        Verify handling when database returns None.
        Mock database returns None for query result.
        Expect no errors.
        """
        from src.scheduled_jobs.jobs.expire_overdue_bookings import (
            expire_overdue_bookings,
        )

        mock_db.fetchrow.return_value = None

        with patch("src.scheduled_jobs.jobs.expire_overdue_bookings.db", mock_db):
            await expire_overdue_bookings()

        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_expire_overdue_bookings_with_keys_only(self, mock_db):
        """
        Verify handling when bookings are expired and keys are updated.
        Mock database returns keys that need updating.
        """
        from src.scheduled_jobs.jobs.expire_overdue_bookings import (
            expire_overdue_bookings,
        )

        booking_id = uuid4()
        key_id = uuid4()

        mock_db.fetchrow.return_value = {
            "expired_count": 3,
            "keys_updated_count": 3,
            "booking_ids": [booking_id],
            "key_ids": [key_id],
        }

        with patch("src.scheduled_jobs.jobs.expire_overdue_bookings.db", mock_db):
            await expire_overdue_bookings()

        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_expire_overdue_bookings_database_error(self, mock_db):
        """
        Verify error handling when database query fails.
        Mock database raises exception.
        Expect exception to be raised and logged.
        """
        from src.scheduled_jobs.jobs.expire_overdue_bookings import (
            expire_overdue_bookings,
        )

        mock_db.fetchrow.side_effect = Exception("Database query failed")

        with patch("src.scheduled_jobs.jobs.expire_overdue_bookings.db", mock_db):
            with pytest.raises(Exception, match="Database query failed"):
                await expire_overdue_bookings()


class TestSendKeyReturnReminders:
    """Tests for the send_key_return_reminders scheduled job."""

    @pytest.mark.asyncio
    async def test_send_reminders_success(self, mock_db):
        """
        Verify successful sending of key return reminders.
        Mock database returns bookings ending today.
        Mock notifications service call succeeds.
        """
        from src.scheduled_jobs.jobs.send_key_return_reminders import (
            send_key_return_reminders,
        )

        user_id_1 = uuid4()
        user_id_2 = uuid4()
        booking_id_1 = uuid4()
        booking_id_2 = uuid4()
        locker_id_1 = uuid4()
        locker_id_2 = uuid4()
        today = date.today()

        mock_bookings = [
            {
                "booking_id": booking_id_1,
                "user_id": user_id_1,
                "locker_id": locker_id_1,
                "start_date": today - timedelta(days=7),
                "end_date": today,
                "email": "user1@example.com",
                "first_name": "Alice",
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "key_number": "K-001",
            },
            {
                "booking_id": booking_id_2,
                "user_id": user_id_2,
                "locker_id": locker_id_2,
                "start_date": today - timedelta(days=14),
                "end_date": today,
                "email": "user2@example.com",
                "first_name": "Bob",
                "locker_number": "DL10-01-02",
                "floor_number": "10",
                "key_number": "K-002",
            },
        ]

        mock_db.fetch.return_value = mock_bookings
        mock_notifications_client = MagicMock()
        mock_notifications_client.post = AsyncMock()

        with patch("src.scheduled_jobs.jobs.send_key_return_reminders.db", mock_db):
            with patch(
                "src.scheduled_jobs.jobs.send_key_return_reminders.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ):
                await send_key_return_reminders()

        assert mock_db.fetch.call_count == 1
        assert mock_notifications_client.post.call_count == 2

    @pytest.mark.asyncio
    async def test_send_reminders_no_bookings(self, mock_db):
        """
        Verify handling when no bookings are ending today.
        Mock database returns empty list.
        Expect no notifications sent, just logging.
        """
        from src.scheduled_jobs.jobs.send_key_return_reminders import (
            send_key_return_reminders,
        )

        mock_db.fetch.return_value = []

        with patch("src.scheduled_jobs.jobs.send_key_return_reminders.db", mock_db):
            await send_key_return_reminders()

        assert mock_db.fetch.call_count == 1

    @pytest.mark.asyncio
    async def test_send_reminders_with_null_key_number(self, mock_db):
        """
        Verify handling when key_number is None.
        Mock database returns booking with null key_number.
        Expect "Unknown" to be used as key number.
        """
        from src.scheduled_jobs.jobs.send_key_return_reminders import (
            send_key_return_reminders,
        )

        user_id = uuid4()
        booking_id = uuid4()
        locker_id = uuid4()
        today = date.today()

        mock_bookings = [
            {
                "booking_id": booking_id,
                "user_id": user_id,
                "locker_id": locker_id,
                "start_date": today - timedelta(days=7),
                "end_date": today,
                "email": "user@example.com",
                "first_name": "Alice",
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "key_number": None,  # Null key number
            },
        ]

        mock_db.fetch.return_value = mock_bookings
        mock_notifications_client = MagicMock()
        mock_notifications_client.post = AsyncMock()

        with patch("src.scheduled_jobs.jobs.send_key_return_reminders.db", mock_db):
            with patch(
                "src.scheduled_jobs.jobs.send_key_return_reminders.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ):
                await send_key_return_reminders()

        assert mock_notifications_client.post.call_count == 1
        # Verify "Unknown" was used for key number
        call_args = mock_notifications_client.post.call_args[0]
        assert call_args[1]["keyNumber"] == "Unknown"

    @pytest.mark.asyncio
    async def test_send_reminders_partial_failure(self, mock_db):
        """
        Verify handling when some notifications fail to send.
        Mock database returns multiple bookings.
        Mock one notification succeeds, one fails.
        Expect partial success with error logging.
        """
        from src.scheduled_jobs.jobs.send_key_return_reminders import (
            send_key_return_reminders,
        )

        user_id_1 = uuid4()
        user_id_2 = uuid4()
        booking_id_1 = uuid4()
        booking_id_2 = uuid4()
        locker_id_1 = uuid4()
        locker_id_2 = uuid4()
        today = date.today()

        mock_bookings = [
            {
                "booking_id": booking_id_1,
                "user_id": user_id_1,
                "locker_id": locker_id_1,
                "start_date": today - timedelta(days=7),
                "end_date": today,
                "email": "user1@example.com",
                "first_name": "Alice",
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "key_number": "K-001",
            },
            {
                "booking_id": booking_id_2,
                "user_id": user_id_2,
                "locker_id": locker_id_2,
                "start_date": today - timedelta(days=14),
                "end_date": today,
                "email": "user2@example.com",
                "first_name": "Bob",
                "locker_number": "DL10-01-02",
                "floor_number": "10",
                "key_number": "K-002",
            },
        ]

        mock_db.fetch.return_value = mock_bookings
        mock_notifications_client = MagicMock()
        # First call succeeds, second fails
        mock_notifications_client.post = AsyncMock(
            side_effect=[None, Exception("Network error")]
        )

        with patch("src.scheduled_jobs.jobs.send_key_return_reminders.db", mock_db):
            with patch(
                "src.scheduled_jobs.jobs.send_key_return_reminders.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ):
                await send_key_return_reminders()

        assert mock_notifications_client.post.call_count == 2

    @pytest.mark.asyncio
    async def test_send_reminders_database_error(self, mock_db):
        """
        Verify error handling when database query fails.
        Mock database raises exception.
        Expect exception to be raised and logged.
        """
        from src.scheduled_jobs.jobs.send_key_return_reminders import (
            send_key_return_reminders,
        )

        mock_db.fetch.side_effect = Exception("Database connection error")

        with patch("src.scheduled_jobs.jobs.send_key_return_reminders.db", mock_db):
            with pytest.raises(Exception, match="Database connection error"):
                await send_key_return_reminders()

    @pytest.mark.asyncio
    async def test_send_reminders_all_notifications_fail(self, mock_db):
        """
        Verify handling when all notification attempts fail.
        Mock database returns bookings but all notifications fail.
        Expect job to complete with all errors logged.
        """
        from src.scheduled_jobs.jobs.send_key_return_reminders import (
            send_key_return_reminders,
        )

        user_id = uuid4()
        booking_id = uuid4()
        locker_id = uuid4()
        today = date.today()

        mock_bookings = [
            {
                "booking_id": booking_id,
                "user_id": user_id,
                "locker_id": locker_id,
                "start_date": today - timedelta(days=7),
                "end_date": today,
                "email": "user@example.com",
                "first_name": "Alice",
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "key_number": "K-001",
            },
        ]

        mock_db.fetch.return_value = mock_bookings
        mock_notifications_client = MagicMock()
        mock_notifications_client.post = AsyncMock(
            side_effect=Exception("Service unavailable")
        )

        with patch("src.scheduled_jobs.jobs.send_key_return_reminders.db", mock_db):
            with patch(
                "src.scheduled_jobs.jobs.send_key_return_reminders.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ):
                await send_key_return_reminders()

        assert mock_notifications_client.post.call_count == 1

    @pytest.mark.asyncio
    async def test_send_reminders_payload_format(self, mock_db):
        """
        Verify the notification payload is correctly formatted.
        Mock database returns booking data.
        Verify all required fields are present in payload.
        """
        from src.scheduled_jobs.jobs.send_key_return_reminders import (
            send_key_return_reminders,
        )

        user_id = uuid4()
        booking_id = uuid4()
        locker_id = uuid4()
        today = date.today()
        start_date = today - timedelta(days=7)

        mock_bookings = [
            {
                "booking_id": booking_id,
                "user_id": user_id,
                "locker_id": locker_id,
                "start_date": start_date,
                "end_date": today,
                "email": "user@example.com",
                "first_name": "Alice",
                "locker_number": "DL10-01-01",
                "floor_number": "10",
                "key_number": "K-001",
            },
        ]

        mock_db.fetch.return_value = mock_bookings
        mock_notifications_client = MagicMock()
        mock_notifications_client.post = AsyncMock()

        with patch("src.scheduled_jobs.jobs.send_key_return_reminders.db", mock_db):
            with patch(
                "src.scheduled_jobs.jobs.send_key_return_reminders.NotificationsServiceClient",
                return_value=mock_notifications_client,
            ):
                await send_key_return_reminders()

        # Verify the payload structure
        call_args = mock_notifications_client.post.call_args[0]
        payload = call_args[1]

        assert payload["userId"] == str(user_id)
        assert payload["email"] == "user@example.com"
        assert payload["name"] == "Alice"
        assert payload["lockerNumber"] == "DL10-01-01"
        assert payload["floorNumber"] == "10"
        assert payload["startDate"] == start_date.isoformat()
        assert payload["endDate"] == today.isoformat()
        assert payload["keyNumber"] == "K-001"
        assert payload["keyReturnPath"] == "/user/return-key"
