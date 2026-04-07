"""Cancel an existing booking by updating its status."""

import json
from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import UpdateBookingResponse

CANCEL_BOOKING_WITH_UPDATES_QUERY = """
WITH booking_info AS (
    SELECT
        b.booking_id,
        b.user_id, 
        b.status,
        b.locker_id,
        b.special_request_id,
        u.email, 
        u.first_name, 
        l.locker_number, 
        f.floor_number,
        f.floor_id,
        b.start_date, 
        b.end_date,
        k.status as key_status,
        k.key_number
    FROM lockerhub.bookings b
    JOIN lockerhub.users u ON b.user_id = u.user_id
    JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    JOIN lockerhub.floors f ON l.floor_id = f.floor_id
    LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
    WHERE b.booking_id = $1
    AND b.user_id = $2
),
cancelled_booking AS (
    UPDATE lockerhub.bookings
    SET status = 'cancelled'::lockerhub.booking_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = $1
    AND user_id = $2
    AND status != 'cancelled'::lockerhub.booking_status
    RETURNING booking_id
),
cancelled_special_request AS (
    UPDATE lockerhub.requests
    SET status = 'cancelled'::lockerhub.request_status
    WHERE request_id = (SELECT special_request_id FROM booking_info WHERE special_request_id IS NOT NULL)
    RETURNING request_id
),
updated_key AS (
    UPDATE lockerhub.keys
    SET status = CASE 
        WHEN status = 'awaiting_handover' THEN 'available'
        WHEN status = 'with_employee' THEN 'awaiting_return'
        ELSE status
    END,
    updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = (SELECT locker_id FROM booking_info)
    AND status IN ('awaiting_handover', 'with_employee')
    RETURNING status AS new_key_status
),
updated_locker AS (
    UPDATE lockerhub.lockers
    SET status = 'available', 
        updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = (SELECT locker_id FROM booking_info)
    AND status = 'reserved'
    RETURNING locker_id
)
SELECT 
    bi.*,
    cb.booking_id AS cancelled_booking_id,
    uk.new_key_status
FROM booking_info bi
LEFT JOIN cancelled_booking cb ON true
LEFT JOIN updated_key uk ON true
LEFT JOIN updated_locker ul ON true
"""


async def cancel_booking(user_id: str, booking_id: str) -> UpdateBookingResponse:
    """
    Cancel an existing booking by updating its status to 'cancelled'.

    Automatically handles key and locker status updates:
    - Key: 'awaiting_handover' → 'available' | 'with_employee' → 'awaiting_return'
    - Locker: 'reserved' → 'available'

    Args:
        user_id: ID of the user requesting the cancellation (for authorization)
        booking_id: ID of the booking to cancel

    Returns:
        UpdateBookingResponse with the cancelled booking ID
    """
    try:
        result = await db.fetchrow(
            CANCEL_BOOKING_WITH_UPDATES_QUERY,
            booking_id,
            user_id,
        )

        if not result:
            logger.warning("Booking not found or unauthorized")
            raise ValueError("Booking not found or unauthorized")

        if result["status"] == "cancelled" and not result["cancelled_booking_id"]:
            logger.warning("Booking is already cancelled")
            raise ValueError("Booking is already cancelled")

        if not result["cancelled_booking_id"]:
            logger.error("Failed to cancel booking")
            raise ValueError("Failed to cancel booking")

        if result["new_key_status"]:
            logger.info(
                f"Updated key status to '{result['new_key_status']}' after cancellation"
            )

        await NotificationsServiceClient().post(
            "/booking/cancellation",
            {
                "userId": user_id,
                "email": result["email"],
                "name": result["first_name"],
                "lockerNumber": result["locker_number"],
                "floorNumber": result["floor_number"],
                "startDate": result["start_date"].isoformat(),
                "endDate": (
                    result["end_date"].isoformat() if result["end_date"] else None
                ),
                "keyStatus": result["key_status"] or "N/A",
                "keyNumber": result["key_number"] or "N/A",
                "adminBookingsPath": "/admin/bookings",
                "createdBy": user_id,
            },
        )

        await db.execute(
            "SELECT pg_notify('booking_event', $1)",
            json.dumps(
                {
                    "event_type": "booking_cancelled",
                    "floor_id": str(result["floor_id"]),
                    "booking_id": str(booking_id),
                }
            ),
        )

        logger.info("Cancelled booking and updated related entities")

        return UpdateBookingResponse(booking_id=result["cancelled_booking_id"])
    except ValueError:
        raise
    except Exception:
        logger.error("Error cancelling booking")
        raise
