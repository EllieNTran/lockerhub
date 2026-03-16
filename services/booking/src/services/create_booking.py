"""Create a new booking for a locker."""

from datetime import date
from asyncpg.exceptions import ExclusionViolationError

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient

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

GET_BOOKING_DETAILS_QUERY = """
SELECT 
    u.email,
    u.first_name,
    l.locker_number,
    f.floor_number
FROM lockerhub.users u
JOIN lockerhub.lockers l ON l.locker_id = $1
JOIN lockerhub.floors f ON f.floor_id = l.floor_id
WHERE u.user_id = $2
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
                "User already has an existing booking that overlaps with requested dates."
            )
            raise ValueError("Existing overlapping booking exists for this user")

        booking_id = await db.fetchval(
            CREATE_BOOKING_QUERY, user_id, locker_id, start_date, end_date
        )

        booking_details = await db.fetchrow(
            GET_BOOKING_DETAILS_QUERY, locker_id, user_id
        )

        if booking_details:
            await NotificationsServiceClient().post(
                "/booking/confirmation",
                {
                    "userId": user_id,
                    "email": booking_details["email"],
                    "name": booking_details["first_name"],
                    "lockerNumber": booking_details["locker_number"],
                    "floorNumber": booking_details["floor_number"],
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                    "userBookingsPath": "/user/my-bookings",
                    "adminBookingsPath": "/admin/bookings",
                },
            )

        logger.info("Created booking")

        return booking_id
    except ValueError:
        raise
    except ExclusionViolationError:
        logger.warning("Booking conflict")
        raise ValueError("Booking conflict")
    except Exception:
        logger.error("Error creating booking")
        raise
