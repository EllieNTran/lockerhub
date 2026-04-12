"""Get all closures for a specific floor."""

from uuid import UUID
from src.logger import logger
from src.connectors.db import db
from src.models.responses import FloorClosuresResponse

GET_FLOOR_CLOSURES_QUERY = """
SELECT 
    closure_id,
    floor_id,
    start_date,
    end_date,
    reason,
    created_at,
    created_by
FROM lockerhub.floor_closures
WHERE floor_id = $1
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
ORDER BY start_date ASC
"""


async def get_floor_closures(floor_id: str) -> FloorClosuresResponse:
    """
    Get all active and upcoming closures for a specific floor.

    Args:
        floor_id: The ID of the floor

    Returns:
        A list of floor closures
    """
    try:
        floor_uuid = UUID(floor_id)
        closures = await db.fetch(GET_FLOOR_CLOSURES_QUERY, floor_uuid)
        logger.info(f"Retrieved {len(closures)} closures for floor")

        return FloorClosuresResponse(closures=[dict(closure) for closure in closures])
    except Exception:
        logger.error("Error retrieving floor closures")
        raise
