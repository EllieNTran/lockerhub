"""Confirm key handover."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import KeyHandoverResponse

GET_BOOKING_QUERY = """
SELECT 
    booking_id,
    locker_id,
    status
FROM lockerhub.bookings
WHERE booking_id = $1
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'with_employee'
WHERE locker_id = $1
RETURNING key_id, key_number, status
"""

UPDATE_BOOKING_STATUS_QUERY = """
UPDATE lockerhub.bookings
SET status = 'active'
WHERE booking_id = $1
RETURNING booking_id, status
"""


async def confirm_key_handover(booking_id: str) -> KeyHandoverResponse:
    """Confirm that a key has been handed over to a user.

    Args:
        booking_id: ID of the booking to confirm handover for

    Returns:
        The key handover confirmation response
    """
    try:
        async with db.transaction() as connection:
            booking = await connection.fetchrow(GET_BOOKING_QUERY, booking_id)
            if not booking:
                logger.warning("Booking not found")
                raise ValueError("Booking not found")

            if booking["status"] != "upcoming":
                logger.warning("Booking is not in 'upcoming' status")
                raise ValueError("Booking must be 'upcoming' to confirm handover")

            key = await connection.fetchrow(
                UPDATE_KEY_STATUS_QUERY, booking["locker_id"]
            )
            if not key:
                logger.warning("Key not found for locker")
                raise ValueError("Key not found for this locker")

            updated_booking = await connection.fetchrow(
                UPDATE_BOOKING_STATUS_QUERY, booking_id
            )

            logger.info("Confirmed key handover for booking")

            return KeyHandoverResponse(
                booking_id=updated_booking["booking_id"],
                key_number=key["key_number"],
            )

    except Exception:
        logger.error("Error confirming handover for booking")
        raise
