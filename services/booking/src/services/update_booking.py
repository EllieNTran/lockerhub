"""Update an existing booking (shorten only)."""

from src.logger import logger
from src.connectors.db import db

GET_BOOKING_QUERY = """
SELECT start_date, end_date, user_id FROM lockerhub.bookings
WHERE booking_id = $1
"""

UPDATE_BOOKING_QUERY = """
UPDATE lockerhub.bookings
SET start_date = $2,
    end_date = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE booking_id = $1
RETURNING booking_id
"""


async def update_booking(
    user_id: str,
    booking_id: str,
    new_start_date: str = None,
    new_end_date: str = None,
) -> str:
    """
    Update booking dates (can only shorten, not extend).

    Args:
        user_id: ID of the user requesting the update (for authorization)
        booking_id: ID of the booking to update
        new_start_date: Proposed new start date for the booking
        new_end_date: Proposed new end date for the booking

    Returns:
        The ID of the updated booking
    """
    try:
        async with db.transaction() as connection:
            booking = await connection.fetchrow(GET_BOOKING_QUERY, booking_id)

            if not booking:
                logger.warning("Booking not found for update")
                raise ValueError("Booking not found")

            if booking["user_id"] != user_id:
                logger.warning(
                    f"User {user_id} attempted to update booking {booking_id} not owned by them"
                )
                raise ValueError("Unauthorized")

            original_start = booking["start_date"]
            original_end = booking["end_date"]

            start_date = new_start_date or original_start
            end_date = new_end_date or original_end

            if start_date < original_start:
                raise ValueError("Cannot move start date earlier")

            if end_date > original_end:
                raise ValueError("Cannot move end date later (use extension request)")

            if start_date >= end_date:
                raise ValueError("Start date must be before end date")

            updated_id = await connection.fetchval(
                UPDATE_BOOKING_QUERY, booking_id, start_date, end_date
            )
            logger.info(
                f"Updated booking {booking_id}: {original_start} to {original_end} → {start_date} to {end_date}"
            )

            return updated_id
    except Exception:
        logger.error("Error updating booking")
        raise
