"""Join a floor queue (waitlist) for a floor."""

from datetime import date
from uuid import UUID

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import JoinFloorQueueResponse

GET_USER_DETAILS_QUERY = """
SELECT 
    u.email,
    u.first_name,
    f.floor_number
FROM lockerhub.users u
CROSS JOIN lockerhub.floors f
WHERE u.user_id = $1 AND f.floor_id = $2
"""

CHECK_EXISTING_QUEUE_ENTRY_QUERY = """
SELECT fq.floor_queue_id
FROM lockerhub.floor_queues fq
JOIN lockerhub.requests r ON fq.request_id = r.request_id
WHERE r.user_id = $1 
AND fq.floor_id = $2
AND r.status = 'queued'
AND (
    -- Check if date ranges overlap
    daterange($3, $4, '[]') && daterange(r.start_date, r.end_date, '[]')
)
LIMIT 1
"""

CREATE_QUEUE_REQUEST_QUERY = """
INSERT INTO lockerhub.requests (
    user_id,
    floor_id,
    start_date,
    end_date,
    request_type,
    status
)
VALUES ($1, $2, $3, $4, 'normal', 'queued')
RETURNING request_id
"""

ADD_TO_FLOOR_QUEUE_QUERY = """
INSERT INTO lockerhub.floor_queues (
    floor_id,
    request_id
)
VALUES ($1, $2)
RETURNING floor_queue_id
"""


async def join_floor_queue(
    user_id: str, floor_id: str, start_date: date, end_date: date
) -> JoinFloorQueueResponse:
    """
    Add a user to a floor queue (waitlist).

    Creates a request and adds an entry to the floor_queues table.

    Args:
        user_id: ID of the user joining the queue
        floor_id: ID of the floor to join the queue for
        start_date: Desired start date
        end_date: Desired end date

    Returns:
        JoinFloorQueueResponse with the floor queue ID and request ID

    Raises:
        ValueError: If user is already in the queue for overlapping dates
    """
    try:
        floor_uuid = UUID(floor_id) if isinstance(floor_id, str) else floor_id

        existing_entry = await db.fetchrow(
            CHECK_EXISTING_QUEUE_ENTRY_QUERY,
            user_id,
            floor_uuid,
            start_date,
            end_date,
        )

        if existing_entry:
            logger.warning(
                "User already in floor queue for this floor and overlapping dates"
            )
            raise ValueError(
                "User is already on the waiting list for this floor and dates"
            )

        async with db.transaction() as connection:
            request_id = await connection.fetchval(
                CREATE_QUEUE_REQUEST_QUERY,
                user_id,
                floor_uuid,
                start_date,
                end_date,
            )

            floor_queue_id = await connection.fetchval(
                ADD_TO_FLOOR_QUEUE_QUERY, floor_uuid, request_id
            )

            user_details = await connection.fetchrow(
                GET_USER_DETAILS_QUERY, user_id, floor_uuid
            )

            if user_details:
                await NotificationsServiceClient().post(
                    "/waitlist/joined",
                    {
                        "userId": user_id,
                        "email": user_details["email"],
                        "name": user_details["first_name"],
                        "floorNumber": user_details["floor_number"],
                        "startDate": start_date.isoformat(),
                        "endDate": end_date.isoformat(),
                    },
                )

            logger.info("User added to floor queue")

            return JoinFloorQueueResponse(
                floor_queue_id=floor_queue_id,
                request_id=request_id,
                floor_number=user_details["floor_number"] if user_details else "",
            )
    except Exception:
        logger.error("Error adding user to floor queue")
        raise
