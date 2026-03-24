"""Unit tests for booking rules services."""

import pytest
from unittest.mock import patch


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
        from uuid import uuid4

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
        from uuid import uuid4

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
        from uuid import uuid4

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
        from uuid import uuid4

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
        self, mock_db, mock_db_connection, sample_floor_id, sample_user_id
    ):
        """Test updating floor status to closed.

        Verifies that updating a floor's status to closed correctly updates
        the floor and returns the updated details.
        """
        from src.services.booking_rules.update_floor_status import update_floor_status

        mock_db_connection.fetchrow.side_effect = [
            {
                "floor_id": sample_floor_id,
                "floor_number": "10",
                "status": "open",
            },
            {
                "floor_id": sample_floor_id,
                "floor_number": "10",
                "status": "closed",
            },
        ]
        mock_db_connection.fetch.return_value = []  # No affected bookings
        mock_db_connection.execute.return_value = None

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
        self, mock_db, mock_db_connection, sample_floor_id, sample_user_id
    ):
        """Test updating floor status to open.

        Verifies that updating a floor's status to open correctly updates
        the floor and returns the updated details.
        """
        from src.services.booking_rules.update_floor_status import update_floor_status

        mock_db_connection.fetchrow.side_effect = [
            {
                "floor_id": sample_floor_id,
                "floor_number": "10",
                "status": "closed",
            },
            {
                "floor_id": sample_floor_id,
                "floor_number": "10",
                "status": "open",
            },
        ]
        mock_db_connection.execute.return_value = (
            None  # For DELETE_ACTIVE_CLOSURES_QUERY
        )

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
        from uuid import uuid4

        mock_db_connection.fetchrow.return_value = None

        with patch("src.services.booking_rules.update_floor_status.db", mock_db):
            with pytest.raises(ValueError, match="Floor not found"):
                await update_floor_status(
                    floor_id=str(uuid4()),
                    status="closed",
                    user_id=str(sample_user_id),
                )
