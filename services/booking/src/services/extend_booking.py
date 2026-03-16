"""Extend an existing booking."""

from datetime import timedelta, date
from uuid import UUID

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.services.check_locker_availability import check_locker_availability
from src.models.responses import ExtendBookingResponse

GET_BOOKING_QUERY = """
SELECT 
    b.booking_id,
    b.user_id,
    b.locker_id,
    b.start_date,
    b.end_date,
    b.status,
    b.special_request_id,
    b.created_at,
    b.updated_at,
    u.email,
    u.first_name,
    l.locker_number,
    f.floor_number
FROM lockerhub.bookings b
JOIN lockerhub.users u ON b.user_id = u.user_id
JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
JOIN lockerhub.floors f ON l.floor_id = f.floor_id
WHERE b.booking_id = $1
"""

CREATE_EXTENSION_REQUEST_QUERY = """
INSERT INTO lockerhub.requests (
    user_id,
    booking_id,
    start_date,
    end_date,
    request_type,
    status
)
VALUES ($1, $2, $3, $4, 'extension', $5)
RETURNING request_id
"""

EXTEND_BOOKING_QUERY = """
UPDATE lockerhub.bookings 
SET end_date = $1, special_request_id = $2
WHERE booking_id = $3
"""


async def extend_booking(
    booking_id: str,
    new_end_date: str,
    user_id: str,
) -> ExtendBookingResponse:
    """
    Extend an existing booking if availability allows.

    Args:
        booking_id: ID of the booking to extend
        new_end_date: Proposed new end date for the booking
        user_id: ID of the user requesting the extension (for authorization)

    Returns:
        The extension request details with status
    """
    try:
        new_end_date_obj = date.fromisoformat(new_end_date)

        async with db.transaction() as connection:
            booking = await connection.fetchrow(
                GET_BOOKING_QUERY,
                UUID(booking_id) if isinstance(booking_id, str) else booking_id,
            )

            if not booking:
                raise ValueError("Booking not found")

            if str(booking["user_id"]) != user_id:
                logger.warning("User attempted to extend booking not owned by them")
                raise ValueError("Unauthorized")

            current_end_date = booking["end_date"]
            if new_end_date_obj <= current_end_date:
                raise ValueError("New end date must be after current end date")

            extension_start = current_end_date + timedelta(days=1)

            is_available = await check_locker_availability(
                str(booking["locker_id"]), str(extension_start), str(new_end_date_obj)
            )

            status = "approved" if is_available else "rejected"

            if status == "rejected":
                logger.info(
                    "Extension request for booking conflicts with existing bookings"
                )
            else:
                logger.info("Extension request for booking approved")

            request_id = await connection.fetchval(
                CREATE_EXTENSION_REQUEST_QUERY,
                booking["user_id"],
                UUID(booking_id) if isinstance(booking_id, str) else booking_id,
                booking["start_date"],
                new_end_date_obj,
                status,
            )

            if status == "approved":
                await connection.execute(
                    EXTEND_BOOKING_QUERY,
                    new_end_date_obj,
                    request_id,
                    UUID(booking_id) if isinstance(booking_id, str) else booking_id,
                )

                await NotificationsServiceClient().post(
                    "/booking/extension",
                    {
                        "userId": user_id,
                        "email": booking["email"],
                        "name": booking["first_name"],
                        "lockerNumber": booking["locker_number"],
                        "floorNumber": booking["floor_number"],
                        "originalEndDate": booking["end_date"].isoformat(),
                        "newEndDate": new_end_date_obj.isoformat(),
                        "userBookingsPath": "/user/my-bookings",
                        "adminBookingsPath": "/admin/bookings",
                    },
                )
                logger.info("Extended booking to new end date for request")

            return ExtendBookingResponse(request_id=request_id, status=status)
    except Exception:
        logger.error("Error processing extension for booking")
        raise
