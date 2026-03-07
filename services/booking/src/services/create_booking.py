"""Create a new booking for a locker."""

from asyncpg.exceptions import ExclusionViolationError

from src.logger import logger
from src.connectors.db import db

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
    user_id: str, locker_id: str, start_date: str, end_date: str
) -> str:
    """
    Create a new booking for a locker.

    Args:
        user_id: ID of the user making the booking
        locker_id: ID of the locker to book
        start_date: Start date of the booking (ISO format)
        end_date: End date of the booking (ISO format)

    Returns:
        The ID of the created booking
    """
    try:
        booking_id = await db.fetchval(
            CREATE_BOOKING_QUERY, user_id, locker_id, start_date, end_date
        )
        logger.info(
            f"Created booking {booking_id} for user {user_id} and locker {locker_id}"
        )
        return booking_id
    except ExclusionViolationError:
        logger.warning(
            f"Booking conflict for locker {locker_id} between {start_date} and {end_date}"
        )
        raise ValueError("Booking conflict")
    except Exception as e:
        logger.error(
            f"Error creating booking for user {user_id} and locker {locker_id}: {e}"
        )
        raise
