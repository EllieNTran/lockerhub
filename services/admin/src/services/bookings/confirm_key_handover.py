"""Confirm key handover."""

from datetime import datetime
from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import KeyHandoverResponse

GET_BOOKING_QUERY = """
SELECT 
    b.booking_id,
    b.locker_id,
    b.status,
    b.start_date,
    u.user_id,
    l.locker_number
FROM lockerhub.bookings b
INNER JOIN lockerhub.users u ON b.user_id = u.user_id
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
WHERE booking_id = $1
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'with_employee', updated_at = CURRENT_TIMESTAMP
WHERE locker_id = $1 AND status = 'awaiting_handover'
RETURNING key_id, key_number, status
"""

UPDATE_BOOKING_STATUS_QUERY = """
UPDATE lockerhub.bookings
SET status = 'active', updated_at = CURRENT_TIMESTAMP
WHERE booking_id = $1
RETURNING booking_id, status
"""

UPDATE_LOCKER_STATUS_QUERY = """
UPDATE lockerhub.lockers
SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
WHERE locker_id = $1
"""


async def confirm_key_handover(user_id: str, booking_id: str) -> KeyHandoverResponse:
    """Confirm that a key has been handed over to a user.

    Args:
        user_id: ID of the admin confirming the handover
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

            today = datetime.now().date()
            if booking["start_date"] > today:
                logger.warning("Cannot hand over key before booking start date")
                raise ValueError("Cannot hand over key before booking start date")

            key = await connection.fetchrow(
                UPDATE_KEY_STATUS_QUERY, booking["locker_id"]
            )
            if not key:
                logger.warning("Key not found for locker")
                raise ValueError("Key not found for this locker")

            await connection.execute(UPDATE_LOCKER_STATUS_QUERY, booking["locker_id"])

            updated_booking = await connection.fetchrow(
                UPDATE_BOOKING_STATUS_QUERY, booking_id
            )

            await NotificationsServiceClient().post(
                "/",
                {
                    "title": "Key Handed Over",
                    "adminTitle": f"Key {key['key_number']} handed over for Locker {booking['locker_number']}",
                    "caption": f"You are now in possession of the key {key['key_number']}. Please return it by the end of your booking.",
                    "type": "info",
                    "entityType": "key",
                    "scope": "user",
                    "userIds": [str(booking["user_id"])],
                    "createdBy": str(user_id),
                },
            )

            logger.info("Confirmed key handover for booking")

            return KeyHandoverResponse(
                booking_id=updated_booking["booking_id"],
                key_number=key["key_number"],
            )

    except Exception:
        logger.error("Error confirming handover for booking")
        raise
