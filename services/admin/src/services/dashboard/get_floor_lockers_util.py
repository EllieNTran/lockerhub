"""Get the locker utilisation for each floor."""

from src.logger import logger
from src.connectors.db import db

GET_FLOOR_LOCKERS_UTIL_QUERY = """
SELECT 
    f.number as floor_number,
    COUNT(l.locker_id) as total_lockers,
    COUNT(l.locker_id) FILTER (WHERE l.status = 'available') as available_lockers,
    ROUND(
        (COUNT(l.locker_id) FILTER (WHERE l.status = 'available')::DECIMAL / 
        NULLIF(COUNT(l.locker_id), 0) * 100), 
        2
    ) as availability_percentage
FROM lockerhub.floors f
LEFT JOIN lockerhub.lockers l ON f.floor_id = l.floor_id
GROUP BY f.floor_id, f.number
ORDER BY f.number;
"""


async def get_floor_lockers_util():
    """Get the locker utilisation for each floor.

    Returns:
        A list of dictionaries with floor utilization stats including:
        - floor_number, total_lockers, available_lockers, availability_percentage
    """
    try:
        result = await db.fetch(GET_FLOOR_LOCKERS_UTIL_QUERY)
        logger.info(f"Retrieved locker utilization for {len(result)} floors")
        return result
    except Exception as e:
        logger.error(f"Error fetching floor locker utilization: {e}")
        raise
