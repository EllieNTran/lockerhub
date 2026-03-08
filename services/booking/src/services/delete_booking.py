"""Delete an existing booking."""

from src.logger import logger
from src.connectors.db import db

GET_BOOKING_QUERY = """
SELECT user_id FROM lockerhub.bookings
WHERE booking_id = $1
"""

DELETE_BOOKING_QUERY = """
DELETE FROM lockerhub.bookings
WHERE booking_id = $1
RETURNING booking_id
"""


async def delete_booking(user_id: str, booking_id: str) -> str:
    """Delete an existing booking."""
    try:
        async with db.transaction() as connection:
            booking = await connection.fetchrow(GET_BOOKING_QUERY, booking_id)

            if not booking:
                logger.warning(f"Booking {booking_id} not found for deletion")
                raise ValueError("Booking not found")

            if booking["user_id"] != user_id:
                logger.warning(
                    f"User {user_id} attempted to delete booking {booking_id} not owned by them"
                )
                raise ValueError("Unauthorized")

            deleted_id = await connection.fetchval(DELETE_BOOKING_QUERY, booking_id)
            logger.info(f"Deleted booking {booking_id} for user {user_id}")

            return deleted_id
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Error deleting booking {booking_id}: {e}")
        raise
