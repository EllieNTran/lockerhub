"""Get the recent activity."""

from src.logger import logger
from src.connectors.db import db

GET_RECENT_ACTIVITY_QUERY = """
SELECT 
    notification_id,
    user_id,
    title,
    caption,
    created_at,
    read,
    type
FROM lockerhub.notifications
ORDER BY created_at DESC
LIMIT 7;
"""


async def get_recent_activity():
    """Get the 7 most recent activities.

    Returns:
        A list of dictionaries, each containing a notification.
    """
    try:
        result = await db.fetch(GET_RECENT_ACTIVITY_QUERY)
        logger.info(f"Retrieved {len(result)} recent activities")
        return result
    except Exception as e:
        logger.error(f"Error fetching recent activity: {e}")
        raise
