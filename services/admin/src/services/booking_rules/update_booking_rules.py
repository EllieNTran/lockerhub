"""Update booking rules."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import BookingRuleResponse, AllBookingRulesResponse

UPDATE_RULE_QUERY = """
UPDATE lockerhub.booking_rules
SET value = $1, 
    updated_by = $2, 
    updated_at = CURRENT_TIMESTAMP
WHERE rule_type = $3 AND is_active = true
RETURNING booking_rule_id, name, value, rule_type
"""


async def update_booking_rules(
    user_id: str,
    max_booking_duration: int = None,
    max_extension: int = None,
    advance_booking_window: int = None,
    allow_same_day_bookings: bool = None,
) -> AllBookingRulesResponse:
    """Update booking rules.

    Args:
        user_id: ID of the admin making the update
        max_booking_duration: Maximum duration of a booking in days (optional)
        max_extension: Maximum number of days a booking can be extended (optional)
        advance_booking_window: Maximum number of days in advance a booking can be made (optional)
        allow_same_day_bookings: Whether same-day bookings are allowed (optional)

    Returns:
        A list of updated BookingRuleResponse objects
    """
    rule_updates = {
        "max_duration": max_booking_duration,
        "max_extension": max_extension,
        "advance_booking_window": advance_booking_window,
        "same_day_bookings": (
            None if allow_same_day_bookings is None else int(allow_same_day_bookings)
        ),
    }

    try:
        async with db.transaction() as connection:
            updated_rules = []

            for rule_type, value in rule_updates.items():
                if value is not None:
                    result = await connection.fetchrow(
                        UPDATE_RULE_QUERY, value, user_id, rule_type
                    )
                    if result:
                        updated_rules.append(BookingRuleResponse(**dict(result)))

            logger.info(f"Updated {len(updated_rules)} booking rule(s)")
            return AllBookingRulesResponse(rules=updated_rules)
    except Exception:
        logger.error("Error updating booking rules")
        raise
