"""Update floor status."""

from datetime import date
from typing import Optional
from uuid import UUID

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import UpdateFloorStatusResponse

GET_FLOOR_QUERY = """
SELECT floor_id, floor_number, status
FROM lockerhub.floors
WHERE floor_id = $1
"""

UPDATE_FLOOR_STATUS_QUERY = """
UPDATE lockerhub.floors
SET status = $1,
    updated_by = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE floor_id = $3
RETURNING floor_id, floor_number, status
"""

CREATE_FLOOR_CLOSURE_QUERY = """
INSERT INTO lockerhub.floor_closures (floor_id, start_date, end_date, reason, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING closure_id
"""

DELETE_ACTIVE_CLOSURES_QUERY = """
DELETE FROM lockerhub.floor_closures
WHERE floor_id = $1 
AND end_date >= CURRENT_DATE
"""

GET_AFFECTED_BOOKINGS_QUERY = """
SELECT b.booking_id, b.user_id, u.email, u.first_name, u.last_name, 
       l.locker_number, b.start_date, b.end_date, f.floor_number,
       k.status as key_status, k.key_number
FROM lockerhub.bookings b
JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
JOIN lockerhub.floors f ON l.floor_id = f.floor_id
JOIN lockerhub.users u ON b.user_id = u.user_id
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
WHERE l.floor_id = $1
  AND b.status IN ('upcoming', 'active')
  AND ($2::date IS NULL OR b.end_date >= $2)
  AND ($3::date IS NULL OR b.start_date <= $3)
"""

CANCEL_BOOKING_QUERY = """
UPDATE lockerhub.bookings
SET status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE booking_id = $1
"""


async def update_floor_status(
    user_id: str,
    floor_id: str,
    status: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    reason: Optional[str] = None,
) -> UpdateFloorStatusResponse:
    """Update the status of a floor (open/closed).

    Args:
        user_id: ID of the admin making the update
        floor_id: ID of the floor to update
        status: New status ('open' or 'closed')
        start_date: Optional start date for scheduled closure (only if closing)
        end_date: Optional end date for scheduled closure (only if closing)
        reason: Optional reason for the closure

    Returns:
        UpdateFloorStatusResponse with updated floor details
    """
    try:
        async with db.transaction() as connection:
            floor = await connection.fetchrow(GET_FLOOR_QUERY, UUID(floor_id))
            if not floor:
                logger.warning("Floor not found")
                raise ValueError("Floor not found")

            if status == "closed":
                if start_date:
                    actual_status = "open"

                    await connection.fetchrow(
                        CREATE_FLOOR_CLOSURE_QUERY,
                        UUID(floor_id),
                        start_date,
                        end_date,
                        reason,
                        UUID(user_id),
                    )
                    logger.info("Created scheduled floor closure")

                    affected_bookings = await connection.fetch(
                        GET_AFFECTED_BOOKINGS_QUERY,
                        UUID(floor_id),
                        start_date,
                        end_date,
                    )

                    for booking in affected_bookings:
                        await connection.execute(
                            CANCEL_BOOKING_QUERY, booking["booking_id"]
                        )

                    if affected_bookings:
                        logger.info("Cancelled bookings due to scheduled floor closure")

                    if end_date:
                        admin_title = "scheduled for closure"
                        caption = f"Closure scheduled from {start_date.strftime('%d %b %Y')} to {end_date.strftime('%d %b %Y')}"
                    else:
                        admin_title = "scheduled for indefinite closure"
                        caption = f"Indefinite closure scheduled starting {start_date.strftime('%d %b %Y')}"
                else:
                    actual_status = "closed"

                    affected_bookings = await connection.fetch(
                        GET_AFFECTED_BOOKINGS_QUERY, UUID(floor_id), None, None
                    )

                    for booking in affected_bookings:
                        await connection.execute(
                            CANCEL_BOOKING_QUERY, booking["booking_id"]
                        )

                    if affected_bookings:
                        logger.info("Cancelled bookings due to immediate floor closure")

                    admin_title = "closed indefinitely"
                    caption = "This floor is closed for bookings until further notice"

                if reason:
                    caption = f"{caption}. Reason: {reason}"

            else:
                await connection.execute(DELETE_ACTIVE_CLOSURES_QUERY, UUID(floor_id))
                logger.info("Deleted active closures for floor")
                actual_status = "open"
                admin_title = "reopened"
                caption = "This floor is now available for bookings"
                affected_bookings = []

            updated_floor = await connection.fetchrow(
                UPDATE_FLOOR_STATUS_QUERY, actual_status, UUID(user_id), UUID(floor_id)
            )

            notifications_client = NotificationsServiceClient()

            await notifications_client.post(
                "/",
                {
                    "title": f"Floor {updated_floor['floor_number']} Status Updated",
                    "adminTitle": f"Floor {updated_floor['floor_number']} {admin_title}",
                    "caption": caption,
                    "type": "info",
                    "entityType": "floor",
                    "scope": "floor",
                    "floorId": str(updated_floor["floor_id"]),
                    "createdBy": str(user_id),
                },
            )

            if affected_bookings:
                for booking in affected_bookings:
                    await notifications_client.post(
                        "/booking/cancellation",
                        {
                            "userId": str(booking["user_id"]),
                            "email": booking["email"],
                            "name": f"{booking['first_name']} {booking['last_name']}",
                            "lockerNumber": booking["locker_number"],
                            "floorNumber": booking["floor_number"],
                            "startDate": booking["start_date"].isoformat(),
                            "endDate": booking["end_date"].isoformat(),
                            "keyStatus": booking["key_status"] or "N/A",
                            "keyNumber": booking["key_number"] or "N/A",
                            "adminBookingsPath": "/admin/bookings",
                        },
                    )

            logger.info("Updated floor status")

            return UpdateFloorStatusResponse(
                floor_id=str(updated_floor["floor_id"]),
                floor_number=updated_floor["floor_number"],
                status=updated_floor["status"],
            )

    except ValueError:
        raise
    except Exception:
        logger.error("Error updating floor status")
        raise
