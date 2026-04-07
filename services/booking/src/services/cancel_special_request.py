"""Cancel a special request by ID."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import CancelSpecialRequestResponse

CANCEL_SPECIAL_REQUEST_WITH_BOOKING_QUERY = """
WITH special_request_check AS (
    SELECT 
        r.request_id,
        r.user_id,
        r.end_date,
        f.floor_number
    FROM lockerhub.requests r
    JOIN lockerhub.floors f ON r.floor_id = f.floor_id
    WHERE r.request_id = $1
    AND r.request_type = 'special'
    AND r.user_id = $2
),
associated_booking AS (
    SELECT 
        b.booking_id, 
        b.locker_id, 
        b.start_date, 
        b.end_date, 
        b.user_id,
        u.email,
        u.first_name,
        l.locker_number,
        f.floor_number,
        k.key_number,
        k.status AS key_status
    FROM lockerhub.bookings b
    JOIN lockerhub.users u ON b.user_id = u.user_id
    JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    JOIN lockerhub.floors f ON l.floor_id = f.floor_id
    LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
    WHERE b.special_request_id = $1
    AND b.status NOT IN ('cancelled', 'completed')
),
cancelled_booking AS (
    UPDATE lockerhub.bookings
    SET status = 'cancelled'::lockerhub.booking_status, updated_at = CURRENT_TIMESTAMP, updated_by = $2
    WHERE booking_id = (SELECT booking_id FROM associated_booking)
    RETURNING booking_id, user_id, locker_id, start_date, end_date
),
updated_locker AS (
    UPDATE lockerhub.lockers
    SET status = 'available'::lockerhub.locker_status, updated_at = CURRENT_TIMESTAMP, updated_by = $2
    WHERE locker_id = (SELECT locker_id FROM cancelled_booking)
    AND status = 'reserved'
    AND NOT EXISTS (
        SELECT 1 FROM lockerhub.bookings
        WHERE locker_id = (SELECT locker_id FROM cancelled_booking)
        AND status NOT IN ('cancelled', 'completed')
        AND booking_id != (SELECT booking_id FROM cancelled_booking)
    )
    RETURNING locker_id
),
updated_key AS (
    UPDATE lockerhub.keys
    SET status = 'available'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP, updated_by = $2
    WHERE locker_id = (SELECT locker_id FROM cancelled_booking)
    AND status = 'awaiting_handover'::lockerhub.key_status
    RETURNING key_id
),
cancelled_request AS (
    UPDATE lockerhub.requests
    SET status = 'cancelled'::lockerhub.request_status, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
    WHERE request_id = $1
    AND user_id = $2
    RETURNING request_id
)
SELECT 
    cr.request_id,
    src.user_id,
    src.end_date,
    src.floor_number,
    cb.booking_id,
    cb.start_date AS booking_start_date,
    cb.end_date AS booking_end_date,
    ab.email,
    ab.first_name,
    ab.locker_number,
    ab.floor_number AS booking_floor_number,
    ab.key_number,
    ab.key_status
FROM special_request_check src
LEFT JOIN cancelled_request cr ON src.request_id = cr.request_id
LEFT JOIN cancelled_booking cb ON true
LEFT JOIN associated_booking ab ON true
"""


async def cancel_special_request(
    user_id: str, request_id: int
) -> CancelSpecialRequestResponse:
    """
    Cancel a special request by ID.
    If the request has an associated active booking, cancel it first.

    Args:
        user_id: ID of the user cancelling the request
        request_id: ID of the special request to cancel

    Returns:
        ID of the cancelled request

    Raises:
        ValueError: If the request cannot be cancelled
    """
    try:
        result = await db.fetchrow(
            CANCEL_SPECIAL_REQUEST_WITH_BOOKING_QUERY, request_id, user_id
        )

        if not result or not result["request_id"]:
            logger.warning("Special request not found or unauthorized")
            raise ValueError("Special request not found or user not authorized")

        if result["booking_id"]:
            logger.info("Cancelled associated booking for special request")
            await NotificationsServiceClient().post(
                "/booking/cancellation",
                {
                    "userId": user_id,
                    "email": result["email"],
                    "name": result["first_name"],
                    "lockerNumber": result["locker_number"],
                    "floorNumber": result["booking_floor_number"],
                    "startDate": result["booking_start_date"].isoformat(),
                    "endDate": (
                        result["booking_end_date"].isoformat()
                        if result["booking_end_date"]
                        else None
                    ),
                    "keyStatus": result["key_status"] or "N/A",
                    "keyNumber": result["key_number"] or "N/A",
                    "adminBookingsPath": "/admin/bookings",
                },
            )

        await NotificationsServiceClient().post(
            "/",
            {
                "entityType": "request",
                "title": "Special Request Cancelled",
                "adminTitle": f"Special request #{request_id} cancelled",
                "caption": f"Your special request for {"permanent" if (result["end_date"] is None) else "long-term"} locker allocation on Floor {result['floor_number']} has been cancelled.",
                "type": "info",
                "scope": "user",
                "userIds": [user_id],
                "createdBy": user_id,
            },
        )

        logger.info("Cancelled special request")
        return CancelSpecialRequestResponse(request_id=result["request_id"])
    except ValueError:
        raise
    except Exception:
        logger.error("Error cancelling special request")
        raise
