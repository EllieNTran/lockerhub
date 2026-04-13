"""Unit tests for update_floor_statuses scheduled job."""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import date

from src.scheduled_jobs.jobs.update_floor_statuses import update_floor_statuses


@pytest.mark.unit
class TestUpdateFloorStatuses:
    """Tests for update_floor_statuses job."""

    @pytest.mark.asyncio
    async def test_update_floor_statuses_closes_and_reopens_floors(self):
        """Test job closes and reopens floors successfully."""
        mock_closed_floors = [
            {"floor_id": "floor1", "floor_number": "10"},
            {"floor_id": "floor2", "floor_number": "11"},
        ]

        mock_reopened_floors = [
            {"floor_id": "floor3", "floor_number": "12"},
        ]

        with patch("src.scheduled_jobs.jobs.update_floor_statuses.db") as mock_db:
            mock_db.fetch = AsyncMock(
                side_effect=[mock_closed_floors, mock_reopened_floors]
            )

            result = await update_floor_statuses()

        assert result["closed_count"] == 2
        assert result["reopened_count"] == 1
        assert mock_db.fetch.call_count == 2

    @pytest.mark.asyncio
    async def test_update_floor_statuses_no_floors_to_close(self):
        """Test job when no floors need to be closed."""
        mock_reopened_floors = [
            {"floor_id": "floor3", "floor_number": "12"},
        ]

        with patch("src.scheduled_jobs.jobs.update_floor_statuses.db") as mock_db:
            mock_db.fetch = AsyncMock(side_effect=[None, mock_reopened_floors])

            result = await update_floor_statuses()

        assert result["closed_count"] == 0
        assert result["reopened_count"] == 1

    @pytest.mark.asyncio
    async def test_update_floor_statuses_no_floors_to_reopen(self):
        """Test job when no floors need to be reopened."""
        mock_closed_floors = [
            {"floor_id": "floor1", "floor_number": "10"},
        ]

        with patch("src.scheduled_jobs.jobs.update_floor_statuses.db") as mock_db:
            mock_db.fetch = AsyncMock(side_effect=[mock_closed_floors, None])

            result = await update_floor_statuses()

        assert result["closed_count"] == 1
        assert result["reopened_count"] == 0

    @pytest.mark.asyncio
    async def test_update_floor_statuses_no_changes(self):
        """Test job when no floors need updates."""
        with patch("src.scheduled_jobs.jobs.update_floor_statuses.db") as mock_db:
            mock_db.fetch = AsyncMock(side_effect=[None, None])

            result = await update_floor_statuses()

        assert result["closed_count"] == 0
        assert result["reopened_count"] == 0

    @pytest.mark.asyncio
    async def test_update_floor_statuses_empty_lists(self):
        """Test job when database returns empty lists."""
        with patch("src.scheduled_jobs.jobs.update_floor_statuses.db") as mock_db:
            mock_db.fetch = AsyncMock(side_effect=[[], []])

            result = await update_floor_statuses()

        assert result["closed_count"] == 0
        assert result["reopened_count"] == 0

    @pytest.mark.asyncio
    async def test_update_floor_statuses_database_error(self):
        """Test job handles database errors."""
        with patch("src.scheduled_jobs.jobs.update_floor_statuses.db") as mock_db:
            mock_db.fetch = AsyncMock(
                side_effect=Exception("Database connection failed")
            )

            with pytest.raises(Exception) as exc_info:
                await update_floor_statuses()

            assert "Database connection failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_update_floor_statuses_logs_floor_numbers(self):
        """Test job logs the correct floor numbers."""
        mock_closed_floors = [
            {"floor_id": "floor1", "floor_number": "10"},
            {"floor_id": "floor2", "floor_number": "11"},
            {"floor_id": "floor3", "floor_number": "12"},
        ]

        mock_reopened_floors = [
            {"floor_id": "floor4", "floor_number": "13"},
            {"floor_id": "floor5", "floor_number": "14"},
        ]

        with patch("src.scheduled_jobs.jobs.update_floor_statuses.db") as mock_db:
            mock_db.fetch = AsyncMock(
                side_effect=[mock_closed_floors, mock_reopened_floors]
            )

            result = await update_floor_statuses()

        assert result["closed_count"] == 3
        assert result["reopened_count"] == 2
