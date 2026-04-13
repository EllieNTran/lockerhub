"""Unit tests for top departments service."""

import pytest
from unittest.mock import patch
from uuid import uuid4


def create_department_data_dict(**overrides):
    """Create a department usage data dictionary with optional overrides."""
    default = {
        "department_id": uuid4(),
        "department_name": "Computer Science",
        "occupied_count": 45,
    }
    default.update(overrides)
    return default


class TestGetTopDepartments:
    """Tests for the get_top_departments service."""

    @pytest.mark.asyncio
    async def test_get_top_departments_last_7_days(self, mock_db):
        """
        Verify successful retrieval of top departments for last 7 days.
        Mock database returns 6 departments with varying occupied counts.
        Verify response contains all departments ordered by count DESC.
        """
        from src.services.get_top_departments import get_top_departments

        mock_data = [
            create_department_data_dict(
                department_name="Computer Science", occupied_count=45
            ),
            create_department_data_dict(
                department_name="Engineering", occupied_count=38
            ),
            create_department_data_dict(department_name="Business", occupied_count=28),
            create_department_data_dict(department_name="Medicine", occupied_count=22),
            create_department_data_dict(department_name="Law", occupied_count=15),
            create_department_data_dict(department_name="Arts", occupied_count=10),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_top_departments.db", mock_db):
            result = await get_top_departments(period="last_7_days")

        assert len(result.departments) == 6
        assert result.departments[0].department_name == "Computer Science"
        assert result.departments[0].occupied_count == 45
        assert result.departments[-1].department_name == "Arts"
        assert result.departments[-1].occupied_count == 10
        assert mock_db.fetch.call_count == 1

    @pytest.mark.asyncio
    async def test_get_top_departments_with_floor_filter(
        self, mock_db, sample_floor_id
    ):
        """
        Verify retrieval of top departments filtered by floor.
        Mock database returns departments for specific floor.
        Verify floor_id is passed as parameter to query.
        """
        from src.services.get_top_departments import get_top_departments

        mock_data = [
            create_department_data_dict(
                department_name="Computer Science", occupied_count=25
            ),
            create_department_data_dict(
                department_name="Engineering", occupied_count=20
            ),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_top_departments.db", mock_db):
            result = await get_top_departments(
                period="last_month", floor_id=str(sample_floor_id)
            )

        assert len(result.departments) == 2
        assert mock_db.fetch.call_count == 1
        # Verify floor_id was passed to query
        call_args = mock_db.fetch.call_args
        assert str(sample_floor_id) in call_args[0]

    @pytest.mark.asyncio
    async def test_get_top_departments_all_time(self, mock_db):
        """
        Verify retrieval of top departments for all time period.
        Mock database returns historical department data.
        Verify fetchval is called to get earliest booking date.
        """
        from src.services.get_top_departments import get_top_departments
        from datetime import date

        mock_data = [
            create_department_data_dict(
                department_name="Computer Science", occupied_count=150
            ),
            create_department_data_dict(
                department_name="Engineering", occupied_count=120
            ),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = date(2020, 1, 1)

        with patch("src.services.get_top_departments.db", mock_db), patch(
            "src.utils.date_utils.db", mock_db
        ):
            result = await get_top_departments(period="all_time")

        assert len(result.departments) == 2
        assert mock_db.fetchval.call_count == 1
        assert result.departments[0].occupied_count == 150

    @pytest.mark.asyncio
    async def test_get_top_departments_empty_result(self, mock_db):
        """
        Verify handling of empty result when no departments have occupied lockers.
        Mock database returns empty list.
        Verify response contains empty departments list.
        """
        from src.services.get_top_departments import get_top_departments

        mock_db.fetch.return_value = []
        mock_db.fetchval.return_value = None

        with patch("src.services.get_top_departments.db", mock_db):
            result = await get_top_departments(period="last_7_days")

        assert len(result.departments) == 0
        assert mock_db.fetch.call_count == 1

    @pytest.mark.asyncio
    async def test_get_top_departments_last_year(self, mock_db):
        """
        Verify retrieval of top departments for last year.
        Mock database returns yearly department statistics.
        Verify correct period is used for date range calculation.
        """
        from src.services.get_top_departments import get_top_departments

        mock_data = [
            create_department_data_dict(
                department_name="Computer Science", occupied_count=500
            ),
            create_department_data_dict(
                department_name="Engineering", occupied_count=450
            ),
            create_department_data_dict(department_name="Business", occupied_count=400),
        ]
        mock_db.fetch.return_value = mock_data
        mock_db.fetchval.return_value = None

        with patch("src.services.get_top_departments.db", mock_db):
            result = await get_top_departments(period="last_year")

        assert len(result.departments) == 3
        assert all(dept.occupied_count >= 400 for dept in result.departments)

    @pytest.mark.asyncio
    async def test_get_top_departments_error_handling(self, mock_db):
        """
        Verify error handling when database query fails.
        Mock database raises exception.
        Verify exception is propagated.
        """
        from src.services.get_top_departments import get_top_departments

        mock_db.fetch.side_effect = Exception("Database connection failed")
        mock_db.fetchval.return_value = None

        with patch("src.services.get_top_departments.db", mock_db):
            with pytest.raises(Exception) as exc_info:
                await get_top_departments(period="last_7_days")

        assert "Database connection failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_top_departments_value_error(self, mock_db):
        """
        Verify ValueError is propagated from date_utils.
        Mock get_date_range to raise ValueError.
        Expect ValueError to be raised.
        """
        from src.services.get_top_departments import get_top_departments

        with patch(
            "src.services.get_top_departments.get_date_range",
            side_effect=ValueError("Invalid period"),
        ):
            with pytest.raises(ValueError, match="Invalid period"):
                await get_top_departments(period="invalid_period")
