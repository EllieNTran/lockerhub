"""Unit tests for most popular floors service."""

import pytest
from unittest.mock import patch
from uuid import uuid4


def create_floor_data_dict(**overrides):
    """Create a floor usage data dictionary with optional overrides."""
    default = {
        "floor_id": uuid4(),
        "floor_number": "2",
        "occupied_count": 65,
    }
    default.update(overrides)
    return default


class TestGetMostPopularFloors:
    """Tests for the get_most_popular_floors service."""

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_last_7_days(self, mock_db):
        """
        Verify successful retrieval of most popular floors for last 7 days.
        Mock database returns 6 floors with varying occupied counts.
        Verify response contains all floors ordered by count DESC.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        mock_data = [
            create_floor_data_dict(floor_number="2", occupied_count=65),
            create_floor_data_dict(floor_number="7", occupied_count=58),
            create_floor_data_dict(floor_number="10", occupied_count=52),
            create_floor_data_dict(floor_number="3", occupied_count=45),
            create_floor_data_dict(floor_number="11", occupied_count=38),
            create_floor_data_dict(floor_number="4", occupied_count=30),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_most_popular_floors.db", mock_db):
            result = await get_most_popular_floors(period="last_7_days")

        assert len(result.floors) == 6
        assert result.floors[0].floor_number == "2"
        assert result.floors[0].occupied_count == 65
        assert result.floors[-1].floor_number == "4"
        assert result.floors[-1].occupied_count == 30
        assert mock_db.fetch.call_count == 1

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_with_department_filter(
        self, mock_db, sample_department_id
    ):
        """
        Verify retrieval of most popular floors filtered by department.
        Mock database returns floors for specific department.
        Verify department_id is passed as parameter to query.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        mock_data = [
            create_floor_data_dict(floor_number="2", occupied_count=35),
            create_floor_data_dict(floor_number="7", occupied_count=30),
            create_floor_data_dict(floor_number="10", occupied_count=25),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_most_popular_floors.db", mock_db):
            result = await get_most_popular_floors(
                period="last_month", department_id=str(sample_department_id)
            )

        assert len(result.floors) == 3
        assert mock_db.fetch.call_count == 1
        # Verify department_id was passed to query
        call_args = mock_db.fetch.call_args
        assert str(sample_department_id) in call_args[0]

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_all_time(self, mock_db):
        """
        Verify retrieval of most popular floors for all time period.
        Mock database returns historical floor data.
        Verify fetchval is called to get earliest booking date.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors
        from datetime import date

        mock_data = [
            create_floor_data_dict(floor_number="2", occupied_count=500),
            create_floor_data_dict(floor_number="7", occupied_count=450),
            create_floor_data_dict(floor_number="10", occupied_count=400),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = date(2020, 1, 1)

        with patch("src.services.get_most_popular_floors.db", mock_db), patch(
            "src.utils.date_utils.db", mock_db
        ):
            result = await get_most_popular_floors(period="all_time")

        assert len(result.floors) == 3
        assert mock_db.fetchval.call_count == 1
        assert result.floors[0].occupied_count == 500

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_empty_result(self, mock_db):
        """
        Verify handling of empty result when no floors have occupied lockers.
        Mock database returns empty list.
        Verify response contains empty floors list.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        mock_db.fetch.return_value = []
        mock_db.fetchval.return_value = None

        with patch("src.services.get_most_popular_floors.db", mock_db):
            result = await get_most_popular_floors(period="last_7_days")

        assert len(result.floors) == 0
        assert mock_db.fetch.call_count == 1

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_last_3_months(self, mock_db):
        """
        Verify retrieval of most popular floors for last 3 months.
        Mock database returns quarterly floor statistics.
        Verify correct period is used for date range calculation.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        mock_data = [
            create_floor_data_dict(floor_number="2", occupied_count=200),
            create_floor_data_dict(floor_number="7", occupied_count=180),
            create_floor_data_dict(floor_number="10", occupied_count=160),
            create_floor_data_dict(floor_number="3", occupied_count=140),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_most_popular_floors.db", mock_db):
            result = await get_most_popular_floors(period="last_3_months")

        assert len(result.floors) == 4
        assert all(floor.occupied_count >= 140 for floor in result.floors)

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_single_floor(self, mock_db):
        """
        Verify handling when only one floor has occupied lockers.
        Mock database returns single floor.
        Verify response contains exactly one floor.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        mock_data = [create_floor_data_dict(floor_number="2", occupied_count=100)]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_most_popular_floors.db", mock_db):
            result = await get_most_popular_floors(period="last_7_days")

        assert len(result.floors) == 1
        assert result.floors[0].floor_number == "2"
        assert result.floors[0].occupied_count == 100

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_error_handling(self, mock_db):
        """
        Verify error handling when database query fails.
        Mock database raises exception.
        Verify exception is propagated.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        mock_db.fetch.side_effect = Exception("Database connection failed")
        mock_db.fetchval.return_value = None

        with patch("src.services.get_most_popular_floors.db", mock_db):
            with pytest.raises(Exception) as exc_info:
                await get_most_popular_floors(period="last_7_days")

        assert "Database connection failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_limit_to_six(self, mock_db):
        """
        Verify that only top 6 floors are returned even if more exist.
        Mock database returns exactly 6 floors.
        Verify response is limited to 6 floors.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        mock_data = [
            create_floor_data_dict(floor_number=str(i), occupied_count=100 - i * 5)
            for i in range(6)
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_most_popular_floors.db", mock_db):
            result = await get_most_popular_floors(period="last_month")

        assert len(result.floors) == 6
        # Verify descending order
        for i in range(len(result.floors) - 1):
            assert (
                result.floors[i].occupied_count >= result.floors[i + 1].occupied_count
            )

    @pytest.mark.asyncio
    async def test_get_most_popular_floors_value_error(self, mock_db):
        """
        Verify ValueError is propagated from date_utils.
        Mock get_date_range to raise ValueError.
        Expect ValueError to be raised.
        """
        from src.services.get_most_popular_floors import get_most_popular_floors

        with patch(
            "src.services.get_most_popular_floors.get_date_range",
            side_effect=ValueError("Invalid period"),
        ):
            with pytest.raises(ValueError, match="Invalid period"):
                await get_most_popular_floors(period="invalid_period")
