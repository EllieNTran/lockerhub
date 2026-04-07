"""Confirm key handover."""

from datetime import datetime
from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import KeyHandoverResponse

CONFIRM_KEY_HANDOVER_QUERY = """
WITH booking_info AS (
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
    AND b.status = 'upcoming'::lockerhub.booking_status
    AND b.start_date <= $3
),
updated_key AS (
    UPDATE lockerhub.keys
    SET status = 'with_employee'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP, updated_by = $2
    WHERE locker_id = (SELECT locker_id FROM booking_info) 
    AND status = 'awaiting_handover'::lockerhub.key_status
    RETURNING key_id, key_number, status
),
updated_locker AS (
    UPDATE lockerhub.lockers
    SET status = 'occupied'::lockerhub.locker_status, updated_at = CURRENT_TIMESTAMP, updated_by = NULL
    WHERE locker_id = (SELECT locker_id FROM booking_info)
    RETURNING locker_id
),
updated_booking AS (
    UPDATE lockerhub.bookings
    SET status = 'active'::lockerhub.booking_status,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = NULL
    WHERE booking_id = $1
    AND EXISTS (SELECT 1 FROM booking_info)
    RETURNING booking_id, status
)
SELECT 
    bi.booking_id,
    bi.user_id,
    bi.locker_number,
    uk.key_id,
    uk.key_number,
    uk.status AS key_status,
    ub.booking_id AS booking_updated,
    ub.status AS booking_status
FROM booking_info bi
CROSS JOIN updated_key uk
LEFT JOIN updated_locker ul ON true
CROSS JOIN updated_booking ub
"""


async def confirm_key_handover(admin_id: str, booking_id: str) -> KeyHandoverResponse:
    """Confirm that a key has been handed over to a user.

    Args:
        admin_id: ID of the admin confirming the handover
        booking_id: ID of the booking to confirm handover for

    Returns:
        The key handover confirmation response
    """
    try:
        result = await db.fetchrow(
            CONFIRM_KEY_HANDOVER_QUERY,
            booking_id,
            admin_id,
            datetime.now().date(),
        )

        if not result:
            logger.warning("Booking not found or invalid state for handover")
            raise ValueError(
                "Booking not found, not 'upcoming', or start date is in the future"
            )

        if not result["key_id"]:
            logger.warning("Key not found for locker")
            raise ValueError("Key not found for this locker")

        if not result["booking_updated"]:
            logger.warning("Failed to update booking status")
            raise ValueError("Failed to update booking status")

        await NotificationsServiceClient().post(
            "/",
            {
                "title": "Key Handed Over",
                "adminTitle": f"Key {result['key_number']} handed over for Locker {result['locker_number']}",
                "caption": f"You are now in possession of the key {result['key_number']}. Please return it by the end of your booking.",
                "type": "info",
                "entityType": "key",
                "scope": "user",
                "userIds": [str(result["user_id"])],
                "createdBy": str(admin_id),
            },
        )

        logger.info("Confirmed key handover for booking")

        return KeyHandoverResponse(
            booking_id=result["booking_id"],
            key_number=result["key_number"],
        )

    except ValueError:
        raise
    except Exception:
        logger.error("Error confirming handover for booking")
        raise
