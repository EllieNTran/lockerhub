"""Get the recent activity."""

from typing import List

from src.logger import logger
from src.connectors.db import db
from src.models.responses import NotificationResponse

GET_RECENT_ACTIVITY_QUERY = """
SELECT 
    n.notification_id,
    n.entity_type,
    n.created_by AS user_id,
    CASE 
        WHEN n.created_by IS NOT NULL 
        THEN u.first_name || ' ' || u.last_name
        ELSE 'System'
    END AS user_name,
    n.admin_title,
    n.caption,
    n.type,
    n.created_at
FROM lockerhub.notifications n
LEFT JOIN lockerhub.users u ON n.created_by = u.user_id
ORDER BY n.created_at DESC
LIMIT 9
"""


async def get_recent_activity() -> List[NotificationResponse]:
    """Get the 7 most recent activities.

    Returns:
        A list of NotificationResponse objects with relative time.
    """
    try:
        result = await db.fetch(GET_RECENT_ACTIVITY_QUERY)

        activities = [
            NotificationResponse(
                notification_id=row["notification_id"],
                user_id=row["user_id"],
                user_name=row["user_name"],
                entity_type=row["entity_type"],
                title=row["admin_title"],
                caption=row["caption"],
                type=row["type"],
                created_at=row["created_at"],
            )
            for row in result
        ]

        logger.info("Retrieved recent activities")
        return activities
    except Exception:
        logger.error("Error fetching recent activity")
        raise
