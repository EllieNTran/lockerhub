"""Unit tests for locker services."""

import pytest
from unittest.mock import patch
from uuid import uuid4


@pytest.mark.unit
class TestCreateLocker:
    """Tests for create_locker service."""

    @pytest.mark.asyncio
    async def test_create_locker_success(
        self, mock_db, sample_floor_id, sample_user_id
    ):
        """Test successful locker creation.

        Verifies that creating a locker with valid floor ID returns both locker and key details.
        CTE handles both locker and key creation in one query.
        """
        from src.services.lockers.create_locker import create_locker

        locker_id = uuid4()
        key_id = uuid4()

        mock_db.fetchrow.return_value = {
            "locker_id": locker_id,
            "locker_number": "DL10-01-01",
            "key_id": key_id,
            "key_number": "AA123",
        }

        with patch("src.services.lockers.create_locker.db", mock_db):
            result = await create_locker(
                locker_number="DL10-01-01",
                floor_id=sample_floor_id,
                key_number="AA123",
                user_id=sample_user_id,
                location="Near elevator",
                x_coordinate=100,
                y_coordinate=200,
            )

            assert result.locker_id == locker_id
            assert result.locker_number == "DL10-01-01"
            assert result.key_id == key_id
            assert result.key_number == "AA123"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_create_locker_floor_not_found(self, mock_db, sample_user_id):
        """Test locker creation with non-existent floor.

        Verifies that attempting to create a locker with an invalid floor ID
        raises a ValueError with the message 'Floor not found'. CTE returns None.
        """
        from src.services.lockers.create_locker import create_locker

        mock_db.fetchrow.return_value = None

        with patch("src.services.lockers.create_locker.db", mock_db):
            with pytest.raises(ValueError, match="Floor not found"):
                await create_locker(
                    locker_number="DL10-01-01",
                    floor_id="non-existent-floor",
                    key_number="AA123",
                    user_id=sample_user_id,
                )


@pytest.mark.unit
class TestCreateLockerKey:
    """Tests for create_locker_key service."""

    @pytest.mark.asyncio
    async def test_create_locker_key_success(
        self, mock_db, sample_locker_id, sample_user_id
    ):
        """Test successful key creation for locker.

        Verifies that creating a key for a locker without an existing key succeeds
        and returns the new key ID and key number. CTE validates and creates in one query.
        """
        from src.services.lockers.create_locker_key import create_locker_key

        key_id = uuid4()

        mock_db.fetchrow.return_value = {
            "key_id": key_id,
            "key_number": "BB456",
            "locker_exists": 1,
            "has_key": 0,
        }

        with patch("src.services.lockers.create_locker_key.db", mock_db):
            result = await create_locker_key(
                locker_id=sample_locker_id,
                key_number="BB456",
                user_id=sample_user_id,
            )

            assert result.key_id == key_id
            assert result.key_number == "BB456"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_create_locker_key_already_exists(
        self, mock_db, sample_locker_id, sample_user_id
    ):
        """Test creating key when locker already has one.

        Verifies that attempting to create a key for a locker that already has a key
        raises a ValueError. CTE returns None when key already exists and locker exists.
        """
        from src.services.lockers.create_locker_key import create_locker_key

        mock_db.fetchrow.return_value = None
        mock_db.fetchval.return_value = 1

        with patch("src.services.lockers.create_locker_key.db", mock_db):
            with pytest.raises(ValueError, match="Locker already has a key"):
                await create_locker_key(
                    locker_id=sample_locker_id,
                    key_number="BB456",
                    user_id=sample_user_id,
                )

    @pytest.mark.asyncio
    async def test_create_locker_key_locker_not_found(self, mock_db, sample_user_id):
        """Test creating key when locker doesn't exist.

        Verifies that attempting to create a key for a non-existent locker
        raises a ValueError with 'Locker not found'.
        """
        from src.services.lockers.create_locker_key import create_locker_key

        mock_db.fetchrow.return_value = None
        mock_db.fetchval.return_value = 0

        with patch("src.services.lockers.create_locker_key.db", mock_db):
            with pytest.raises(ValueError, match="Locker not found"):
                await create_locker_key(
                    locker_id="non-existent-id",
                    key_number="BB456",
                    user_id=sample_user_id,
                )


@pytest.mark.unit
class TestMarkLockerMaintenance:
    """Tests for mark_locker_maintenance service."""

    @pytest.mark.asyncio
    async def test_mark_locker_maintenance_success(self, mock_db, sample_locker_id):
        """Test marking locker as under maintenance.

        Verifies that an available locker can be marked as maintenance status
        and returns the updated locker details with the new status. CTE handles validation and update.
        """
        from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance

        mock_db.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "locker_number": "DL10-01-01",
            "status": "maintenance",
            "was_available": 1,
        }

        with patch("src.services.lockers.mark_locker_maintenance.db", mock_db):
            result = await mark_locker_maintenance(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.locker_number == "DL10-01-01"
            assert result.status == "maintenance"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_mark_locker_maintenance_not_available(
        self, mock_db, sample_locker_id
    ):
        """Test marking occupied locker as maintenance.

        Verifies that attempting to mark a non-available locker (occupied) as maintenance
        raises a ValueError. CTE returns None when not available.
        """
        from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance

        mock_db.fetchrow.return_value = None

        with patch("src.services.lockers.mark_locker_maintenance.db", mock_db):
            with pytest.raises(
                ValueError, match="Locker must be 'available' to mark as maintenance"
            ):
                await mark_locker_maintenance(sample_locker_id)


@pytest.mark.unit
class TestMarkLockerAvailable:
    """Tests for mark_locker_available service."""

    @pytest.mark.asyncio
    async def test_mark_locker_available_success(self, mock_db, sample_locker_id):
        """Test marking locker as available.

        Verifies that a locker in maintenance status can be marked as available
        and returns the updated locker with the new status. CTE handles key update if needed.
        """
        from src.services.lockers.mark_locker_available import mark_locker_available

        mock_db.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "locker_number": "DL10-01-01",
            "status": "available",
            "updated_key_number": "AA123",
            "updated_key_status": "available",
        }

        with patch("src.services.lockers.mark_locker_available.db", mock_db):
            result = await mark_locker_available(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.status == "available"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_mark_locker_available_not_found(self, mock_db):
        """Test marking non-existent locker as available.

        Verifies that attempting to mark a non-existent locker as available
        raises a ValueError. CTE returns None when not found or not in maintenance.
        """
        from src.services.lockers.mark_locker_available import mark_locker_available

        mock_db.fetchrow.return_value = None

        with patch("src.services.lockers.mark_locker_available.db", mock_db):
            with pytest.raises(
                ValueError, match="Locker must be 'maintenance' to mark as available"
            ):
                await mark_locker_available("non-existent-id")


@pytest.mark.unit
class TestReportLostKey:
    """Tests for report_lost_key service."""

    @pytest.mark.asyncio
    async def test_report_lost_key_success(self, mock_db, sample_locker_id):
        """Test reporting a lost key.

        Verifies that reporting a lost key marks the key as lost and sets the locker
        to maintenance status. CTE handles both updates in one query.
        """
        from src.services.lockers.report_lost_key import report_lost_key

        mock_db.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "locker_number": "DL10-01-01",
            "status": "maintenance",
            "updated_key_number": "AA123",
        }

        with patch("src.services.lockers.report_lost_key.db", mock_db):
            result = await report_lost_key(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.locker_number == "DL10-01-01"
            assert result.status == "maintenance"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_report_lost_key_no_key(self, mock_db, sample_locker_id):
        """Test reporting lost key for locker that's not available.

        Verifies that attempting to report a lost key for a locker that is not available
        raises a ValueError. CTE returns None when status not available.
        """
        from src.services.lockers.report_lost_key import report_lost_key

        mock_db.fetchrow.return_value = None

        with patch("src.services.lockers.report_lost_key.db", mock_db):
            with pytest.raises(
                ValueError,
                match="Locker not found or must be 'available' to report lost key",
            ):
                await report_lost_key(str(sample_locker_id))


@pytest.mark.unit
class TestOrderReplacementKey:
    """Tests for order_replacement_key service."""

    @pytest.mark.asyncio
    async def test_order_replacement_key_success(self, mock_db, sample_locker_id):
        """Test ordering a replacement key.

        Verifies that ordering a replacement for a lost key updates the key status
        to 'awaiting_replacement'. CTE validates and updates in one query.
        """
        from src.services.lockers.order_replacement_key import order_replacement_key

        mock_db.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "locker_number": "DL10-01-01",
            "status": "maintenance",
            "key_number": "AA123",
            "key_status": "awaiting_replacement",
        }

        with patch("src.services.lockers.order_replacement_key.db", mock_db):
            result = await order_replacement_key(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.locker_number == "DL10-01-01"
            assert result.status == "maintenance"
            assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_order_replacement_key_not_lost(self, mock_db, sample_locker_id):
        """Test ordering replacement for non-lost key.

        Verifies that attempting to order a replacement key when the key is not lost
        raises a ValueError. CTE returns None or result without key_status.
        """
        from src.services.lockers.order_replacement_key import order_replacement_key

        mock_db.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "locker_number": "DL10-01-01",
            "status": "maintenance",
            "key_number": "AA123",
            "key_status": None,
        }

        with patch("src.services.lockers.order_replacement_key.db", mock_db):
            with pytest.raises(
                ValueError, match="Key must be 'lost' to order replacement"
            ):
                await order_replacement_key(str(sample_locker_id))

    @pytest.mark.asyncio
    async def test_order_replacement_key_locker_not_found(
        self, mock_db, sample_locker_id
    ):
        """Test ordering replacement for non-existent locker.

        Verifies that attempting to order a replacement key for a locker that
        doesn't exist or is not under maintenance raises a ValueError.
        """
        from src.services.lockers.order_replacement_key import order_replacement_key

        mock_db.fetchrow.return_value = None

        with patch("src.services.lockers.order_replacement_key.db", mock_db):
            with pytest.raises(
                ValueError,
                match="Locker must be 'maintenance' to order replacement key",
            ):
                await order_replacement_key(str(sample_locker_id))


@pytest.mark.unit
class TestGetAllLockers:
    """Tests for get_all_lockers service."""

    @pytest.mark.asyncio
    async def test_get_all_lockers_success(
        self,
        mock_db,
    ):
        """Test retrieving all lockers.

        Verifies that fetching all lockers returns a list with correct locker IDs.
        """
        from src.services.lockers.get_all_lockers import get_all_lockers
        from ..conftest import create_locker_dict

        locker = create_locker_dict()
        mock_db.fetch.return_value = [locker]

        with patch("src.services.lockers.get_all_lockers.db", mock_db):
            result = await get_all_lockers()

            assert len(result.lockers) == 1
            assert result.lockers[0].locker_id == locker["locker_id"]


@pytest.mark.unit
class TestGetAllKeys:
    """Tests for get_all_keys service."""

    @pytest.mark.asyncio
    async def test_get_all_keys_success(
        self,
        mock_db,
    ):
        """Test retrieving all keys.

        Verifies that fetching all keys returns a list with correct key IDs.
        """
        from src.services.lockers.get_all_keys import get_all_keys
        from ..conftest import create_key_dict

        key = create_key_dict()
        mock_db.fetch.return_value = [key]

        with patch("src.services.lockers.get_all_keys.db", mock_db):
            result = await get_all_keys()

            assert len(result.keys) == 1
            assert result.keys[0].key_id == key["key_id"]


@pytest.mark.unit
class TestUpdateLockerCoordinates:
    """Tests for update_locker_coordinates service."""

    @pytest.mark.asyncio
    async def test_update_locker_coordinates_success(self, mock_db, sample_locker_id):
        """Test updating locker coordinates.

        Verifies that updating a locker's x and y coordinates succeeds and
        returns the locker with the new coordinate values.
        """
        from src.services.lockers.update_locker_coordinates import (
            update_locker_coordinates,
        )

        mock_db.fetchrow.side_effect = [
            {"locker_id": sample_locker_id},
            {
                "locker_id": sample_locker_id,
                "locker_number": "DL10-01-01",
                "x_coordinate": 150,
                "y_coordinate": 250,
            },
        ]

        with patch("src.services.lockers.update_locker_coordinates.db", mock_db):
            result = await update_locker_coordinates(
                locker_id=str(sample_locker_id),
                x_coordinate=150,
                y_coordinate=250,
            )

            assert result["locker_id"] == sample_locker_id
            assert result["x_coordinate"] == 150
            assert result["y_coordinate"] == 250

    @pytest.mark.asyncio
    async def test_update_locker_coordinates_not_found(self, mock_db, sample_locker_id):
        """Test updating coordinates for non-existent locker.

        Verifies that attempting to update coordinates for a locker that
        doesn't exist raises a ValueError.
        """
        from src.services.lockers.update_locker_coordinates import (
            update_locker_coordinates,
        )

        mock_db.fetchrow.return_value = None

        with patch("src.services.lockers.update_locker_coordinates.db", mock_db):
            with pytest.raises(ValueError, match="not found"):
                await update_locker_coordinates(
                    locker_id=str(sample_locker_id),
                    x_coordinate=150,
                    y_coordinate=250,
                )

    @pytest.mark.asyncio
    async def test_update_locker_coordinates_exception_handling(
        self, mock_db, sample_locker_id
    ):
        """Test generic exception handling.

        Verifies that unexpected errors during coordinate update
        are properly raised.
        """
        from src.services.lockers.update_locker_coordinates import (
            update_locker_coordinates,
        )

        mock_db.fetchrow.side_effect = Exception("Database error")

        with patch("src.services.lockers.update_locker_coordinates.db", mock_db):
            with pytest.raises(Exception):
                await update_locker_coordinates(
                    locker_id=str(sample_locker_id),
                    x_coordinate=150,
                    y_coordinate=250,
                )


@pytest.mark.unit
class TestGetLockerAvailabilityStats:
    """Tests for get_locker_availability_statistics service."""

    @pytest.mark.asyncio
    async def test_get_locker_availability_stats_success(self, mock_db):
        """Test retrieving locker availability statistics.

        Verifies that fetching locker statistics returns total lockers,
        available lockers, and lockers under maintenance.
        """
        from src.services.lockers.get_locker_availability_stats import (
            get_locker_availability_statistics,
        )

        stats = {
            "total_lockers": 200,
            "total_available": 150,
            "total_maintenance": 10,
        }
        mock_db.fetchrow.return_value = stats

        with patch("src.services.lockers.get_locker_availability_stats.db", mock_db):
            result = await get_locker_availability_statistics()

            assert result.total_lockers == 200
            assert result.total_available == 150
            assert result.total_maintenance == 10

    @pytest.mark.asyncio
    async def test_get_locker_availability_stats_no_lockers(self, mock_db):
        """Test retrieving statistics when no lockers exist.

        Verifies that fetching statistics with zero lockers returns
        zero for all counts.
        """
        from src.services.lockers.get_locker_availability_stats import (
            get_locker_availability_statistics,
        )

        stats = {
            "total_lockers": 0,
            "total_available": 0,
            "total_maintenance": 0,
        }
        mock_db.fetchrow.return_value = stats

        with patch("src.services.lockers.get_locker_availability_stats.db", mock_db):
            result = await get_locker_availability_statistics()

            assert result.total_lockers == 0
            assert result.total_available == 0
            assert result.total_maintenance == 0

    @pytest.mark.asyncio
    async def test_get_locker_availability_stats_all_occupied(self, mock_db):
        """Test retrieving statistics when all lockers are occupied.

        Verifies that statistics correctly reflect zero available lockers
        when all lockers are occupied or in maintenance.
        """
        from src.services.lockers.get_locker_availability_stats import (
            get_locker_availability_statistics,
        )

        stats = {
            "total_lockers": 100,
            "total_available": 0,
            "total_maintenance": 5,
        }
        mock_db.fetchrow.return_value = stats

        with patch("src.services.lockers.get_locker_availability_stats.db", mock_db):
            result = await get_locker_availability_statistics()

            assert result.total_lockers == 100
            assert result.total_available == 0
            assert result.total_maintenance == 5

    @pytest.mark.asyncio
    async def test_get_locker_availability_stats_all_maintenance(self, mock_db):
        """Test retrieving statistics when many lockers are in maintenance.

        Verifies that statistics accurately reflect high maintenance counts.
        """
        from src.services.lockers.get_locker_availability_stats import (
            get_locker_availability_statistics,
        )

        stats = {
            "total_lockers": 100,
            "total_available": 20,
            "total_maintenance": 80,
        }
        mock_db.fetchrow.return_value = stats

        with patch("src.services.lockers.get_locker_availability_stats.db", mock_db):
            result = await get_locker_availability_statistics()

            assert result.total_lockers == 100
            assert result.total_available == 20
            assert result.total_maintenance == 80
