"""Review a special request."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.services.bookings.create_booking import create_booking

GET_REQUEST_AND_AVAILABLE_LOCKER_QUERY = """
WITH request_details AS (
    SELECT 
        r.user_id, 
        r.floor_id, 
        r.start_date, 
        r.end_date,
        u.email,
        u.first_name,
        f.floor_number
    FROM lockerhub.requests r
    JOIN lockerhub.users u ON u.user_id = r.user_id
    JOIN lockerhub.floors f ON f.floor_id = r.floor_id
    WHERE r.request_id = $1
),
available_locker AS (
    SELECT l.locker_id, l.locker_number
    FROM lockerhub.lockers l
    CROSS JOIN request_details rd
    WHERE l.floor_id = rd.floor_id
    AND l.status = 'available'::lockerhub.locker_status
    AND NOT EXISTS (
        SELECT 1 FROM lockerhub.bookings b
        WHERE b.locker_id = l.locker_id
        AND b.status NOT IN ('cancelled'::lockerhub.booking_status, 'completed'::lockerhub.booking_status)
        AND daterange(b.start_date, COALESCE(b.end_date, 'infinity'::date), '[]') 
            && daterange(rd.start_date, COALESCE(rd.end_date, 'infinity'::date), '[]')
    )
    ORDER BY l.locker_number
    LIMIT 1
)
SELECT 
    rd.user_id,
    rd.floor_id,
    rd.start_date,
    rd.end_date,
    rd.email,
    rd.first_name,
    rd.floor_number,
    al.locker_id,
    al.locker_number
FROM request_details rd
LEFT JOIN available_locker al ON true
"""

REVIEW_SPECIAL_REQUEST_QUERY = """
UPDATE lockerhub.requests
SET status = $1::lockerhub.request_status, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, reason = $3
WHERE request_id = $4
RETURNING request_id, user_id
"""


async def review_special_request(status, reviewed_by, request_id, reason=None):
    """Approve or reject a special request.

    When approving, automatically creates a booking with an available locker on the requested floor.
    Sends appropriate notifications for both approval and rejection.

    Returns:
        A dictionary containing the request ID and user ID of the reviewed request.

    Raises:
        ValueError: If approving and no available locker is found on the floor.
    """
    try:
        request_data = await db.fetchrow(
            GET_REQUEST_AND_AVAILABLE_LOCKER_QUERY, request_id
        )

        if not request_data:
            raise ValueError("Request not found")

        notification_client = NotificationsServiceClient()
        base_data = {
            "userId": str(request_data["user_id"]),
            "email": request_data["email"],
            "name": request_data["first_name"],
            "floorNumber": request_data["floor_number"],
        }

        if status == "approved":
            if not request_data["locker_id"]:
                raise ValueError("No available lockers found on the requested floor")

            await notification_client.post(
                "/special-request/approved",
                {
                    **base_data,
                    "lockerNumber": request_data["locker_number"],
                    "endDate": (
                        request_data["end_date"].isoformat()
                        if request_data["end_date"]
                        else None
                    ),
                    "requestId": request_id,
                    "userSpecialRequestsPath": "/user/special-requests",
                    "createdBy": reviewed_by,
                },
            )

            await create_booking(
                user_id=str(request_data["user_id"]),
                locker_id=str(request_data["locker_id"]),
                start_date=request_data["start_date"],
                end_date=request_data["end_date"],
                admin_id=reviewed_by,
                special_request_id=request_id,
            )

            logger.info("Created booking for approved special request")
        else:
            await notification_client.post(
                "/special-request/rejected",
                {
                    **base_data,
                    "endDate": (
                        request_data["end_date"].isoformat()
                        if request_data["end_date"]
                        else None
                    ),
                    "requestId": request_id,
                    "reason": reason,
                    "userSpecialRequestsPath": "/user/special-requests",
                    "createdBy": reviewed_by,
                },
            )

            logger.info("Sent rejection notification for special request")

        result = await db.fetch(
            REVIEW_SPECIAL_REQUEST_QUERY, status, reviewed_by, reason, request_id
        )
        logger.info("Reviewed special request")
        return result
    except ValueError:
        raise
    except Exception:
        logger.error("Error reviewing special request")
        raise
