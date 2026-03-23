"""Unit tests for locker services."""

import pytest
from unittest.mock import patch


@pytest.mark.unit
class TestCreateLocker:
    """Tests for create_locker service."""

    @pytest.mark.asyncio
    async def test_create_locker_success(
        self, mock_db, mock_db_connection, sample_floor_id, sample_user_id
    ):
        """Test successful locker creation.

        Verifies that creating a locker with valid floor ID returns both locker and key details.
        Mocks database responses for floor validation, locker creation, and key creation.
        """
        from src.services.lockers.create_locker import create_locker
        from uuid import UUID

        locker_id = UUID("12345678-1234-5678-1234-567812345678")
        key_id = UUID("87654321-4321-8765-4321-876543218765")

        mock_db_connection.fetchrow.side_effect = [
            {"floor_id": sample_floor_id},
            {"locker_id": locker_id, "locker_number": "DL10-01-01"},
            {"key_id": key_id, "key_number": "AA123"},
        ]

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

    @pytest.mark.asyncio
    async def test_create_locker_floor_not_found(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """Test locker creation with non-existent floor.

        Verifies that attempting to create a locker with an invalid floor ID
        raises a ValueError with the message 'Floor not found'.
        """
        from src.services.lockers.create_locker import create_locker

        mock_db_connection.fetchrow.return_value = None

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
        self, mock_db, mock_db_connection, sample_locker_id, sample_user_id
    ):
        """Test successful key creation for locker.

        Verifies that creating a key for a locker without an existing key succeeds
        and returns the new key ID and key number.
        """
        from src.services.lockers.create_locker_key import create_locker_key
        from uuid import UUID

        key_id = UUID("87654321-4321-8765-4321-876543218765")

        mock_db_connection.fetchrow.side_effect = [
            {"locker_id": sample_locker_id},
            None,
            {"key_id": key_id, "key_number": "BB456"},
        ]

        with patch("src.services.lockers.create_locker_key.db", mock_db):
            result = await create_locker_key(
                locker_id=sample_locker_id,
                key_number="BB456",
                user_id=sample_user_id,
            )

            assert result.key_id == key_id
            assert result.key_number == "BB456"

    @pytest.mark.asyncio
    async def test_create_locker_key_already_exists(
        self, mock_db, mock_db_connection, sample_locker_id, sample_user_id
    ):
        """Test creating key when locker already has one.

        Verifies that attempting to create a key for a locker that already has a key
        raises a ValueError with the message 'Locker already has a key'.
        """
        from src.services.lockers.create_locker_key import create_locker_key

        mock_db_connection.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "key_id": "existing-key-id",
        }

        with patch("src.services.lockers.create_locker_key.db", mock_db):
            with pytest.raises(ValueError, match="Locker already has a key"):
                await create_locker_key(
                    locker_id=sample_locker_id,
                    key_number="BB456",
                    user_id=sample_user_id,
                )


@pytest.mark.unit
class TestMarkLockerMaintenance:
    """Tests for mark_locker_maintenance service."""

    @pytest.mark.asyncio
    async def test_mark_locker_maintenance_success(
        self, mock_db, mock_db_connection, sample_locker_id
    ):
        """Test marking locker as under maintenance.

        Verifies that an available locker can be marked as maintenance status
        and returns the updated locker details with the new status.
        """
        from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance

        mock_db_connection.fetchrow.side_effect = [
            {"locker_id": sample_locker_id, "status": "available"},
            {
                "locker_id": sample_locker_id,
                "locker_number": "DL10-01-01",
                "status": "maintenance",
            },
        ]

        with patch("src.services.lockers.mark_locker_maintenance.db", mock_db):
            result = await mark_locker_maintenance(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.status == "maintenance"

    @pytest.mark.asyncio
    async def test_mark_locker_maintenance_not_available(
        self, mock_db, mock_db_connection, sample_locker_id
    ):
        """Test marking occupied locker as maintenance.

        Verifies that attempting to mark a non-available locker (occupied) as maintenance
        raises a ValueError indicating only available lockers can be marked for maintenance.
        """
        from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance

        mock_db_connection.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "status": "occupied",
        }

        with patch("src.services.lockers.mark_locker_maintenance.db", mock_db):
            with pytest.raises(
                ValueError, match="Locker must be 'available' to mark as maintenance"
            ):
                await mark_locker_maintenance(sample_locker_id)


@pytest.mark.unit
class TestMarkLockerAvailable:
    """Tests for mark_locker_available service."""

    @pytest.mark.asyncio
    async def test_mark_locker_available_success(
        self, mock_db, mock_db_connection, sample_locker_id
    ):
        """Test marking locker as available.

        Verifies that a locker in maintenance status can be marked as available
        and returns the updated locker with the new status.
        """
        from src.services.lockers.mark_locker_available import mark_locker_available

        mock_db_connection.fetchrow.side_effect = [
            {
                "locker_id": sample_locker_id,
                "status": "maintenance",
                "key_number": "AA123",
                "key_status": "available",
            },
            {
                "locker_id": sample_locker_id,
                "locker_number": "DL10-01-01",
                "status": "available",
            },
        ]

        with patch("src.services.lockers.mark_locker_available.db", mock_db):
            result = await mark_locker_available(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.status == "available"

    @pytest.mark.asyncio
    async def test_mark_locker_available_not_found(self, mock_db, mock_db_connection):
        """Test marking non-existent locker as available.

        Verifies that attempting to mark a non-existent locker as available
        raises a ValueError with the message 'Locker not found'.
        """
        from src.services.lockers.mark_locker_available import mark_locker_available

        mock_db_connection.fetchrow.return_value = None

        with patch("src.services.lockers.mark_locker_available.db", mock_db):
            with pytest.raises(ValueError, match="Locker not found"):
                await mark_locker_available("non-existent-id")


@pytest.mark.unit
class TestReportLostKey:
    """Tests for report_lost_key service."""

    @pytest.mark.asyncio
    async def test_report_lost_key_success(
        self, mock_db, mock_db_connection, sample_locker_id
    ):
        """Test reporting a lost key.

        Verifies that reporting a lost key marks the key as lost and sets the locker
        to maintenance status. Returns the updated locker details.
        """
        from src.services.lockers.report_lost_key import report_lost_key

        mock_db_connection.fetchrow.side_effect = [
            {
                "locker_id": sample_locker_id,
                "status": "available",
                "key_number": "AA123",
                "key_status": "available",
            },
            {"key_number": "AA123", "status": "lost"},
            {
                "locker_id": sample_locker_id,
                "locker_number": "DL10-01-01",
                "status": "maintenance",
            },
        ]

        with patch("src.services.lockers.report_lost_key.db", mock_db):
            result = await report_lost_key(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.status == "maintenance"

    @pytest.mark.asyncio
    async def test_report_lost_key_no_key(
        self, mock_db, mock_db_connection, sample_locker_id
    ):
        """Test reporting lost key for locker that's not available.

        Verifies that attempting to report a lost key for a locker that is not available
        raises a ValueError.
        """
        from src.services.lockers.report_lost_key import report_lost_key

        mock_db_connection.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "status": "occupied",
            "key_number": "AA123",
            "key_status": "with_employee",
        }

        with patch("src.services.lockers.report_lost_key.db", mock_db):
            with pytest.raises(
                ValueError, match="Locker must be 'available' to report lost key"
            ):
                await report_lost_key(str(sample_locker_id))


@pytest.mark.unit
class TestOrderReplacementKey:
    """Tests for order_replacement_key service."""

    @pytest.mark.asyncio
    async def test_order_replacement_key_success(
        self, mock_db, mock_db_connection, sample_locker_id
    ):
        """Test ordering a replacement key.

        Verifies that ordering a replacement for a lost key updates the key status
        to 'awaiting_replacement' and returns the updated locker details.
        """
        from src.services.lockers.order_replacement_key import order_replacement_key

        mock_db_connection.fetchrow.side_effect = [
            {
                "locker_id": sample_locker_id,
                "status": "maintenance",
                "key_number": "AA123",
                "key_status": "lost",
            },
            {"key_number": "AA123", "status": "awaiting_replacement"},
            {
                "locker_id": sample_locker_id,
                "status": "maintenance",
                "key_number": "AA123",
                "key_status": "awaiting_replacement",
            },
        ]

        with patch("src.services.lockers.order_replacement_key.db", mock_db):
            result = await order_replacement_key(str(sample_locker_id))

            assert result.locker_id == sample_locker_id
            assert result.status == "maintenance"

    @pytest.mark.asyncio
    async def test_order_replacement_key_not_lost(
        self, mock_db, mock_db_connection, sample_locker_id
    ):
        """Test ordering replacement for non-lost key.

        Verifies that attempting to order a replacement key when the key is not lost
        raises a ValueError indicating only lost keys can have replacements ordered.
        """
        from src.services.lockers.order_replacement_key import order_replacement_key

        mock_db_connection.fetchrow.return_value = {
            "locker_id": sample_locker_id,
            "status": "maintenance",
            "key_number": "AA123",
            "key_status": "available",
        }

        with patch("src.services.lockers.order_replacement_key.db", mock_db):
            with pytest.raises(
                ValueError, match="Key must be 'lost' to order replacement"
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
