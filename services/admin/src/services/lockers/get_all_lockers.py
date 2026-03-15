"""Get all lockers."""

from src.logger import logger
from src.connectors.db import db

GET_ALL_LOCKERS_QUERY = """
SELECT 
    l.locker_id,
    l.locker_number,
    l.floor_id,
    l.location,
    f.floor_number,
    l.status as locker_status,
    l.x_coordinate,
    l.y_coordinate,
    k.key_number,
    k.status as key_status,
    l.created_at,
    l.updated_at
FROM lockerhub.lockers l
INNER JOIN lockerhub.floors f ON l.floor_id = f.floor_id
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
ORDER BY l.locker_number;
"""


async def get_all_lockers():
    """Get all lockers.

    Returns:
        A list of dictionaries, each representing a locker.
    """
    try:
        result = await db.fetch(GET_ALL_LOCKERS_QUERY)
        logger.info("Retrieved all lockers successfully")
        return result
    except Exception as e:
        logger.error(f"Error fetching all lockers: {e}")
        raise
