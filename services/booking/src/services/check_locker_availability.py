"""Check the availability for a locker"""

from src.logger import logger
from src.connectors.db import db

CHECK_AVAILABILITY_QUERY = """
SELECT 1 FROM lockerhub.bookings
WHERE locker_id = $1
AND daterange($2, $3, '[]') && daterange(start_date, end_date, '[]')
"""


async def check_locker_availability(
    locker_id: str, start_date: str, end_date: str
) -> bool:
    """
    Check if a locker is available for a given date range.

    Args:
        locker_id: ID of the locker to check
        start_date: Proposed start date for the booking
        end_date: Proposed end date for the booking

    Returns:
        True if the locker is available, False if there is a conflict
    """
    try:
        conflict = await db.fetchval(
            CHECK_AVAILABILITY_QUERY, locker_id, start_date, end_date
        )
        if conflict:
            logger.info("Locker is not available")
            return False
        logger.info("Locker is available")
        return True
    except Exception:
        logger.error("Error checking availability for locker")
        raise
