"""Get all lockers."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerResponse, AllLockersResponse

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
ORDER BY 
    CAST(REGEXP_REPLACE(f.floor_number, '[^0-9]', '', 'g') AS INTEGER),
    f.floor_number,
    l.locker_number;
"""


async def get_all_lockers() -> AllLockersResponse:
    """Get all lockers.

    Returns:
        AllLockersResponse with a list of LockerResponse objects.
    """
    try:
        result = await db.fetch(GET_ALL_LOCKERS_QUERY)
        logger.info("Retrieved all lockers successfully")
        return AllLockersResponse(
            lockers=[LockerResponse(**dict(row)) for row in result]
        )
    except Exception:
        logger.error("Error fetching all lockers")
        raise
