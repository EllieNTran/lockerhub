"""Get all bookings for a user."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import BookingResponse

GET_USER_BOOKINGS_QUERY = """
SELECT 
    b.booking_id,
    b.user_id,
    b.locker_id,
    l.locker_number,
    f.floor_number,
    b.start_date,
    b.end_date,
    b.status,
    b.special_request_id,
    b.created_at,
    b.updated_at
FROM lockerhub.bookings b
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
INNER JOIN lockerhub.floors f ON l.floor_id = f.floor_id
WHERE b.user_id = $1
ORDER BY 
    CASE b.status
        WHEN 'expired' THEN 1
        WHEN 'active' THEN 2
        WHEN 'upcoming' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'cancelled' THEN 5
    END,
    b.start_date ASC
"""


async def get_user_bookings(user_id: str) -> list[BookingResponse]:
    """
    Get all bookings for a user.

    Args:
        user_id: ID of the user to retrieve bookings for

    Returns:
        A list of bookings for the user
    """
    try:
        rows = await db.fetch(GET_USER_BOOKINGS_QUERY, user_id)
        logger.info("Retrieved bookings for user")
        return [BookingResponse(**dict(row)) for row in rows]
    except Exception:
        logger.error("Error retrieving bookings for user")
        raise
