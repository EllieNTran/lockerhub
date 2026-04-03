"""Review a special request."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.services.bookings.create_booking import create_booking

GET_REQUEST_DETAILS_QUERY = """
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
"""

FIND_AVAILABLE_LOCKER_QUERY = """
SELECT l.locker_id, l.locker_number
FROM lockerhub.lockers l
WHERE l.floor_id = $1
AND l.status = 'available'
AND NOT EXISTS (
    SELECT 1 FROM lockerhub.bookings b
    WHERE b.locker_id = l.locker_id
    AND b.status NOT IN ('cancelled', 'completed')
    AND daterange(b.start_date, COALESCE(b.end_date, 'infinity'::date), '[]') 
        && daterange($2, COALESCE($3, 'infinity'::date), '[]')
)
ORDER BY l.locker_number
LIMIT 1
"""

REVIEW_SPECIAL_REQUEST_QUERY = """
UPDATE lockerhub.requests
SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, reason = $3
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
        request = await db.fetchrow(GET_REQUEST_DETAILS_QUERY, request_id)
        if not request:
            raise ValueError("Request not found")

        notification_client = NotificationsServiceClient()
        base_data = {
            "userId": str(request["user_id"]),
            "email": request["email"],
            "name": request["first_name"],
            "floorNumber": request["floor_number"],
        }

        if status == "approved":
            locker = await db.fetchrow(
                FIND_AVAILABLE_LOCKER_QUERY,
                request["floor_id"],
                request["start_date"],
                request["end_date"],
            )

            if not locker:
                raise ValueError("No available lockers found on the requested floor")

            await notification_client.post(
                "/special-request/approved",
                {
                    **base_data,
                    "lockerNumber": locker["locker_number"],
                    "endDate": (
                        request["end_date"].isoformat() if request["end_date"] else None
                    ),
                    "requestId": request_id,
                    "userSpecialRequestsPath": "/user/special-requests",
                    "createdBy": reviewed_by,
                },
            )

            await create_booking(
                user_id=str(request["user_id"]),
                locker_id=str(locker["locker_id"]),
                start_date=request["start_date"],
                end_date=request["end_date"],
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
                        request["end_date"].isoformat() if request["end_date"] else None
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
    except Exception as e:
        logger.error(f"Error reviewing special request: {str(e)}")
        raise
