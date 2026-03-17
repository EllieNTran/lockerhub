"""Confirm key return."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import KeyReturnResponse

GET_BOOKING_QUERY = """
SELECT 
    booking_id,
    locker_id,
    status,
    special_request_id
FROM lockerhub.bookings
WHERE booking_id = $1
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'available'
WHERE locker_id = $1
RETURNING key_id, key_number, status
"""

UPDATE_BOOKING_STATUS_QUERY = """
UPDATE lockerhub.bookings
SET status = 'completed'
WHERE booking_id = $1
RETURNING booking_id, status
"""

UPDATE_REQUEST_STATUS_QUERY = """
UPDATE lockerhub.requests
SET status = 'completed'
WHERE request_id = $1
"""


async def confirm_key_return(booking_id: str) -> KeyReturnResponse:
    """Confirm that a key has been returned by a user.

    Args:
        booking_id: ID of the booking to confirm return for

    Returns:
        The key return confirmation response
    """
    try:
        async with db.transaction() as connection:
            booking = await connection.fetchrow(GET_BOOKING_QUERY, booking_id)
            if not booking:
                logger.warning("Booking not found")
                raise ValueError("Booking not found")

            if booking["status"] != "active":
                logger.warning("Booking is not in 'active' status")
                raise ValueError("Booking must be 'active' to confirm RETURN")

            key = await connection.fetchrow(
                UPDATE_KEY_STATUS_QUERY, booking["locker_id"]
            )
            if not key:
                logger.warning("Key not found for locker")
                raise ValueError("Key not found for this locker")

            if booking["special_request_id"]:
                await connection.execute(
                    UPDATE_REQUEST_STATUS_QUERY, booking["special_request_id"]
                )
                logger.info("Marked special request as completed")

            updated_booking = await connection.fetchrow(
                UPDATE_BOOKING_STATUS_QUERY, booking_id
            )

            logger.info("Confirmed key return for booking")

            return KeyReturnResponse(
                booking_id=updated_booking["booking_id"],
                key_number=key["key_number"],
            )

    except Exception:
        logger.error("Error confirming return for booking")
        raise
