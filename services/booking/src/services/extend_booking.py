"""Extend an existing booking."""

from datetime import timedelta, date
from uuid import UUID

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import ExtendBookingResponse

EXTEND_BOOKING_WITH_AVAILABILITY_CHECK_QUERY = """
WITH booking_info AS (
    SELECT 
        b.booking_id,
        b.user_id,
        b.locker_id,
        b.start_date,
        b.end_date,
        b.status,
        b.special_request_id,
        u.email,
        u.first_name,
        l.locker_number,
        f.floor_number
    FROM lockerhub.bookings b
    JOIN lockerhub.users u ON b.user_id = u.user_id
    JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    JOIN lockerhub.floors f ON l.floor_id = f.floor_id
    WHERE b.booking_id = $1
    AND b.user_id = $2
),
availability_check AS (
    SELECT 
        NOT EXISTS (
            SELECT 1 FROM lockerhub.bookings
            WHERE locker_id = (SELECT locker_id FROM booking_info)
            AND booking_id != $1
            AND daterange($3, $4, '[]') && daterange(start_date, end_date, '[]')
        ) AS is_locker_available,
        NOT EXISTS (
            SELECT 1 FROM lockerhub.bookings
            WHERE user_id = (SELECT user_id FROM booking_info)
            AND booking_id != $1
            AND status IN ('active', 'upcoming')
            AND daterange($3, $4, '[]') && daterange(start_date, end_date, '[]')
        ) AS is_user_available
),
extension_request AS (
    INSERT INTO lockerhub.requests (
        user_id,
        booking_id,
        start_date,
        end_date,
        request_type,
        status
    )
    SELECT 
        bi.user_id,
        bi.booking_id,
        $3,
        $4,
        'extension'::lockerhub.request_type,
        CASE 
            WHEN ac.is_locker_available AND ac.is_user_available THEN 'approved'::lockerhub.request_status
            ELSE 'rejected'::lockerhub.request_status
        END
    FROM booking_info bi
    CROSS JOIN availability_check ac
    RETURNING request_id, status
),
updated_booking AS (
    UPDATE lockerhub.bookings 
    SET end_date = $4, 
        extension_request_id = (SELECT request_id FROM extension_request),
        updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = $1
    AND (SELECT status FROM extension_request) = 'approved'
    RETURNING booking_id
)
SELECT 
    bi.booking_id,
    bi.user_id,
    bi.locker_id,
    bi.start_date,
    bi.end_date,
    bi.status,
    bi.special_request_id,
    bi.email,
    bi.first_name,
    bi.locker_number,
    bi.floor_number,
    er.request_id,
    er.status AS request_status,
    ac.is_locker_available,
    ac.is_user_available,
    ub.booking_id AS was_extended
FROM booking_info bi
CROSS JOIN availability_check ac
CROSS JOIN extension_request er
LEFT JOIN updated_booking ub ON true
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
        booking_uuid = UUID(booking_id) if isinstance(booking_id, str) else booking_id

        current_booking = await db.fetchrow(
            "SELECT end_date FROM lockerhub.bookings WHERE booking_id = $1 AND user_id = $2",
            booking_uuid,
            UUID(user_id) if isinstance(user_id, str) else user_id,
        )

        if not current_booking:
            logger.warning("Booking not found or unauthorized")
            raise ValueError("Booking not found or unauthorized")

        current_end_date = current_booking["end_date"]
        if new_end_date_obj <= current_end_date:
            raise ValueError("New end date must be after current end date")

        result = await db.fetchrow(
            EXTEND_BOOKING_WITH_AVAILABILITY_CHECK_QUERY,
            booking_uuid,
            UUID(user_id) if isinstance(user_id, str) else user_id,
            current_end_date + timedelta(days=1),
            new_end_date_obj,
        )

        if not result:
            logger.error("Failed to process extension request")
            raise ValueError("Failed to process extension request")

        request_id = result["request_id"]
        status = result["request_status"]

        if status == "rejected":
            if not result["is_locker_available"]:
                logger.info(
                    "Extension request rejected: locker is not available during the extended period"
                )
                raise ValueError(
                    "This locker is already booked during the requested extension period. Please try a different end date."
                )
            elif not result["is_user_available"]:
                logger.info(
                    "Extension request rejected: user has overlapping bookings during the extended period"
                )
                raise ValueError(
                    "You have another active booking that overlaps with this extension period. Please cancel or modify your other booking first."
                )
            else:
                logger.info("Extension request rejected")
                raise ValueError(
                    "Extension request was rejected. Please contact support for assistance."
                )

        logger.info("Extension request approved and booking extended")

        await NotificationsServiceClient().post(
            "/booking/extension",
            {
                "userId": user_id,
                "email": result["email"],
                "name": result["first_name"],
                "lockerNumber": result["locker_number"],
                "floorNumber": result["floor_number"],
                "originalEndDate": result["end_date"].isoformat(),
                "newEndDate": new_end_date_obj.isoformat(),
                "userBookingsPath": "/user/my-bookings",
                "adminBookingsPath": "/admin/bookings",
            },
        )

        return ExtendBookingResponse(request_id=request_id, status=status)
    except ValueError:
        raise
    except Exception:
        logger.error("Error processing extension for booking")
        raise
