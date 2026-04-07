"""Confirm key return."""

import json
from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import KeyReturnResponse

CONFIRM_KEY_RETURN_QUERY = """
WITH booking_info AS (
    SELECT 
        b.booking_id,
        b.locker_id,
        b.status,
        b.special_request_id,
        u.user_id,
        l.locker_number,
        f.floor_id
    FROM lockerhub.bookings b
    INNER JOIN lockerhub.users u ON b.user_id = u.user_id
    INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    INNER JOIN lockerhub.floors f ON l.floor_id = f.floor_id
    WHERE b.booking_id = $1
    AND b.status NOT IN ('upcoming'::lockerhub.booking_status, 'completed'::lockerhub.booking_status)
),
updated_key AS (
    UPDATE lockerhub.keys
    SET status = 'available'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP, updated_by = $2
    WHERE locker_id = (SELECT locker_id FROM booking_info) 
    AND status IN ('with_employee'::lockerhub.key_status, 'awaiting_return'::lockerhub.key_status)
    RETURNING key_id, key_number, status
),
updated_locker AS (
    UPDATE lockerhub.lockers
    SET status = 'available'::lockerhub.locker_status, updated_at = CURRENT_TIMESTAMP, updated_by = NULL
    WHERE locker_id = (SELECT locker_id FROM booking_info)
    RETURNING locker_id
),
updated_special_request AS (
    UPDATE lockerhub.requests
    SET status = 'completed'::lockerhub.request_status
    WHERE request_id = (SELECT special_request_id FROM booking_info WHERE special_request_id IS NOT NULL)
    RETURNING request_id
),
updated_booking AS (
    UPDATE lockerhub.bookings
    SET status = 'completed'::lockerhub.booking_status,
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
    bi.floor_id,
    bi.special_request_id,
    uk.key_id,
    uk.key_number,
    uk.status AS key_status,
    ub.booking_id AS booking_updated,
    ub.status AS booking_status,
    usr.request_id AS special_request_updated
FROM booking_info bi
CROSS JOIN updated_key uk
LEFT JOIN updated_locker ul ON true
CROSS JOIN updated_booking ub
LEFT JOIN updated_special_request usr ON true
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
        result = await db.fetchrow(
            CONFIRM_KEY_RETURN_QUERY,
            booking_id,
            admin_id,
        )

        if not result:
            logger.warning("Booking not found or in invalid state")
            raise ValueError("Booking not found or in 'upcoming'/'completed' status")

        if not result["key_id"]:
            logger.warning("Key not found for locker")
            raise ValueError("Key not found for this locker")

        if result["special_request_updated"]:
            logger.info("Marked special request as completed")

        logger.info("Updated locker status to available")

        await NotificationsServiceClient().post(
            "/",
            {
                "title": "Key Returned",
                "adminTitle": f"Key {result['key_number']} returned for Locker {result['locker_number']}",
                "caption": f"Your key {result['key_number']} has been successfully returned. Thank you!",
                "type": "success",
                "entityType": "key",
                "scope": "user",
                "userIds": [str(result["user_id"])],
                "createdBy": str(admin_id),
            },
        )

        await db.execute(
            "SELECT pg_notify('booking_event', $1)",
            json.dumps(
                {
                    "event_type": "booking_completed",
                    "floor_id": str(result["floor_id"]),
                    "booking_id": str(booking_id),
                }
            ),
        )

        logger.info("Confirmed key return for booking")

        return KeyReturnResponse(
            booking_id=result["booking_id"],
            key_number=result["key_number"],
        )

    except ValueError:
        raise
    except Exception:
        logger.error("Error confirming return for booking")
        raise
