"""Delete an existing booking."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import DeleteBookingResponse

GET_BOOKING_QUERY = """
SELECT 
    b.user_id,
    b.locker_id,
    k.key_number,
    k.status AS key_status
FROM lockerhub.bookings b
INNER JOIN lockerhub.keys k ON b.locker_id = k.locker_id
WHERE b.booking_id = $1
"""

DELETE_BOOKING_QUERY = """
DELETE FROM lockerhub.bookings
WHERE booking_id = $1
RETURNING booking_id
"""


async def delete_booking(user_id: str, booking_id: str) -> DeleteBookingResponse:
    """
    Delete an existing booking and return key information.

    Args:
        user_id: ID of the user requesting the deletion (for authorization)
        booking_id: ID of the booking to delete

    Returns:
        The deleted booking details with key information
    """
    try:
        async with db.transaction() as connection:
            booking = await connection.fetchrow(GET_BOOKING_QUERY, booking_id)

            if not booking:
                logger.warning("Booking not found for deletion")
                raise ValueError("Booking not found")

            if booking["user_id"] != user_id:
                logger.warning(
                    f"User {user_id} attempted to delete booking {booking_id} not owned by them"
                )
                raise ValueError("Unauthorized")

            deleted_id = await connection.fetchval(DELETE_BOOKING_QUERY, booking_id)
            logger.info("Deleted booking")

            return DeleteBookingResponse(
                booking_id=deleted_id,
                key_number=booking["key_number"],
                key_status=booking["key_status"],
            )
    except ValueError:
        raise
    except Exception:
        logger.error(f"Error deleting booking {booking_id}: {e}")
        raise
