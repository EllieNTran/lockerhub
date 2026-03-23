"""Unit tests for locker services."""

import pytest
from unittest.mock import patch
from datetime import date, timedelta

from ..conftest import create_locker_dict


class TestGetAvailableLockers:
    """Tests for the get_available_lockers service."""

    @pytest.mark.asyncio
    async def test_get_available_lockers_success(self, mock_db, sample_floor_id):
        """
        Verify retrieval of all lockers for a floor with availability status.
        Mock database returns list of lockers with is_available flags.
        Verify response contains locker details and availability info.
        """
        from src.services.get_available_lockers import get_available_lockers

        today = date.today()
        end_date = today + timedelta(days=2)

        lockers = [
            create_locker_dict(is_available=True, status="available"),
            create_locker_dict(is_available=False, status="occupied"),
            create_locker_dict(is_available=True, status="available"),
        ]
        mock_db.fetch.return_value = lockers

        with patch("src.services.get_available_lockers.db", mock_db):
            result = await get_available_lockers(
                str(sample_floor_id), str(today), str(end_date)
            )

        assert len(result) == 3
        assert result[0].is_available is True
        assert result[1].is_available is False
        assert all(hasattr(locker, "locker_number") for locker in result)

    @pytest.mark.asyncio
    async def test_get_available_lockers_empty_floor(self, mock_db, sample_floor_id):
        """
        Verify handling of floor with no lockers.
        Mock database returns empty list.
        Expect empty list response without errors.
        """
        from src.services.get_available_lockers import get_available_lockers

        today = date.today()
        end_date = today + timedelta(days=2)

        mock_db.fetch.return_value = []

        with patch("src.services.get_available_lockers.db", mock_db):
            result = await get_available_lockers(
                str(sample_floor_id), str(today), str(end_date)
            )

        assert result == []

    @pytest.mark.asyncio
    async def test_get_available_lockers_all_occupied(self, mock_db, sample_floor_id):
        """
        Verify response when all lockers are occupied.
        Mock database returns lockers with is_available=False.
        Expect list of lockers with unavailable status.
        """
        from src.services.get_available_lockers import get_available_lockers

        today = date.today()
        end_date = today + timedelta(days=2)

        lockers = [
            create_locker_dict(is_available=False, status="occupied"),
            create_locker_dict(is_available=False, status="reserved"),
            create_locker_dict(is_available=False, status="maintenance"),
        ]
        mock_db.fetch.return_value = lockers

        with patch("src.services.get_available_lockers.db", mock_db):
            result = await get_available_lockers(
                str(sample_floor_id), str(today), str(end_date)
            )

        assert len(result) == 3
        assert all(locker.is_available is False for locker in result)

    @pytest.mark.asyncio
    async def test_get_available_lockers_permanently_allocated(
        self, mock_db, sample_floor_id
    ):
        """
        Verify handling of permanently allocated lockers.
        Mock database includes lockers with is_permanently_allocated=True.
        Verify response correctly identifies permanent allocations.
        """
        from src.services.get_available_lockers import get_available_lockers

        today = date.today()
        end_date = today + timedelta(days=2)

        lockers = [
            create_locker_dict(
                is_available=False,
                is_permanently_allocated=True,
                status="occupied",
            ),
            create_locker_dict(
                is_available=True, is_permanently_allocated=False, status="available"
            ),
        ]
        mock_db.fetch.return_value = lockers

        with patch("src.services.get_available_lockers.db", mock_db):
            result = await get_available_lockers(
                str(sample_floor_id), str(today), str(end_date)
            )

        assert len(result) == 2
        assert result[0].is_permanently_allocated is True
        assert result[1].is_permanently_allocated is False


class TestCheckLockerAvailability:
    """Tests for the check_locker_availability service."""

    @pytest.mark.asyncio
    async def test_check_availability_available(self, mock_db, sample_locker_id):
        """
        Verify availability check when locker has no conflicts.
        Mock database returns None indicating no conflicting bookings.
        Expect True for availability.
        """
        from src.services.check_locker_availability import check_locker_availability

        today = date.today()
        end_date = today + timedelta(days=2)

        mock_db.fetchval.return_value = None

        with patch("src.services.check_locker_availability.db", mock_db):
            result = await check_locker_availability(
                str(sample_locker_id), str(today), str(end_date)
            )

        assert result is True

    @pytest.mark.asyncio
    async def test_check_availability_unavailable(self, mock_db, sample_locker_id):
        """
        Verify availability check when locker has booking conflict.
        Mock database returns 1 indicating conflicting booking exists.
        Expect False for availability.
        """
        from src.services.check_locker_availability import check_locker_availability

        today = date.today()
        end_date = today + timedelta(days=2)

        mock_db.fetchval.return_value = 1

        with patch("src.services.check_locker_availability.db", mock_db):
            result = await check_locker_availability(
                str(sample_locker_id), str(today), str(end_date)
            )

        assert result is False

    @pytest.mark.asyncio
    async def test_check_availability_date_range_overlap(
        self, mock_db, sample_locker_id
    ):
        """
        Verify conflict detection for overlapping date ranges.
        Mock database returns conflict for partial overlap.
        Expect False indicating unavailability.
        """
        from src.services.check_locker_availability import check_locker_availability

        start_date = date.today() + timedelta(days=5)
        end_date = date.today() + timedelta(days=10)

        mock_db.fetchval.return_value = 1

        with patch("src.services.check_locker_availability.db", mock_db):
            result = await check_locker_availability(
                str(sample_locker_id), str(start_date), str(end_date)
            )

        assert result is False


class TestLockerStatusValidation:
    """Tests for locker status validation."""

    @pytest.mark.asyncio
    async def test_locker_statuses(self, locker_status):
        """
        Verify all valid locker statuses are recognized.
        Test parametrized fixture with all status values.
        Ensure status values match expected enum.
        """
        valid_statuses = ["available", "occupied", "reserved", "maintenance"]
        assert locker_status in valid_statuses
