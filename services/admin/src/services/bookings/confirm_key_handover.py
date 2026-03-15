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
                logger.warning(f"Booking {booking_id} not found")
                raise ValueError("Booking not found")

            if booking["status"] != "upcoming":
                logger.warning(
                    f"Booking {booking_id} is not in 'upcoming' status (current: {booking['status']})"
                )
                raise ValueError(
                    f"Booking must be 'upcoming' to confirm handover (current: {booking['status']})"
                )

            key = await connection.fetchrow(
                UPDATE_KEY_STATUS_QUERY, booking["locker_id"]
            )
            if not key:
                logger.warning(f"Key not found for locker {booking['locker_id']}")
                raise ValueError("Key not found for this locker")

            updated_booking = await connection.fetchrow(
                UPDATE_BOOKING_STATUS_QUERY, booking_id
            )

            logger.info(
                f"Confirmed key handover for booking {booking_id}, key {key['key_number']}"
            )

            return KeyHandoverResponse(
                booking_id=updated_booking["booking_id"],
                key_number=key["key_number"],
            )

    except Exception as e:
        logger.error(f"Error confirming handover for booking {booking_id}: {e}")
        raise
