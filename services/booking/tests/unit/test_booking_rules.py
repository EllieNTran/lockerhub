"""Unit tests for booking rule services."""

import pytest
from unittest.mock import patch
from uuid import uuid4


class TestGetBookingRule:
    """Tests for the get_booking_rule service."""

    @pytest.mark.asyncio
    async def test_get_booking_rule_success(self, mock_db):
        """
        Verify successful retrieval of active booking rule.
        Mock database returns booking rule with specified rule_type.
        Verify response contains rule details.
        """
        from src.services.get_booking_rule import get_booking_rule

        booking_rule_id = uuid4()
        rule_data = {
            "booking_rule_id": booking_rule_id,
            "rule_type": "max_duration",
            "name": "Maximum Booking Duration",
            "value": 30,
        }
        mock_db.fetchrow.return_value = rule_data

        with patch("src.services.get_booking_rule.db", mock_db):
            result = await get_booking_rule("max_duration")

        assert result.booking_rule_id == booking_rule_id
        assert result.rule_type == "max_duration"
        assert result.name == "Maximum Booking Duration"
        assert result.value == 30
        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_get_booking_rule_not_found(self, mock_db):
        """
        Verify handling when no active rule exists for specified type.
        Mock database returns None for rule lookup.
        Expect None response without errors.
        """
        from src.services.get_booking_rule import get_booking_rule

        mock_db.fetchrow.return_value = None

        with patch("src.services.get_booking_rule.db", mock_db):
            result = await get_booking_rule("nonexistent_rule_type")

        assert result is None
        assert mock_db.fetchrow.call_count == 1

    @pytest.mark.asyncio
    async def test_get_booking_rule_max_extension(self, mock_db):
        """
        Verify retrieval of max_extension booking rule.
        Mock database returns max_extension rule.
        Verify correct rule type and value.
        """
        from src.services.get_booking_rule import get_booking_rule

        booking_rule_id = uuid4()
        rule_data = {
            "booking_rule_id": booking_rule_id,
            "rule_type": "max_extension",
            "name": "Maximum Extension Days",
            "value": 7,
        }
        mock_db.fetchrow.return_value = rule_data

        with patch("src.services.get_booking_rule.db", mock_db):
            result = await get_booking_rule("max_extension")

        assert result.rule_type == "max_extension"
        assert result.value == 7

    @pytest.mark.asyncio
    async def test_get_booking_rule_advance_booking_window(self, mock_db):
        """
        Verify retrieval of advance_booking_window booking rule.
        Mock database returns advance booking window rule.
        Verify correct rule type and value.
        """
        from src.services.get_booking_rule import get_booking_rule

        booking_rule_id = uuid4()
        rule_data = {
            "booking_rule_id": booking_rule_id,
            "rule_type": "advance_booking_window",
            "name": "Advance Booking Window",
            "value": 90,
        }
        mock_db.fetchrow.return_value = rule_data

        with patch("src.services.get_booking_rule.db", mock_db):
            result = await get_booking_rule("advance_booking_window")

        assert result.rule_type == "advance_booking_window"
        assert result.value == 90


class TestGetBookingRuleException:
    """Tests for exception handling in get_booking_rule."""

    @pytest.mark.asyncio
    async def test_get_booking_rule_database_error(self, mock_db):
        """Test exception handler in get_booking_rule."""
        from src.services.get_booking_rule import get_booking_rule

        mock_db.fetchrow.side_effect = Exception("Database connection failed")

        with patch("src.services.get_booking_rule.db", mock_db):
            with pytest.raises(Exception):
                await get_booking_rule("max_booking_duration")
