"""Create a new booking for a locker."""

from datetime import date
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

CHECK_USER_EXISTING_BOOKING_QUERY = """
SELECT booking_id, locker_id, start_date, end_date
FROM lockerhub.bookings
WHERE user_id = $1
AND status IN ('upcoming', 'active')
AND (
    -- Check if date ranges overlap
    daterange($2, $3, '[]') && daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]')
)
LIMIT 1
"""


async def create_booking(
    user_id: str, locker_id: str, start_date: date, end_date: date
) -> str:
    """
    Create a new booking for a locker.

    Users are restricted to ONE active booking at a time. If they already have
    an active or upcoming booking that overlaps with the requested dates, the
    booking will be rejected.

    Args:
        user_id: ID of the user making the booking
        locker_id: ID of the locker to book
        start_date: Start date of the booking
        end_date: End date of the booking

    Returns:
        The ID of the created booking

    Raises:
        ValueError: If user already has an overlapping booking, or if there's a locker conflict
    """
    try:
        existing_booking = await db.fetchrow(
            CHECK_USER_EXISTING_BOOKING_QUERY, user_id, start_date, end_date
        )

        if existing_booking:
            logger.warning(
                f"User {user_id} already has booking {existing_booking['booking_id']} "
                f"from {existing_booking['start_date']} to {existing_booking['end_date']}"
            )
            raise ValueError("Existing overlapping booking exists for this user")

        booking_id = await db.fetchval(
            CREATE_BOOKING_QUERY, user_id, locker_id, start_date, end_date
        )
        logger.info(
            f"Created booking {booking_id} for user {user_id} and locker {locker_id}"
        )
        return booking_id
    except ValueError:
        raise
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
