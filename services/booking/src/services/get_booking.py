"""Get a booking."""

from src.logger import logger
from src.connectors.db import db

GET_BOOKING_QUERY = """
SELECT * FROM lockerhub.bookings
WHERE booking_id = $1
"""


async def get_booking(user_id: str, booking_id: str) -> dict:
    """
    Get a specific booking for a user.

    Args:
        user_id: ID of the user to retrieve the booking for
        booking_id: ID of the booking to retrieve

    Returns:
        The booking details as a dictionary
    """
    try:
        booking = await db.fetchrow(GET_BOOKING_QUERY, booking_id)

        if not booking:
            logger.warning(f"Booking {booking_id} not found for user {user_id}")
            raise ValueError("Booking not found")
        if booking["user_id"] != user_id:
            logger.warning(
                f"User {user_id} attempted to access booking {booking_id} not owned by them"
            )
            raise ValueError("Unauthorized")

        logger.info(f"Retrieved booking {booking_id} for user {user_id}")
        return booking
    except Exception as e:
        logger.error(f"Error retrieving booking {booking_id} for user {user_id}: {e}")
        raise
