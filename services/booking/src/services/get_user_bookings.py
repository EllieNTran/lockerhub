"""Get all bookings for a user."""

from src.logger import logger
from src.connectors.db import db

GET_USER_BOOKINGS_QUERY = """
SELECT 
    booking_id,
    user_id,
    locker_id,
    start_date,
    end_date,
    status,
    special_request_id,
    created_at,
    updated_at
FROM lockerhub.bookings
WHERE user_id = $1
ORDER BY start_date DESC
"""


async def get_user_bookings(user_id: str) -> list:
    """
    Get all bookings for a user.

    Args:
        user_id: ID of the user to retrieve bookings for

    Returns:
        A list of bookings for the user
    """
    try:
        bookings = await db.fetch(GET_USER_BOOKINGS_QUERY, user_id)
        logger.info(f"Retrieved {len(bookings)} bookings for user {user_id}")
        return bookings
    except Exception as e:
        logger.error(f"Error retrieving bookings for user {user_id}: {e}")
        raise
