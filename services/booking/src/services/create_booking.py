"""Create a new booking for a locker."""

from datetime import date
from asyncpg.exceptions import ExclusionViolationError

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import CreateBookingResponse
from src.scheduled_jobs.jobs.update_booking_statuses import update_booking_statuses

CREATE_BOOKING_WITH_OVERLAP_CHECK_QUERY = """
WITH overlap_check AS (
    SELECT EXISTS (
        SELECT 1
        FROM lockerhub.bookings
        WHERE user_id = $1
        AND status IN ('upcoming'::lockerhub.booking_status, 'active'::lockerhub.booking_status)
        AND daterange($3, $4, '[]') && daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]')
    ) AS has_overlap
),
new_booking AS (
    INSERT INTO lockerhub.bookings (user_id, locker_id, start_date, end_date)
    SELECT $1, $2, $3, $4
    FROM overlap_check
    WHERE NOT has_overlap
    RETURNING booking_id, user_id, locker_id
)
SELECT 
    nb.booking_id,
    oc.has_overlap,
    u.email,
    u.first_name,
    l.locker_number,
    f.floor_number
FROM overlap_check oc
LEFT JOIN new_booking nb ON true
LEFT JOIN lockerhub.users u ON u.user_id = nb.user_id
LEFT JOIN lockerhub.lockers l ON l.locker_id = nb.locker_id
LEFT JOIN lockerhub.floors f ON f.floor_id = l.floor_id
"""


async def create_booking(
    user_id: str, locker_id: str, start_date: date, end_date: date
) -> CreateBookingResponse:
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
        CreateBookingResponse with the booking ID

    Raises:
        ValueError: If user already has an overlapping booking, or if there's a locker conflict
    """
    try:
        result = await db.fetchrow(
            CREATE_BOOKING_WITH_OVERLAP_CHECK_QUERY,
            user_id,
            locker_id,
            start_date,
            end_date,
        )

        if not result:
            logger.error("Failed to create booking - no result returned")
            raise ValueError("Failed to create booking")

        if result["has_overlap"]:
            logger.warning(
                "User already has an existing booking that overlaps with requested dates."
            )
            raise ValueError("Existing overlapping booking exists for this user")

        if not result["booking_id"]:
            logger.error("Failed to create booking - no booking_id returned")
            raise ValueError("Failed to create booking")

        booking_id = result["booking_id"]

        await NotificationsServiceClient().post(
            "/booking/confirmation",
            {
                "userId": user_id,
                "email": result["email"],
                "name": result["first_name"],
                "lockerNumber": result["locker_number"],
                "floorNumber": result["floor_number"],
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "userBookingsPath": "/user/my-bookings",
                "adminBookingsPath": "/admin/bookings",
            },
        )

        logger.info("Created booking")

        if start_date == date.today():
            logger.info("Booking starts today, triggering update_booking_statuses")
            try:
                await update_booking_statuses()
            except Exception:
                logger.warning("Failed to update booking statuses after creation")

        return CreateBookingResponse(booking_id=booking_id)
    except ValueError:
        raise
    except ExclusionViolationError:
        logger.warning("Booking conflict")
        raise ValueError("Booking conflict")
    except Exception:
        logger.error("Error creating booking")
        raise
