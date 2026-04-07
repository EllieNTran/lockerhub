"""Get user's floor queue entries (waitlists)."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import UserQueueResponse, UserQueuesListResponse

GET_USER_QUEUES_QUERY = """
SELECT 
    fq.floor_queue_id,
    r.request_id,
    r.start_date,
    r.end_date,
    r.created_at,
    f.floor_id,
    f.floor_number
FROM lockerhub.floor_queues fq
JOIN lockerhub.requests r ON fq.request_id = r.request_id
JOIN lockerhub.floors f ON fq.floor_id = f.floor_id
WHERE r.user_id = $1
AND r.status = 'queued'
ORDER BY r.created_at DESC
"""


async def get_user_queues(user_id: str) -> UserQueuesListResponse:
    """
    Get all floor queue entries for a user.

    Args:
        user_id: ID of the user

    Returns:
        List of user's queue entries
    """
    try:
        queues = await db.fetch(GET_USER_QUEUES_QUERY, user_id)
        return UserQueuesListResponse(
            queues=[UserQueueResponse(**dict(row)) for row in queues]
        )
    except Exception:
        logger.error("Error fetching user queues")
        raise
