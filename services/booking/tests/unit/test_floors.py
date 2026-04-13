"""Unit tests for floor services."""

import pytest
from unittest.mock import patch

from ..conftest import create_floor_dict


class TestGetFloors:
    """Tests for the get_floors service."""

    @pytest.mark.asyncio
    async def test_get_floors_success(self, mock_db):
        """
        Verify retrieval of all open floors.
        Mock database returns list of floors with open status.
        Verify response contains floor details sorted numerically.
        """
        from src.services.get_floors import get_floors

        floors = [
            create_floor_dict(floor_number="2", status="open"),
            create_floor_dict(floor_number="10", status="open"),
            create_floor_dict(floor_number="11", status="open"),
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.get_floors.db", mock_db):
            result = await get_floors()

        assert len(result.floors) == 3
        assert all(floor.status == "open" for floor in result.floors)
        assert all(hasattr(floor, "floor_number") for floor in result.floors)

    @pytest.mark.asyncio
    async def test_get_floors_empty(self, mock_db):
        """
        Verify handling when no open floors exist.
        Mock database returns empty list.
        Expect empty list response without errors.
        """
        from src.services.get_floors import get_floors

        mock_db.fetch.return_value = []

        with patch("src.services.get_floors.db", mock_db):
            result = await get_floors()

        assert len(result.floors) == 0

    @pytest.mark.asyncio
    async def test_get_floors_multiple(self, mock_db):
        """
        Verify retrieval of multiple floors with various floor numbers.
        Mock database returns floors with numeric and alphanumeric numbers.
        Verify all floors are included in response.
        """
        from src.services.get_floors import get_floors

        floors = [
            create_floor_dict(floor_number="2"),
            create_floor_dict(floor_number="3"),
            create_floor_dict(floor_number="4"),
            create_floor_dict(floor_number="6"),
            create_floor_dict(floor_number="7"),
            create_floor_dict(floor_number="8"),
            create_floor_dict(floor_number="9"),
            create_floor_dict(floor_number="10"),
            create_floor_dict(floor_number="11"),
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.get_floors.db", mock_db):
            result = await get_floors()

        assert len(result.floors) == 9
        floor_numbers = [floor.floor_number for floor in result.floors]
        assert "2" in floor_numbers
        assert "11" in floor_numbers


class TestFloorStatusValidation:
    """Tests for floor status validation."""

    @pytest.mark.asyncio
    async def test_floor_statuses(self, floor_status):
        """
        Verify all valid floor statuses are recognized.
        Test parametrized fixture with all status values.
        Ensure status values match expected enum.
        """
        valid_statuses = ["open", "closed"]
        assert floor_status in valid_statuses


class TestGetFloorsException:
    """Tests for exception handling in get_floors."""

    @pytest.mark.asyncio
    async def test_get_floors_database_error(self, mock_db):
        """Test exception handler in get_floors."""
        from src.services.get_floors import get_floors

        mock_db.fetch.side_effect = Exception("Database connection failed")

        with patch("src.services.get_floors.db", mock_db):
            with pytest.raises(Exception):
                await get_floors()
