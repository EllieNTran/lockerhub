"""Get all booking rules."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import BookingRuleResponse, AllBookingRulesResponse

GET_BOOKING_RULES_QUERY = """
SELECT 
    booking_rule_id,
    name,
    value,
    rule_type,
    is_active,
    created_at,
    updated_at
FROM lockerhub.booking_rules
WHERE is_active = true
ORDER BY rule_type;
"""


async def get_booking_rules() -> AllBookingRulesResponse:
    """Get all active booking rules.

    Returns:
        A list of BookingRuleResponse objects
    """
    try:
        rules = await db.fetch(GET_BOOKING_RULES_QUERY)
        logger.info("Retrieved active booking rules")
        return AllBookingRulesResponse(
            rules=[BookingRuleResponse(**dict(rule)) for rule in rules]
        )
    except Exception:
        logger.error("Error fetching booking rules")
        raise
