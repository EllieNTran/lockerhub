"""Create a new booking for a user (admin)."""

from datetime import date
from asyncpg.exceptions import ExclusionViolationError

from src.logger import logger
from src.connectors.db import db
from src.models.responses import CreateBookingResponse

CREATE_BOOKING_QUERY = """
INSERT INTO lockerhub.bookings (
    user_id,
    locker_id,
    start_date,
    end_date
)
VALUES ($1, $2, $3, $4)
RETURNING booking_id
"""


async def create_booking(
    user_id: str, locker_id: str, start_date: date, end_date: date
) -> CreateBookingResponse:
    """
    Create a new booking for a user (admin override).

    Admin can create bookings without restrictions. This bypasses the normal user
    restriction of one active booking at a time, allowing admins to create multiple
    overlapping bookings for a user if needed.

    Note: Locker status remains 'available' until start_date arrives.
    A scheduled job will update locker to 'reserved' and key to 'awaiting_handover' on start_date.

    Args:
        user_id: ID of the user to create booking for
        locker_id: ID of the locker to book
        start_date: Start date of the booking
        end_date: End date of the booking

    Returns:
        CreateBookingResponse with the booking ID

    Raises:
        ValueError: If there's a locker booking conflict (locker already booked for this period)
    """
    try:
        booking_id = await db.fetchval(
            CREATE_BOOKING_QUERY, user_id, locker_id, start_date, end_date
        )
        logger.info(
            f"Created booking {booking_id} for user {user_id} and locker {locker_id} ({start_date} to {end_date})"
        )
        return CreateBookingResponse(booking_id=booking_id)
    except ExclusionViolationError:
        logger.warning(
            f"Booking conflict for locker {locker_id} between {start_date} and {end_date}"
        )
        raise ValueError("Booking conflict")
    except Exception:
        logger.error(
            f"Error creating booking for user {user_id} and locker {locker_id}: {e}"
        )
        raise
