"""Join a floor queue (waitlist) for a floor."""

from datetime import date
from uuid import UUID

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import JoinFloorQueueResponse

CHECK_EXISTING_QUEUE_ENTRY_QUERY = """
SELECT fq.floor_queue_id
FROM lockerhub.floor_queues fq
JOIN lockerhub.requests r ON fq.request_id = r.request_id
WHERE r.user_id = $1 
AND fq.floor_id = $2
AND r.status = 'queued'
AND (
    daterange($3, $4, '[]') && daterange(r.start_date, r.end_date, '[]')
)
LIMIT 1
"""

CREATE_QUEUE_AND_GET_DETAILS_QUERY = """
WITH inserted_request AS (
    INSERT INTO lockerhub.requests (
        user_id,
        floor_id,
        start_date,
        end_date,
        request_type,
        status
    )
    VALUES ($1, $2, $3, $4, 'normal'::lockerhub.request_type, 'queued'::lockerhub.request_status)
    RETURNING request_id, user_id, floor_id
),
inserted_queue AS (
    INSERT INTO lockerhub.floor_queues (
        floor_id,
        request_id
    )
    SELECT floor_id, request_id
    FROM inserted_request
    RETURNING floor_queue_id, request_id
)
SELECT 
    iq.floor_queue_id,
    iq.request_id,
    u.email,
    u.first_name,
    f.floor_number
FROM inserted_queue iq
JOIN inserted_request ir ON iq.request_id = ir.request_id
JOIN lockerhub.users u ON ir.user_id = u.user_id
JOIN lockerhub.floors f ON ir.floor_id = f.floor_id
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

        result = await db.fetchrow(
            CREATE_QUEUE_AND_GET_DETAILS_QUERY,
            user_id,
            floor_uuid,
            start_date,
            end_date,
        )

        if result:
            await NotificationsServiceClient().post(
                "/waitlist/joined",
                {
                    "userId": user_id,
                    "email": result["email"],
                    "name": result["first_name"],
                    "floorNumber": result["floor_number"],
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                },
            )

        logger.info("User added to floor queue")

        return JoinFloorQueueResponse(
            floor_queue_id=result["floor_queue_id"],
            request_id=result["request_id"],
            floor_number=result["floor_number"],
        )
    except Exception:
        logger.error("Error adding user to floor queue")
        raise
