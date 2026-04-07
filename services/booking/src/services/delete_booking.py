"""Delete an existing booking."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import DeleteBookingResponse

DELETE_BOOKING_AND_REQUESTS_QUERY = """
WITH deleted_requests AS (
    DELETE FROM lockerhub.requests
    WHERE booking_id = $1 
    AND request_type = 'extension'
    AND EXISTS (
        SELECT 1 FROM lockerhub.bookings 
        WHERE booking_id = $1 AND user_id = $2
    )
),
deleted_booking AS (
    DELETE FROM lockerhub.bookings
    WHERE booking_id = $1 AND user_id = $2
    RETURNING booking_id, user_id, locker_id
)
SELECT 
    db.booking_id,
    db.user_id,
    k.key_number,
    k.status AS key_status
FROM deleted_booking db
INNER JOIN lockerhub.keys k ON db.locker_id = k.locker_id
"""


async def delete_booking(user_id: str, booking_id: str) -> DeleteBookingResponse:
    """
    Delete an existing booking and return key information.

    Args:
        user_id: ID of the user requesting the deletion (for authorization)
        booking_id: ID of the booking to delete

    Returns:
        The deleted booking details with key information
    """
    try:
        result = await db.fetchrow(
            DELETE_BOOKING_AND_REQUESTS_QUERY, booking_id, user_id
        )

        if not result:
            logger.warning("Booking not found or unauthorized")
            raise ValueError("Booking not found or unauthorized")

        logger.info("Deleted booking")

        return DeleteBookingResponse(
            booking_id=result["booking_id"],
            key_number=result["key_number"],
            key_status=result["key_status"],
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Error deleting booking")
        raise
