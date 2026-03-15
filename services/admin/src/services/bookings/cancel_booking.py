"""Cancel a booking."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import CancelBookingResponse

CANCEL_BOOKING_QUERY = """
UPDATE lockerhub.bookings
SET status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE booking_id = $1
RETURNING booking_id, status
"""


async def cancel_booking(booking_id: str) -> CancelBookingResponse:
    """Cancel a booking by setting its status to 'cancelled'.

    Args:
        booking_id: ID of the booking to cancel

    Returns:
        The cancelled booking response
    """
    try:
        result = await db.fetchrow(CANCEL_BOOKING_QUERY, booking_id)
        if not result:
            logger.warning("Booking not found for cancellation")
            raise ValueError("Booking not found")
        logger.info("Cancelled booking successfully")
        return CancelBookingResponse(booking_id=result["booking_id"])
    except Exception:
        logger.error("Error cancelling booking")
        raise
