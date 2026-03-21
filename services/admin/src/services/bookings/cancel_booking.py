"""Cancel a booking."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import CancelBookingResponse

GET_BOOKING_DETAILS_QUERY = """
SELECT
    b.booking_id,
    b.user_id, 
    b.status,
    b.locker_id,
    u.email, 
    u.first_name, 
    l.locker_number, 
    l.status as locker_status,
    f.floor_number, 
    b.start_date, 
    b.end_date,
    k.key_id,
    k.status as key_status,
    k.key_number
FROM lockerhub.bookings b
JOIN lockerhub.users u ON b.user_id = u.user_id
JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
JOIN lockerhub.floors f ON l.floor_id = f.floor_id
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
WHERE b.booking_id = $1
"""

CANCEL_BOOKING_QUERY = """
UPDATE lockerhub.bookings
SET status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE booking_id = $1
RETURNING booking_id, status
"""

RESET_KEY_QUERY = """
UPDATE lockerhub.keys
SET status = 'available', updated_at = CURRENT_TIMESTAMP
WHERE key_id = $1 AND status = 'awaiting_handover'
"""

RESET_LOCKER_QUERY = """
UPDATE lockerhub.lockers
SET status = 'available', updated_at = CURRENT_TIMESTAMP
WHERE locker_id = $1 AND status = 'reserved'
"""


async def cancel_booking(booking_id: str) -> CancelBookingResponse:
    """Cancel a booking by setting its status to 'cancelled'.

    If the booking has a key in 'awaiting_handover' status, reset it to 'available'.
    If the locker is 'reserved', reset it to 'available'.

    Args:
        booking_id: ID of the booking to cancel

    Returns:
        The cancelled booking response
    """
    try:
        async with db.transaction() as connection:
            booking_details = await connection.fetchrow(
                GET_BOOKING_DETAILS_QUERY, booking_id
            )
            if not booking_details:
                logger.warning("Booking not found for cancellation")
                raise ValueError("Booking not found")

            result = await connection.fetchrow(CANCEL_BOOKING_QUERY, booking_id)

            if (
                booking_details["key_id"]
                and booking_details["key_status"] == "awaiting_handover"
            ):
                await connection.execute(RESET_KEY_QUERY, booking_details["key_id"])
                logger.info("Reset key to available after cancellation")

            if booking_details["locker_status"] == "reserved":
                await connection.execute(
                    RESET_LOCKER_QUERY, booking_details["locker_id"]
                )
                logger.info("Reset locker to available after cancellation")

            await NotificationsServiceClient().post(
                "/booking/cancellation",
                {
                    "userId": str(booking_details["user_id"]),
                    "email": booking_details["email"],
                    "name": booking_details["first_name"],
                    "lockerNumber": booking_details["locker_number"],
                    "floorNumber": booking_details["floor_number"],
                    "startDate": booking_details["start_date"].isoformat(),
                    "endDate": booking_details["end_date"].isoformat(),
                    "keyStatus": (
                        booking_details["key_status"]
                        if booking_details["key_status"]
                        else "N/A"
                    ),
                    "keyNumber": (
                        booking_details["key_number"]
                        if booking_details["key_number"]
                        else "N/A"
                    ),
                    "adminBookingsPath": "/admin/bookings",
                },
            )

            logger.info("Cancelled booking successfully")

            return CancelBookingResponse(booking_id=result["booking_id"])
    except Exception:
        logger.error("Error cancelling booking")
        raise
