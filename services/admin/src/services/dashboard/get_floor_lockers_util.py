"""Get the locker utilisation for each floor."""

from typing import List

from src.logger import logger
from src.connectors.db import db
from src.models.responses import FloorUtilizationResponse

GET_FLOOR_LOCKERS_UTIL_QUERY = """
SELECT 
    f.floor_id,
    f.floor_number,
    COUNT(l.locker_id) as total_lockers,
    COUNT(l.locker_id) FILTER (WHERE l.status = 'available') as available,
    COUNT(l.locker_id) FILTER (WHERE l.status = 'occupied') as occupied,
    COUNT(l.locker_id) FILTER (WHERE l.status = 'maintenance') as maintenance,
    COALESCE(
        ROUND(
            (COUNT(l.locker_id) FILTER (WHERE l.status = 'occupied')::DECIMAL / 
            NULLIF(COUNT(l.locker_id), 0)), 
            2
        ),
        0.0
    ) as utilization_rate
FROM lockerhub.floors f
LEFT JOIN lockerhub.lockers l ON f.floor_id = l.floor_id
GROUP BY f.floor_id, f.floor_number
ORDER BY 
    (REGEXP_REPLACE(f.floor_number, '[^0-9].*', ''))::INTEGER,
    f.floor_number;
"""


async def get_floor_lockers_util() -> List[FloorUtilizationResponse]:
    """Get the locker utilisation for each floor.

    Returns:
        A list of FloorUtilizationResponse objects with floor utilization stats.
    """
    try:
        result = await db.fetch(GET_FLOOR_LOCKERS_UTIL_QUERY)
        logger.info("Retrieved locker utilization for floors")
        return [FloorUtilizationResponse(**dict(row)) for row in result]
    except Exception:
        logger.error("Error fetching floor locker utilization")
        raise
