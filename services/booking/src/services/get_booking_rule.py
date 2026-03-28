"""Get a booking rule."""

from typing import Optional

from src.logger import logger
from src.connectors.db import db
from src.models.responses import BookingRuleResponse

GET_BOOKING_RULE_QUERY = """
SELECT 
    booking_rule_id,
    rule_type,
    name,
    value
FROM lockerhub.booking_rules
WHERE rule_type = $1
AND is_active = true
"""


async def get_booking_rule(rule_type: str) -> Optional[BookingRuleResponse]:
    """Get a booking rule by type.

    Args:
        rule_type: The type of the booking rule to retrieve

    Returns:
        A BookingRuleResponse object if found, otherwise None
    """
    try:
        rule = await db.fetchrow(GET_BOOKING_RULE_QUERY, rule_type)
        if rule:
            logger.info("Retrieved booking rule")
            return BookingRuleResponse(**dict(rule))
        else:
            logger.warning("No active booking rule found")
            return None
    except Exception:
        logger.error("Error fetching booking rule")
        raise
