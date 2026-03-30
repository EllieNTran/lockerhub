"""Get a booking."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import BookingResponse

GET_BOOKING_QUERY = """
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
    b.extension_request_id,
    b.created_at,
    b.updated_at
FROM lockerhub.bookings b
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
INNER JOIN lockerhub.floors f ON l.floor_id = f.floor_id
WHERE b.booking_id = $1
"""


async def get_booking(user_id: str, booking_id: str) -> BookingResponse:
    """
    Get a specific booking for a user.

    Args:
        user_id: ID of the user to retrieve the booking for
        booking_id: ID of the booking to retrieve

    Returns:
        The booking details
    """
    try:
        booking = await db.fetchrow(GET_BOOKING_QUERY, booking_id)

        if not booking:
            logger.warning("Booking not found for user")
            raise ValueError("Booking not found")
        if str(booking["user_id"]) != user_id:
            logger.warning("User attempted to access booking not owned by them")
            raise ValueError("Unauthorized")

        logger.info("Retrieved booking for user")
        return BookingResponse(**dict(booking))
    except Exception:
        logger.error("Error retrieving booking for user")
        raise
