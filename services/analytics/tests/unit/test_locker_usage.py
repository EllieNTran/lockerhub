"""Unit tests for locker usage service."""

import pytest
from unittest.mock import patch
from datetime import date, timedelta

from ..conftest import create_usage_data_dict


class TestGetLockerUsage:
    """Tests for the get_locker_usage service."""

    @pytest.mark.asyncio
    async def test_get_locker_usage_last_month(self, mock_db):
        """
        Verify successful retrieval of locker usage for last month.
        Mock database returns 30 days of usage data.
        Verify response contains all days with occupied counts.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=15 + i
            )
            for i in range(30)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_month")

        assert len(result.locker_usage) == 30
        assert result.locker_usage[0].occupied_count == 15
        assert mock_db.fetch.call_count == 1

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_get_locker_usage_last_7_days(self, mock_db):
        """
        Verify retrieval of locker usage for last 7 days.
        Mock database returns 7 days of usage data.
        Verify response contains exactly 7 days.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=10
            )
            for i in range(7)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_7_days")

        assert len(result.locker_usage) == 7
        assert all(usage.occupied_count == 10 for usage in result.locker_usage)

    @pytest.mark.asyncio
    async def test_get_locker_usage_last_year(self, mock_db):
        """
        Verify retrieval of locker usage for last year.
        Mock database returns 365 days of usage data.
        Verify response contains full year of data.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=20
            )
            for i in range(365)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_year")

        assert len(result.locker_usage) == 365

    @pytest.mark.asyncio
    async def test_get_locker_usage_all_time(self, mock_db):
        """
        Verify retrieval of all-time locker usage.
        Mock database returns earliest booking date and all usage data.
        Verify query uses earliest booking as start date.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        earliest_date = today - timedelta(days=500)
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=18
            )
            for i in range(500)
        ]
        mock_db.fetchval.return_value = earliest_date
        mock_db.fetch.return_value = mock_data

        with patch("src.services.get_locker_usage.db", mock_db), patch(
            "src.utils.date_utils.db", mock_db
        ):
            result = await get_locker_usage(period="all_time")

        assert len(result.locker_usage) == 500
        assert mock_db.fetchval.call_count == 1

    @pytest.mark.asyncio
    async def test_get_locker_usage_all_time_no_bookings(self, mock_db):
        """
        Verify all_time period when no bookings exist.
        Mock database returns None for earliest booking.
        Verify uses today as start date.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        mock_data = [create_usage_data_dict(usage_date=today, occupied_count=0)]
        mock_db.fetchval.return_value = None
        mock_db.fetch.return_value = mock_data

        with patch("src.services.get_locker_usage.db", mock_db), patch(
            "src.utils.date_utils.db", mock_db
        ):
            result = await get_locker_usage(period="all_time")

        assert len(result.locker_usage) == 1

    @pytest.mark.asyncio
    async def test_get_locker_usage_with_floor_filter(self, mock_db, sample_floor_id):
        """
        Verify locker usage filtered by floor.
        Mock database with floor_id filter parameter.
        Verify floor_id is passed to database query.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        floor_id_str = str(sample_floor_id)
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=12
            )
            for i in range(30)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_month", floor_id=floor_id_str)

        assert len(result.locker_usage) == 30
        # Verify floor_id was passed to query
        call_args = mock_db.fetch.call_args
        assert call_args[0][3] == floor_id_str

    @pytest.mark.asyncio
    async def test_get_locker_usage_with_department_filter(
        self, mock_db, sample_department_id
    ):
        """
        Verify locker usage filtered by department.
        Mock database with department_id filter parameter.
        Verify department_id is passed to database query.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        department_id_str = str(sample_department_id)
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=8
            )
            for i in range(30)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(
                period="last_month", department_id=department_id_str
            )

        assert len(result.locker_usage) == 30
        # Verify department_id was passed to query
        call_args = mock_db.fetch.call_args
        assert call_args[0][4] == department_id_str

    @pytest.mark.asyncio
    async def test_get_locker_usage_with_both_filters(
        self, mock_db, sample_floor_id, sample_department_id
    ):
        """
        Verify locker usage filtered by both floor and department.
        Mock database with both filter parameters.
        Verify both filters are passed to database query.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        floor_id_str = str(sample_floor_id)
        department_id_str = str(sample_department_id)
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=5
            )
            for i in range(30)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(
                period="last_month",
                floor_id=floor_id_str,
                department_id=department_id_str,
            )

        assert len(result.locker_usage) == 30
        # Verify both filters were passed to query
        call_args = mock_db.fetch.call_args
        assert call_args[0][3] == floor_id_str
        assert call_args[0][4] == department_id_str

    @pytest.mark.asyncio
    async def test_get_locker_usage_empty_result(self, mock_db):
        """
        Verify handling of empty usage data.
        Mock database returns empty list.
        Verify response contains empty locker_usage array.
        """
        from src.services.get_locker_usage import get_locker_usage

        mock_db.fetch.return_value = []
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_month")

        assert len(result.locker_usage) == 0
        assert result.locker_usage == []

    @pytest.mark.asyncio
    async def test_get_locker_usage_zero_occupied(self, mock_db):
        """
        Verify handling of days with zero occupied lockers.
        Mock database returns data with zero occupied count.
        Verify response correctly represents zero occupancy.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=0
            )
            for i in range(7)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_7_days")

        assert len(result.locker_usage) == 7
        assert all(usage.occupied_count == 0 for usage in result.locker_usage)

    @pytest.mark.asyncio
    async def test_get_locker_usage_database_error(self, mock_db):
        """
        Verify error handling when database query fails.
        Mock database raises exception.
        Verify exception is propagated.
        """
        from src.services.get_locker_usage import get_locker_usage

        mock_db.fetch.side_effect = Exception("Database connection failed")
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            with pytest.raises(Exception, match="Database connection failed"):
                await get_locker_usage(period="last_month")

    @pytest.mark.asyncio
    async def test_get_locker_usage_last_14_days(self, mock_db):
        """
        Verify retrieval of locker usage for last 14 days.
        Mock database returns 14 days of usage data.
        Verify response contains exactly 14 days.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=22
            )
            for i in range(14)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_14_days")

        assert len(result.locker_usage) == 14

    @pytest.mark.asyncio
    async def test_get_locker_usage_last_3_months(self, mock_db):
        """
        Verify retrieval of locker usage for last 3 months.
        Mock database returns 90 days of usage data.
        Verify response contains approximately 90 days.
        """
        from src.services.get_locker_usage import get_locker_usage

        today = date.today()
        mock_data = [
            create_usage_data_dict(
                usage_date=today - timedelta(days=i), occupied_count=17
            )
            for i in range(90)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_locker_usage.db", mock_db):
            result = await get_locker_usage(period="last_3_months")

        assert len(result.locker_usage) == 90

    @pytest.mark.asyncio
    async def test_get_locker_usage_value_error(self, mock_db):
        """
        Verify ValueError is propagated from date_utils.
        Mock get_date_range to raise ValueError.
        Expect ValueError to be raised.
        """
        from src.services.get_locker_usage import get_locker_usage

        with patch(
            "src.services.get_locker_usage.get_date_range",
            side_effect=ValueError("Invalid period"),
        ):
            with pytest.raises(ValueError, match="Invalid period"):
                await get_locker_usage(period="invalid_period")
