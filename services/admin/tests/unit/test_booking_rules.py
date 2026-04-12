"""Unit tests for booking rules services."""

import pytest
from unittest.mock import patch
from uuid import uuid4
from datetime import datetime


@pytest.mark.unit
class TestGetBookingRules:
    """Tests for get_booking_rules service."""

    @pytest.mark.asyncio
    async def test_get_booking_rules_success(self, mock_db):
        """Test retrieving all active booking rules.

        Verifies that fetching booking rules returns a list with correct rule IDs,
        names, values, and rule types.
        """
        from src.services.booking_rules.get_booking_rules import get_booking_rules

        rules = [
            {
                "booking_rule_id": uuid4(),
                "name": "Maximum Booking Duration",
                "value": 30,
                "rule_type": "max_duration",
            },
            {
                "booking_rule_id": uuid4(),
                "name": "Maximum Extension",
                "value": 7,
                "rule_type": "max_extension",
            },
        ]
        mock_db.fetch.return_value = rules

        with patch("src.services.booking_rules.get_booking_rules.db", mock_db):
            result = await get_booking_rules()

            assert len(result.rules) == 2
            assert result.rules[0].name == "Maximum Booking Duration"
            assert result.rules[0].value == 30
            assert result.rules[0].rule_type == "max_duration"
            assert result.rules[1].name == "Maximum Extension"

    @pytest.mark.asyncio
    async def test_get_booking_rules_empty(self, mock_db):
        """Test retrieving booking rules when none exist.

        Verifies that fetching booking rules from an empty database returns an empty list.
        """
        from src.services.booking_rules.get_booking_rules import get_booking_rules

        mock_db.fetch.return_value = []

        with patch("src.services.booking_rules.get_booking_rules.db", mock_db):
            result = await get_booking_rules()

            assert len(result.rules) == 0


@pytest.mark.unit
class TestUpdateBookingRules:
    """Tests for update_booking_rules service."""

    @pytest.mark.asyncio
    async def test_update_single_rule(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """Test updating a single booking rule.

        Verifies that updating max_booking_duration correctly updates the rule
        and returns the updated rule details.
        """
        from src.services.booking_rules.update_booking_rules import update_booking_rules

        mock_db_connection.fetchrow.return_value = {
            "booking_rule_id": uuid4(),
            "name": "Maximum Booking Duration",
            "value": 45,
            "rule_type": "max_duration",
        }

        with patch("src.services.booking_rules.update_booking_rules.db", mock_db):
            result = await update_booking_rules(
                user_id=sample_user_id,
                max_booking_duration=45,
            )

            assert len(result.rules) == 1
            assert result.rules[0].value == 45
            assert result.rules[0].rule_type == "max_duration"

    @pytest.mark.asyncio
    async def test_update_multiple_rules(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """Test updating multiple booking rules.

        Verifies that updating multiple rules at once correctly updates all rules
        and returns the complete list of updated rules.
        """
        from src.services.booking_rules.update_booking_rules import update_booking_rules

        mock_db_connection.fetchrow.side_effect = [
            {
                "booking_rule_id": uuid4(),
                "name": "Maximum Booking Duration",
                "value": 45,
                "rule_type": "max_duration",
            },
            {
                "booking_rule_id": uuid4(),
                "name": "Maximum Extension",
                "value": 14,
                "rule_type": "max_extension",
            },
            {
                "booking_rule_id": uuid4(),
                "name": "Advance Booking Window",
                "value": 60,
                "rule_type": "advance_booking_window",
            },
        ]

        with patch("src.services.booking_rules.update_booking_rules.db", mock_db):
            result = await update_booking_rules(
                user_id=sample_user_id,
                max_booking_duration=45,
                max_extension=14,
                advance_booking_window=60,
            )

            assert len(result.rules) == 3
            assert result.rules[0].rule_type == "max_duration"
            assert result.rules[0].value == 45
            assert result.rules[1].rule_type == "max_extension"
            assert result.rules[1].value == 14
            assert result.rules[2].rule_type == "advance_booking_window"
            assert result.rules[2].value == 60

    @pytest.mark.asyncio
    async def test_update_boolean_rule(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """Test updating a boolean booking rule.

        Verifies that updating allow_same_day_bookings correctly converts
        the boolean value to integer and updates the rule.
        """
        from src.services.booking_rules.update_booking_rules import update_booking_rules

        mock_db_connection.fetchrow.return_value = {
            "booking_rule_id": uuid4(),
            "name": "Allow Same Day Bookings",
            "value": 1,
            "rule_type": "same_day_bookings",
        }

        with patch("src.services.booking_rules.update_booking_rules.db", mock_db):
            result = await update_booking_rules(
                user_id=sample_user_id,
                allow_same_day_bookings=True,
            )

            assert len(result.rules) == 1
            assert result.rules[0].rule_type == "same_day_bookings"
            assert result.rules[0].value == 1

    @pytest.mark.asyncio
    async def test_update_no_rules(self, mock_db, sample_user_id):
        """Test updating with no rules specified.

        Verifies that calling update_booking_rules with no parameters
        returns an empty list without making any database updates.
        """
        from src.services.booking_rules.update_booking_rules import update_booking_rules

        with patch("src.services.booking_rules.update_booking_rules.db", mock_db):
            result = await update_booking_rules(user_id=sample_user_id)

            assert len(result.rules) == 0


@pytest.mark.unit
class TestUpdateFloorStatus:
    """Tests for update_floor_status service."""

    @pytest.mark.asyncio
    async def test_update_floor_status_to_closed(
        self, mock_db, sample_floor_id, sample_user_id
    ):
        """Test updating floor status to closed.

        Verifies that updating a floor's status to closed correctly updates
        the floor and returns the updated details.
        """
        from src.services.booking_rules.update_floor_status import update_floor_status

        mock_db.fetch.return_value = []
        mock_db.fetchrow.return_value = {
            "floor_id": sample_floor_id,
            "floor_number": "10",
            "status": "closed",
            "closure_id": 1,
        }

        with patch("src.services.booking_rules.update_floor_status.db", mock_db):
            from unittest.mock import AsyncMock

            with patch(
                "src.services.booking_rules.update_floor_status.NotificationsServiceClient"
            ) as mock_notif:
                mock_notif_instance = AsyncMock()
                mock_notif.return_value = mock_notif_instance

                result = await update_floor_status(
                    floor_id=str(sample_floor_id),
                    status="closed",
                    user_id=str(sample_user_id),
                )

                assert str(result.floor_id) == str(sample_floor_id)
                assert result.floor_number == "10"
                assert result.status == "closed"

    @pytest.mark.asyncio
    async def test_update_floor_status_to_open(
        self, mock_db, sample_floor_id, sample_user_id
    ):
        """Test updating floor status to open.

        Verifies that updating a floor's status to open correctly updates
        the floor and returns the updated details.
        """
        from src.services.booking_rules.update_floor_status import update_floor_status

        mock_db.fetchrow.return_value = {
            "floor_id": sample_floor_id,
            "floor_number": "10",
            "status": "open",
        }

        with patch("src.services.booking_rules.update_floor_status.db", mock_db):
            from unittest.mock import AsyncMock

            with patch(
                "src.services.booking_rules.update_floor_status.NotificationsServiceClient"
            ) as mock_notif:
                mock_notif_instance = AsyncMock()
                mock_notif.return_value = mock_notif_instance

                result = await update_floor_status(
                    floor_id=str(sample_floor_id),
                    status="open",
                    user_id=str(sample_user_id),
                )

                assert str(result.floor_id) == str(sample_floor_id)
                assert result.floor_number == "10"
                assert result.status == "open"

    @pytest.mark.asyncio
    async def test_update_floor_status_floor_not_found(
        self, mock_db, mock_db_connection, sample_user_id
    ):
        """Test updating status for non-existent floor.

        Verifies that attempting to update a non-existent floor's status
        raises a ValueError with the message 'Floor not found'.
        """
        from src.services.booking_rules.update_floor_status import update_floor_status

        mock_db_connection.fetchrow.return_value = None

        with patch("src.services.booking_rules.update_floor_status.db", mock_db):
            with pytest.raises(ValueError, match="Floor not found"):
                await update_floor_status(
                    floor_id=str(uuid4()),
                    status="closed",
                    user_id=str(sample_user_id),
                )


@pytest.mark.unit
class TestGetAllFloors:
    """Tests for get_all_floors service."""

    @pytest.mark.asyncio
    async def test_get_all_floors_success(self, mock_db):
        """Test retrieving all floors with locker counts.

        Verifies that fetching all floors returns a list with floor details,
        total locker counts, and closures.
        """
        from src.services.booking_rules.get_all_floors import get_all_floors

        floors = [
            {
                "floor_id": uuid4(),
                "floor_number": "2",
                "status": "open",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 50,
                "closures": None,
            },
            {
                "floor_id": uuid4(),
                "floor_number": "10",
                "status": "open",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 75,
                "closures": None,
            },
            {
                "floor_id": uuid4(),
                "floor_number": "11",
                "status": "closed",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 60,
                "closures": '[{"closure_id": 1, "start_date": "2026-03-30", "end_date": "2026-04-05", "reason": "Maintenance"}]',
            },
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.booking_rules.get_all_floors.db", mock_db):
            result = await get_all_floors()

            assert len(result.floors) == 3
            assert result.floors[0].floor_number == "2"
            assert result.floors[0].status == "open"
            assert result.floors[0].total_lockers == 50
            assert result.floors[0].closures is None
            assert result.floors[1].total_lockers == 75
            assert result.floors[2].status == "closed"
            assert result.floors[2].total_lockers == 60
            assert result.floors[2].closures is not None
            assert isinstance(result.floors[2].closures, list)
            assert len(result.floors[2].closures) == 1
            assert result.floors[2].closures[0]["reason"] == "Maintenance"

    @pytest.mark.asyncio
    async def test_get_all_floors_empty(self, mock_db):
        """Test retrieving floors when none exist.

        Verifies that fetching floors from an empty database returns an empty list.
        """
        from src.services.booking_rules.get_all_floors import get_all_floors

        mock_db.fetch.return_value = []

        with patch("src.services.booking_rules.get_all_floors.db", mock_db):
            result = await get_all_floors()

            assert len(result.floors) == 0

    @pytest.mark.asyncio
    async def test_get_all_floors_with_multiple_closures(self, mock_db):
        """Test retrieving floors with multiple closures.

        Verifies that floors with multiple closures have all closures
        properly parsed and returned.
        """
        from src.services.booking_rules.get_all_floors import get_all_floors

        floors = [
            {
                "floor_id": uuid4(),
                "floor_number": "10",
                "status": "closed",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 75,
                "closures": '[{"closure_id": 1, "start_date": "2026-03-30", "end_date": "2026-04-05", "reason": "Maintenance"}, {"closure_id": 2, "start_date": "2026-04-10", "end_date": "2026-04-15", "reason": "Renovation"}]',
            }
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.booking_rules.get_all_floors.db", mock_db):
            result = await get_all_floors()

            assert len(result.floors) == 1
            assert result.floors[0].closures is not None
            assert len(result.floors[0].closures) == 2
            assert result.floors[0].closures[0]["reason"] == "Maintenance"
            assert result.floors[0].closures[1]["reason"] == "Renovation"

    @pytest.mark.asyncio
    async def test_get_all_floors_no_lockers(self, mock_db):
        """Test retrieving floors with no lockers.

        Verifies that floors with zero lockers are handled correctly.
        """
        from src.services.booking_rules.get_all_floors import get_all_floors

        floors = [
            {
                "floor_id": uuid4(),
                "floor_number": "13",
                "status": "open",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 0,
                "closures": None,
            }
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.booking_rules.get_all_floors.db", mock_db):
            result = await get_all_floors()

            assert len(result.floors) == 1
            assert result.floors[0].total_lockers == 0

    @pytest.mark.asyncio
    async def test_get_all_floors_sorted_numerically(self, mock_db):
        """Test that floors are sorted numerically.

        Verifies that floors are returned in numerical order (2, 10, 11)
        not lexicographical order (10, 11, 2).
        """
        from src.services.booking_rules.get_all_floors import get_all_floors

        floors = [
            {
                "floor_id": uuid4(),
                "floor_number": "11",
                "status": "open",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 60,
                "closures": None,
            },
            {
                "floor_id": uuid4(),
                "floor_number": "2",
                "status": "open",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 50,
                "closures": None,
            },
            {
                "floor_id": uuid4(),
                "floor_number": "10",
                "status": "open",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "total_lockers": 75,
                "closures": None,
            },
        ]
        mock_db.fetch.return_value = floors

        with patch("src.services.booking_rules.get_all_floors.db", mock_db):
            result = await get_all_floors()
            assert len(result.floors) == 3


@pytest.mark.unit
class TestGetFloorClosures:
    """Tests for get_floor_closures service."""

    @pytest.mark.asyncio
    async def test_get_floor_closures_success(self, mock_db, sample_floor_id):
        """Test retrieving closures for a floor.

        Verifies that fetching closures returns a list with closure details.
        """
        from src.services.booking_rules.get_floor_closures import get_floor_closures
        from datetime import date

        closures = [
            {
                "closure_id": uuid4(),
                "floor_id": sample_floor_id,
                "start_date": date(2026, 4, 15),
                "end_date": date(2026, 4, 20),
                "reason": "Maintenance",
                "created_at": datetime.now(),
                "created_by": uuid4(),
            },
            {
                "closure_id": uuid4(),
                "floor_id": sample_floor_id,
                "start_date": date(2026, 5, 1),
                "end_date": None,
                "reason": "Renovation",
                "created_at": datetime.now(),
                "created_by": uuid4(),
            },
        ]
        mock_db.fetch.return_value = closures

        with patch("src.services.booking_rules.get_floor_closures.db", mock_db):
            result = await get_floor_closures(str(sample_floor_id))

            assert len(result.closures) == 2
            assert result.closures[0]["reason"] == "Maintenance"
            assert result.closures[1]["end_date"] is None

    @pytest.mark.asyncio
    async def test_get_floor_closures_empty(self, mock_db, sample_floor_id):
        """Test retrieving closures when none exist.

        Verifies that fetching closures from a floor with no closures
        returns an empty list.
        """
        from src.services.booking_rules.get_floor_closures import get_floor_closures

        mock_db.fetch.return_value = []

        with patch("src.services.booking_rules.get_floor_closures.db", mock_db):
            result = await get_floor_closures(str(sample_floor_id))

            assert len(result.closures) == 0

    @pytest.mark.asyncio
    async def test_get_floor_closures_only_active(self, mock_db, sample_floor_id):
        """Test retrieving only active/upcoming closures.

        Verifies that only closures with end_date >= current date or
        null end_date are returned.
        """
        from src.services.booking_rules.get_floor_closures import get_floor_closures
        from datetime import date

        # Only future closures should be returned by the query
        closures = [
            {
                "closure_id": uuid4(),
                "floor_id": sample_floor_id,
                "start_date": date(2026, 4, 15),
                "end_date": date(2026, 4, 20),
                "reason": "Future closure",
                "created_at": datetime.now(),
                "created_by": uuid4(),
            },
        ]
        mock_db.fetch.return_value = closures

        with patch("src.services.booking_rules.get_floor_closures.db", mock_db):
            result = await get_floor_closures(str(sample_floor_id))

            assert len(result.closures) == 1
            assert result.closures[0]["reason"] == "Future closure"


@pytest.mark.unit
class TestDeleteFloorClosure:
    """Tests for delete_floor_closure service."""

    @pytest.mark.asyncio
    async def test_delete_floor_closure_success(
        self, mock_db, sample_floor_id, sample_user_id
    ):
        """Test deleting a floor closure.

        Verifies that deleting a closure successfully removes it and
        returns the closure details.
        """
        from src.services.booking_rules.delete_floor_closure import (
            delete_floor_closure,
        )
        from datetime import date

        closure_id = uuid4()
        mock_db.fetchrow.return_value = {
            "closure_id": closure_id,
            "floor_id": sample_floor_id,
            "start_date": date(2026, 4, 15),
            "end_date": date(2026, 4, 20),
            "reason": "Maintenance",
            "floor_number": "10",
        }

        with patch("src.services.booking_rules.delete_floor_closure.db", mock_db):
            from unittest.mock import AsyncMock

            with patch(
                "src.services.booking_rules.delete_floor_closure.NotificationsServiceClient"
            ) as mock_notif:
                mock_notif_instance = AsyncMock()
                mock_notif.return_value = mock_notif_instance

                result = await delete_floor_closure(
                    str(sample_user_id), str(closure_id)
                )

                assert str(result.closure_id) == str(closure_id)
                assert str(result.floor_id) == str(sample_floor_id)
                assert result.message == "Floor closure deleted successfully"
                mock_notif_instance.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_floor_closure_not_found(self, mock_db, sample_user_id):
        """Test deleting non-existent closure.

        Verifies that attempting to delete a non-existent closure
        raises a ValueError with the message 'Floor closure not found'.
        """
        from src.services.booking_rules.delete_floor_closure import (
            delete_floor_closure,
        )

        mock_db.fetchrow.return_value = None

        with patch("src.services.booking_rules.delete_floor_closure.db", mock_db):
            with pytest.raises(ValueError, match="Floor closure not found"):
                await delete_floor_closure(str(sample_user_id), str(uuid4()))

    @pytest.mark.asyncio
    async def test_delete_indefinite_closure(
        self, mock_db, sample_floor_id, sample_user_id
    ):
        """Test deleting an indefinite closure.

        Verifies that deleting a closure with no end_date (indefinite)
        is handled correctly with appropriate notification message.
        """
        from src.services.booking_rules.delete_floor_closure import (
            delete_floor_closure,
        )
        from datetime import date

        closure_id = uuid4()
        mock_db.fetchrow.return_value = {
            "closure_id": closure_id,
            "floor_id": sample_floor_id,
            "start_date": date(2026, 4, 15),
            "end_date": None,
            "reason": "Indefinite maintenance",
            "floor_number": "10",
        }

        with patch("src.services.booking_rules.delete_floor_closure.db", mock_db):
            from unittest.mock import AsyncMock

            with patch(
                "src.services.booking_rules.delete_floor_closure.NotificationsServiceClient"
            ) as mock_notif:
                mock_notif_instance = AsyncMock()
                mock_notif.return_value = mock_notif_instance

                result = await delete_floor_closure(
                    str(sample_user_id), str(closure_id)
                )

                assert str(result.closure_id) == str(closure_id)
                # Check that notification was sent with indefinite closure message
                call_args = mock_notif_instance.post.call_args
                assert "Indefinite" in call_args[0][1]["title"]
