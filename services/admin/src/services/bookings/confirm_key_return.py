"""Confirm key return."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import KeyReturnResponse

GET_BOOKING_QUERY = """
SELECT 
    b.booking_id,
    b.locker_id,
    b.status,
    b.special_request_id,
    u.user_id,
    l.locker_number
FROM lockerhub.bookings b
INNER JOIN lockerhub.users u ON b.user_id = u.user_id
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
WHERE b.booking_id = $1
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'available', updated_at = CURRENT_TIMESTAMP, updated_by = $2
WHERE locker_id = $1 AND status IN ('with_employee', 'awaiting_return')
RETURNING key_id, key_number, status
"""

UPDATE_LOCKER_STATUS_QUERY = """
UPDATE lockerhub.lockers
SET status = 'available', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE locker_id = $1
"""

UPDATE_BOOKING_STATUS_QUERY = """
UPDATE lockerhub.bookings
SET status = 'completed',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = NULL
WHERE booking_id = $1
RETURNING booking_id, status
"""

UPDATE_REQUEST_STATUS_QUERY = """
UPDATE lockerhub.requests
SET status = 'completed'
WHERE request_id = $1
"""


async def confirm_key_return(admin_id: str, booking_id: str) -> KeyReturnResponse:
    """Confirm that a key has been returned by a user.

    Args:
        admin_id: ID of the admin confirming the return
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

            if booking["status"] != "active" and booking["status"] != "cancelled":
                logger.warning("Booking is not in 'active' or 'cancelled' status")
                raise ValueError(
                    "Booking must be 'active' or 'cancelled' to confirm RETURN"
                )

            key = await connection.fetchrow(
                UPDATE_KEY_STATUS_QUERY, booking["locker_id"], admin_id
            )
            if not key:
                logger.warning("Key not found for locker")
                raise ValueError("Key not found for this locker")

            await connection.execute(UPDATE_LOCKER_STATUS_QUERY, booking["locker_id"])
            logger.info("Updated locker status to available")

            if booking["special_request_id"]:
                await connection.execute(
                    UPDATE_REQUEST_STATUS_QUERY, booking["special_request_id"]
                )
                logger.info("Marked special request as completed")

            updated_booking = await connection.fetchrow(
                UPDATE_BOOKING_STATUS_QUERY, booking_id
            )

            await NotificationsServiceClient().post(
                "/",
                {
                    "title": "Key Returned",
                    "adminTitle": f"Key {key['key_number']} returned for Locker {booking['locker_number']}",
                    "caption": f"Your key {key['key_number']} has been successfully returned. Thank you!",
                    "type": "success",
                    "entityType": "key",
                    "scope": "user",
                    "userIds": [str(booking["user_id"])],
                    "createdBy": str(admin_id),
                },
            )

            logger.info("Confirmed key return for booking")

            return KeyReturnResponse(
                booking_id=updated_booking["booking_id"],
                key_number=key["key_number"],
            )

    except Exception:
        logger.error("Error confirming return for booking")
        raise
