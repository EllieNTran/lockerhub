"""Update an existing booking (shorten only)."""

from datetime import date

from src.logger import logger
from src.connectors.db import db
from src.models.responses import UpdateBookingResponse

UPDATE_BOOKING_WITH_VALIDATION_QUERY = """
WITH booking_check AS (
    SELECT start_date, end_date, user_id
    FROM lockerhub.bookings
    WHERE booking_id = $1
    AND user_id = $2
),
updated_booking AS (
    UPDATE lockerhub.bookings
    SET start_date = $3,
        end_date = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = $1
    AND user_id = $2
    AND $3 >= (SELECT start_date FROM booking_check)
    AND $4 <= (SELECT end_date FROM booking_check)
    AND $3 < $4
    RETURNING booking_id
)
SELECT 
    bc.start_date AS original_start,
    bc.end_date AS original_end,
    ub.booking_id
FROM booking_check bc
LEFT JOIN updated_booking ub ON true
"""


async def update_booking(
    user_id: str,
    booking_id: str,
    new_start_date: str = None,
    new_end_date: str = None,
) -> UpdateBookingResponse:
    """
    Update booking dates (can only shorten, not extend).

    Args:
        user_id: ID of the user requesting the update (for authorization)
        booking_id: ID of the booking to update
        new_start_date: Proposed new start date for the booking
        new_end_date: Proposed new end date for the booking

    Returns:
        UpdateBookingResponse with the booking ID
    """
    try:
        booking_check = await db.fetchrow(
            "SELECT start_date, end_date FROM lockerhub.bookings WHERE booking_id = $1 AND user_id = $2",
            booking_id,
            user_id,
        )

        if not booking_check:
            logger.warning("Booking not found or unauthorized")
            raise ValueError("Booking not found or unauthorized")

        original_start = booking_check["start_date"]
        original_end = booking_check["end_date"]

        start_date = (
            date.fromisoformat(new_start_date) if new_start_date else original_start
        )
        end_date = date.fromisoformat(new_end_date) if new_end_date else original_end

        if start_date < original_start:
            raise ValueError("Cannot move start date earlier")
        if end_date > original_end:
            raise ValueError("Cannot move end date later (use extension request)")
        if start_date >= end_date:
            raise ValueError("Start date must be before end date")

        result = await db.fetchrow(
            UPDATE_BOOKING_WITH_VALIDATION_QUERY,
            booking_id,
            user_id,
            start_date,
            end_date,
        )

        if not result or not result["booking_id"]:
            logger.error("Failed to update booking - validation failed")
            raise ValueError("Failed to update booking")

        logger.info("Updated booking")
        return UpdateBookingResponse(booking_id=result["booking_id"])
    except ValueError:
        raise
    except Exception:
        logger.error("Error updating booking")
        raise
