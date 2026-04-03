"""Cancel a special request by ID."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import CancelSpecialRequestResponse

GET_SPECIAL_REQUEST_QUERY = """
SELECT 
    r.user_id,
    r.end_date,
    f.floor_number
FROM lockerhub.requests r
JOIN lockerhub.floors f ON r.floor_id = f.floor_id
WHERE r.request_id = $1
AND r.request_type = 'special'
"""

GET_ASSOCIATED_BOOKING_QUERY = """
SELECT booking_id, locker_id, start_date, end_date
FROM lockerhub.bookings
WHERE special_request_id = $1
AND status NOT IN ('cancelled', 'completed')
"""

CANCEL_BOOKING_QUERY = """
UPDATE lockerhub.bookings
SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP, updated_by = $2
WHERE booking_id = $1
RETURNING booking_id, user_id, locker_id, start_date, end_date
"""

UPDATE_LOCKER_STATUS_QUERY = """
UPDATE lockerhub.lockers
SET status = 'available', updated_at = CURRENT_TIMESTAMP, updated_by = $2
WHERE locker_id = $1
AND status = 'reserved'
AND NOT EXISTS (
    SELECT 1 FROM lockerhub.bookings
    WHERE locker_id = $1
    AND status NOT IN ('cancelled', 'completed')
    AND booking_id != $3
)
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'available', updated_at = CURRENT_TIMESTAMP, updated_by = $2
WHERE locker_id = $1
AND status = 'awaiting_handover'
"""

CANCEL_SPECIAL_REQUEST_QUERY = """
UPDATE lockerhub.requests
SET status = 'cancelled', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
WHERE request_id = $1
RETURNING request_id;
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
        async with db.transaction() as connection:
            request = await connection.fetchrow(GET_SPECIAL_REQUEST_QUERY, request_id)

            if not request:
                logger.warning("Special request not found for cancellation")
                raise ValueError("Special request not found")
            if str(request["user_id"]) != user_id:
                logger.warning("User not authorized to cancel this special request")
                raise ValueError("User not authorized to cancel this special request")

            booking = await connection.fetchrow(
                GET_ASSOCIATED_BOOKING_QUERY, request_id
            )

            if booking:
                logger.info("Cancelling associated booking for special request")

                cancelled_booking = await connection.fetchrow(
                    CANCEL_BOOKING_QUERY, booking["booking_id"], user_id
                )

                if cancelled_booking:
                    await connection.execute(
                        UPDATE_LOCKER_STATUS_QUERY,
                        booking["locker_id"],
                        user_id,
                        booking["booking_id"],
                    )

                    await connection.execute(
                        UPDATE_KEY_STATUS_QUERY, booking["locker_id"], user_id
                    )

                    await NotificationsServiceClient().post(
                        "/notifications/booking/cancellation",
                        {
                            "userId": str(cancelled_booking["user_id"]),
                            "bookingId": str(cancelled_booking["booking_id"]),
                            "startDate": cancelled_booking["start_date"].isoformat(),
                            "endDate": (
                                cancelled_booking["end_date"].isoformat()
                                if cancelled_booking["end_date"]
                                else None
                            ),
                            "createdBy": user_id,
                        },
                    )

            cancelled_request_id = await connection.fetchval(
                CANCEL_SPECIAL_REQUEST_QUERY, request_id, user_id
            )
            if not cancelled_request_id:
                raise ValueError("Special request not found or could not be cancelled")

            await NotificationsServiceClient().post(
                "/",
                {
                    "entityType": "request",
                    "title": "Special Request Cancelled",
                    "adminTitle": f"Special request #{request_id} cancelled",
                    "caption": f"Your special request for {"permanent" if (request["end_date"] is None) else "long-term"} locker allocation on Floor {request['floor_number']} has been cancelled.",
                    "type": "info",
                    "scope": "user",
                    "userIds": [str(request["user_id"])],
                    "createdBy": user_id,
                },
            )

            logger.info("Cancelled special request")
            return CancelSpecialRequestResponse(request_id=cancelled_request_id)
    except Exception:
        logger.error("Error cancelling special request")
        raise
