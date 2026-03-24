"""Get all floors."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import FloorResponse, FloorsResponse

GET_FLOORS_QUERY = """
SELECT 
    f.floor_id,
    f.floor_number,
    f.status,
    f.created_at,
    f.updated_at
FROM lockerhub.floors f
WHERE f.status = 'open'
AND NOT EXISTS (
    SELECT 1 FROM lockerhub.floor_closures fc
    WHERE fc.floor_id = f.floor_id
    AND CURRENT_DATE BETWEEN fc.start_date AND fc.end_date
)
ORDER BY 
    CASE 
        WHEN f.floor_number ~ '^[0-9]+' THEN 
            SUBSTRING(f.floor_number FROM '^[0-9]+')::INTEGER
        ELSE 999
    END,
    f.floor_number
"""


async def get_floors() -> FloorsResponse:
    """
    Get all floors that are open.

    Returns:
        A list of all open floors
    """
    try:
        floors = await db.fetch(GET_FLOORS_QUERY)
        logger.info("Retrieved floors")
        return FloorsResponse(floors=[FloorResponse(**dict(floor)) for floor in floors])
    except Exception:
        logger.error("Error retrieving floors")
        raise
