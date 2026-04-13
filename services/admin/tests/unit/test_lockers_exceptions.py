"""Exception tests for locker services."""

import pytest
from unittest.mock import patch


@pytest.mark.unit
class TestLockersExceptions:
    """Tests for exception handling in locker services."""

    @pytest.mark.asyncio
    async def test_create_locker_database_error(self, mock_db):
        """Test create locker handles database errors."""
        from src.services.lockers.create_locker import create_locker

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.create_locker.db", mock_db):
            with pytest.raises(Exception):
                await create_locker(
                    locker_number="L1",
                    floor_id="floor-id",
                    key_number="K1",
                    user_id="user-id",
                )

    @pytest.mark.asyncio
    async def test_create_locker_key_database_error(self, mock_db):
        """Test create locker key handles database errors."""
        from src.services.lockers.create_locker_key import create_locker_key

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.create_locker_key.db", mock_db):
            with pytest.raises(Exception):
                await create_locker_key(
                    locker_id="locker-id",
                    key_number="K1",
                    user_id="user-id",
                )

    @pytest.mark.asyncio
    async def test_get_all_keys_database_error(self, mock_db):
        """Test get all keys handles database errors."""
        from src.services.lockers.get_all_keys import get_all_keys

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.lockers.get_all_keys.db", mock_db):
            with pytest.raises(Exception):
                await get_all_keys()

    @pytest.mark.asyncio
    async def test_get_all_lockers_database_error(self, mock_db):
        """Test get all lockers handles database errors."""
        from src.services.lockers.get_all_lockers import get_all_lockers

        mock_db.fetch.side_effect = Exception("Database error")

        with patch("src.services.lockers.get_all_lockers.db", mock_db):
            with pytest.raises(Exception):
                await get_all_lockers()

    @pytest.mark.asyncio
    async def test_mark_locker_available_database_error(self, mock_db):
        """Test mark locker available handles database errors."""
        from src.services.lockers.mark_locker_available import mark_locker_available

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.mark_locker_available.db", mock_db):
            with pytest.raises(Exception):
                await mark_locker_available(
                    locker_id="locker-id",
                )

    @pytest.mark.asyncio
    async def test_mark_locker_maintenance_database_error(self, mock_db):
        """Test mark locker maintenance handles database errors."""
        from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.mark_locker_maintenance.db", mock_db):
            with pytest.raises(Exception):
                await mark_locker_maintenance(
                    locker_id="locker-id",
                )

    @pytest.mark.asyncio
    async def test_order_replacement_key_database_error(self, mock_db):
        """Test order replacement key handles database errors."""
        from src.services.lockers.order_replacement_key import order_replacement_key

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.order_replacement_key.db", mock_db):
            with pytest.raises(Exception):
                await order_replacement_key(locker_id="locker-id")

    @pytest.mark.asyncio
    async def test_report_lost_key_database_error(self, mock_db):
        """Test report lost key handles database errors."""
        from src.services.lockers.report_lost_key import report_lost_key

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.report_lost_key.db", mock_db):
            with pytest.raises(Exception):
                await report_lost_key(
                    locker_id="locker-id",
                )

    @pytest.mark.asyncio
    async def test_get_locker_availability_stats_database_error(self, mock_db):
        """Test get locker availability stats handles database errors."""
        from src.services.lockers.get_locker_availability_stats import (
            get_locker_availability_statistics,
        )

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.get_locker_availability_stats.db", mock_db):
            with pytest.raises(Exception):
                await get_locker_availability_statistics()
