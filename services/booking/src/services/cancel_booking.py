"""Cancel an existing booking by updating its status."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import UpdateBookingResponse

GET_BOOKING_QUERY = """
SELECT
    b.user_id, 
    b.status,
    b.locker_id,
    b.special_request_id,
    u.email, 
    u.first_name, 
    l.locker_number, 
    f.floor_number, 
    b.start_date, 
    b.end_date,
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
RETURNING booking_id
"""

CANCEL_SPECIAL_REQUEST_QUERY = """
UPDATE lockerhub.requests
SET status = 'cancelled'
WHERE request_id = $1
"""

RESET_KEY_QUERY = """
UPDATE lockerhub.keys
SET status = 'available', updated_at = CURRENT_TIMESTAMP
WHERE locker_id = $1 AND status = 'awaiting_handover'
"""

RESET_LOCKER_QUERY = """
UPDATE lockerhub.lockers
SET status = 'available', updated_at = CURRENT_TIMESTAMP
WHERE locker_id = $1 AND status = 'reserved'
"""


async def cancel_booking(user_id: str, booking_id: str) -> UpdateBookingResponse:
    """
    Cancel an existing booking by updating its status to 'cancelled'.

    Args:
        user_id: ID of the user requesting the cancellation (for authorization)
        booking_id: ID of the booking to cancel

    Returns:
        UpdateBookingResponse with the cancelled booking ID
    """
    try:
        async with db.transaction() as connection:
            booking = await connection.fetchrow(GET_BOOKING_QUERY, booking_id)

            if not booking:
                logger.warning("Booking not found for cancellation")
                raise ValueError("Booking not found")

            if str(booking["user_id"]) != user_id:
                logger.warning("User attempted to cancel booking not owned by them")
                raise ValueError("Unauthorized")

            if booking["status"] == "cancelled":
                logger.warning("Booking is already cancelled")
                raise ValueError("Booking is already cancelled")

            cancelled_id = await connection.fetchval(CANCEL_BOOKING_QUERY, booking_id)

            if booking["special_request_id"]:
                await connection.execute(
                    CANCEL_SPECIAL_REQUEST_QUERY, booking["special_request_id"]
                )
                logger.info(
                    f"Cancelled special request {booking['special_request_id']} associated with booking"
                )

            if booking["key_status"] == "awaiting_handover":
                await connection.execute(RESET_KEY_QUERY, booking["locker_id"])
                logger.info("Reset key to available after user cancellation")

            locker_result = await connection.execute(
                RESET_LOCKER_QUERY, booking["locker_id"]
            )
            if locker_result:
                logger.info("Reset locker to available after user cancellation")

            await NotificationsServiceClient().post(
                "/booking/cancellation",
                {
                    "userId": user_id,
                    "email": booking["email"],
                    "name": booking["first_name"],
                    "lockerNumber": booking["locker_number"],
                    "floorNumber": booking["floor_number"],
                    "startDate": booking["start_date"].isoformat(),
                    "endDate": booking["end_date"].isoformat(),
                    "keyStatus": booking["key_status"] or "N/A",
                    "keyNumber": booking["key_number"] or "N/A",
                    "adminBookingsPath": "/admin/bookings",
                },
            )
            logger.info("Cancelled booking")

            return UpdateBookingResponse(booking_id=cancelled_id)
    except ValueError:
        raise
    except Exception:
        logger.error("Error cancelling booking")
        raise
