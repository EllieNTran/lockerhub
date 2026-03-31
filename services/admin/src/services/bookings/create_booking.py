"""Create a new booking for a user (admin)."""

from datetime import date
from asyncpg.exceptions import ExclusionViolationError

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import CreateBookingResponse

CREATE_BOOKING_QUERY = """
INSERT INTO lockerhub.bookings (
    user_id,
    locker_id,
    start_date,
    end_date,
    created_by,
    updated_by
)
VALUES ($1, $2, $3, $4, $5, $5)
RETURNING booking_id
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
    user_id: str, locker_id: str, start_date: date, end_date: date, admin_id: str
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
        admin_id: ID of the admin creating the booking

    Returns:
        CreateBookingResponse with the booking ID

    Raises:
        ValueError: If there's a locker booking conflict (locker already booked for this period)
    """
    try:
        booking_id = await db.fetchval(
            CREATE_BOOKING_QUERY, user_id, locker_id, start_date, end_date, admin_id
        )
        booking_details = await db.fetchrow(
            GET_BOOKING_DETAILS_QUERY, locker_id, user_id
        )

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

        logger.info("Created booking for user")
        return CreateBookingResponse(booking_id=booking_id)
    except ExclusionViolationError:
        logger.warning("Booking conflict")
        raise ValueError("Booking conflict")
    except Exception:
        logger.error("Error creating booking")
        raise
