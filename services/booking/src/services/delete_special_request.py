"""Delete a special request by ID."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import DeleteSpecialRequestResponse

GET_SPECIAL_REQUEST_QUERY = """
SELECT user_id
FROM lockerhub.requests
WHERE request_id = $1
AND request_type = 'special'
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

DELETE_SPECIAL_REQUEST_QUERY = """
DELETE FROM lockerhub.requests
WHERE request_id = $1
RETURNING request_id;
"""


async def delete_special_request(
    user_id: str, request_id: int
) -> DeleteSpecialRequestResponse:
    """
    Delete a special request by ID.
    If the request has an associated active booking, cancel it first.

    Args:
        user_id: ID of the user deleting the request
        request_id: ID of the special request to delete

    Returns:
        ID of the deleted request

    Raises:
        ValueError: If the request cannot be deleted
    """
    try:
        async with db.transaction() as connection:
            request = await connection.fetchrow(GET_SPECIAL_REQUEST_QUERY, request_id)

            if not request:
                logger.warning("Special request not found for deletion")
                raise ValueError("Special request not found")
            if str(request["user_id"]) != user_id:
                logger.warning("User not authorized to delete this special request")
                raise ValueError("User not authorized to delete this special request")

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

            deleted_request_id = await connection.fetchval(
                DELETE_SPECIAL_REQUEST_QUERY, request_id
            )
            if not deleted_request_id:
                raise ValueError("Special request not found or could not be deleted")

            logger.info("Deleted special request")
            return DeleteSpecialRequestResponse(request_id=deleted_request_id)
    except Exception as e:
        logger.error(f"Error deleting special request: {e}")
        raise
