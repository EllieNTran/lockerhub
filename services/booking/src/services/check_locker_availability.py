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
            logger.info(
                f"Locker {locker_id} is not available from {start_date} to {end_date}"
            )
            return False
        logger.info(f"Locker {locker_id} is available from {start_date} to {end_date}")
        return True
    except Exception as e:
        logger.error(
            f"Error checking availability for locker {locker_id} from {start_date} to {end_date}: {e}"
        )
        raise
