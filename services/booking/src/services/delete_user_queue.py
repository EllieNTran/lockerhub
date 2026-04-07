"""Delete a user's queue entry."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import DeleteUserQueueResponse

DELETE_QUEUE_AND_GET_DETAILS_QUERY = """
WITH deleted_queue AS (
    DELETE FROM lockerhub.floor_queues
    WHERE floor_queue_id = $1 AND request_id IN (
        SELECT request_id FROM lockerhub.requests WHERE user_id = $2
    )
    RETURNING floor_queue_id, request_id, floor_id
)
SELECT 
    dq.floor_queue_id,
    r.start_date,
    r.end_date,
    f.floor_number,
    u.first_name
FROM deleted_queue dq
JOIN lockerhub.requests r ON dq.request_id = r.request_id
JOIN lockerhub.floors f ON dq.floor_id = f.floor_id
JOIN lockerhub.users u ON r.user_id = u.user_id
"""


async def delete_user_queue(user_id: str, floor_queue_id: int):
    """
    Delete a user's queue entry.

    Args:
        user_id: The user's ID
        floor_queue_id: The floor queue entry ID to delete

    Returns:
        DeleteUserQueueResponse with success message and floor_queue_id

    Raises:
        ValueError: If queue entry not found or doesn't belong to user
    """
    result = await db.fetchrow(
        DELETE_QUEUE_AND_GET_DETAILS_QUERY, floor_queue_id, user_id
    )

    if not result:
        logger.error("Queue entry not found or access denied")
        raise ValueError("Queue entry not found or access denied")

    await NotificationsServiceClient().post(
        "/",
        {
            "title": "Left Waiting List",
            "adminTitle": f"{result['first_name']} left the waiting list for Floor {result['floor_number']}",
            "caption": f"You have left the waiting list for Floor {result['floor_number']} from {result['start_date']} to {result['end_date']}.",
            "type": "info",
            "entityType": "waiting_list",
            "scope": "user",
            "userIds": [user_id],
        },
    )

    logger.info("Deleted queue entry")

    return DeleteUserQueueResponse(
        message="Queue entry removed successfully",
        floor_queue_id=result["floor_queue_id"],
    )
