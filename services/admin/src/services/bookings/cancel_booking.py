"""Cancel a booking."""

from src.logger import logger
from src.connectors.db import db

CANCEL_BOOKING_QUERY = """
UPDATE lockerhub.bookings
SET status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE booking_id = $1
RETURNING booking_id, status
"""


async def cancel_booking(booking_id: str) -> dict:
    """Cancel a booking by setting its status to 'cancelled'.

    Args:
        booking_id: ID of the booking to cancel

    Returns:
        A dictionary containing the updated booking details
    """
    try:
        result = await db.fetchrow(CANCEL_BOOKING_QUERY, booking_id)
        if not result:
            logger.warning(f"Booking {booking_id} not found for cancellation")
            raise ValueError("Booking not found")
        logger.info(f"Cancelled booking {booking_id} successfully")
        return {"booking_id": result["booking_id"], "status": result["status"]}
    except Exception as e:
        logger.error(f"Error cancelling booking {booking_id}: {e}")
        raise
