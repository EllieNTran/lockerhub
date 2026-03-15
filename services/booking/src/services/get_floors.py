"""Get all floors."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import FloorResponse

GET_FLOORS_QUERY = """
SELECT 
    floor_id,
    floor_number,
    status,
    created_at,
    updated_at
FROM lockerhub.floors
WHERE status = 'open'
ORDER BY 
    CASE 
        WHEN floor_number ~ '^[0-9]+' THEN 
            SUBSTRING(floor_number FROM '^[0-9]+')::INTEGER
        ELSE 999
    END,
    floor_number
"""


async def get_floors() -> list[FloorResponse]:
    """
    Get all floors that are open.

    Returns:
        A list of all open floors
    """
    try:
        floors = await db.fetch(GET_FLOORS_QUERY)
        logger.info("Retrieved floors")
        return [FloorResponse(**dict(floor)) for floor in floors]
    except Exception:
        logger.error("Error retrieving floors")
        raise
