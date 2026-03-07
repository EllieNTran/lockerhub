"""Get available lockers for a given floor and date range."""

from src.logger import logger
from src.connectors.db import db

GET_AVAILABLE_LOCKERS_QUERY = """
SELECT * FROM lockerhub.lockers
WHERE floor_id = $1
AND locker_id NOT IN (
    SELECT locker_id FROM lockerhub.bookings
    WHERE start_date < $3 AND end_date > $2
)
"""


async def get_available_lockers(floor_id: str, start_date: str, end_date: str) -> list:
    """
    Get available lockers for a given floor and date range.

    Args:
        floor_id: ID of the floor to check for available lockers
        start_date: Start date of the desired booking
        end_date: End date of the desired booking

    Returns:
        A list of available lockers for the specified floor and date range
    """
    try:
        available_lockers = await db.fetch(
            GET_AVAILABLE_LOCKERS_QUERY, floor_id, start_date, end_date
        )
        logger.info(
            f"Retrieved available lockers for floor {floor_id} from {start_date} to {end_date}"
        )
        return available_lockers
    except Exception as e:
        logger.error(
            f"Error retrieving available lockers for floor {floor_id} from {start_date} to {end_date}: {e}"
        )
        raise
