"""Get all lockers for a given floor with availability status for a date range."""

from datetime import date
from src.logger import logger
from src.connectors.db import db
from src.models.responses import AvailableLockerResponse

GET_AVAILABLE_LOCKERS_QUERY = """
SELECT 
    l.locker_id,
    l.locker_number,
    l.floor_id,
    l.location,
    l.status,
    l.x_coordinate,
    l.y_coordinate,
    l.created_at,
    l.updated_at,
    CASE 
        WHEN l.status != 'available' THEN false
        WHEN EXISTS (
            SELECT 1 FROM lockerhub.bookings b
            WHERE b.locker_id = l.locker_id
            AND b.start_date < $3 
            AND (b.end_date IS NULL OR b.end_date > $2)
        ) THEN false
        ELSE true
    END as is_available,
    EXISTS (
        SELECT 1 FROM lockerhub.bookings b
        WHERE b.locker_id = l.locker_id
        AND b.end_date IS NULL
    ) as is_permanently_allocated
FROM lockerhub.lockers l
WHERE l.floor_id = $1
ORDER BY l.locker_number
"""


async def get_available_lockers(
    floor_id: str, start_date: str, end_date: str
) -> list[AvailableLockerResponse]:
    """
    Get all lockers for a given floor with availability status for a date range.

    Args:
        floor_id: UUID of the floor to get lockers for
        start_date: Start date of the desired booking (YYYY-MM-DD)
        end_date: End date of the desired booking (YYYY-MM-DD)

    Returns:
        A list of all lockers for the specified floor with availability status
    """
    try:
        lockers = await db.fetch(
            GET_AVAILABLE_LOCKERS_QUERY,
            floor_id,
            date.fromisoformat(start_date),
            date.fromisoformat(end_date),
        )
        logger.info("Retrieved available lockers")
        return [AvailableLockerResponse(**dict(locker)) for locker in lockers]
    except Exception:
        logger.error("Error retrieving available lockers")
        raise
