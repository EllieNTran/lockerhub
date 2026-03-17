"""Update floor status."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import UpdateFloorStatusResponse

GET_FLOOR_QUERY = """
SELECT floor_id, number, status
FROM lockerhub.floors
WHERE floor_id = $1
"""

UPDATE_FLOOR_STATUS_QUERY = """
UPDATE lockerhub.floors
SET status = $1,
    updated_by = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE floor_id = $3
RETURNING floor_id, number, status
"""


async def update_floor_status(
    floor_id: str, status: str, user_id: str
) -> UpdateFloorStatusResponse:
    """Update the status of a floor (open/closed).

    Args:
        floor_id: ID of the floor to update
        status: New status ('open' or 'closed')
        user_id: ID of the admin making the update

    Returns:
        UpdateFloorStatusResponse with updated floor details
    """
    try:
        async with db.transaction() as connection:
            floor = await connection.fetchrow(GET_FLOOR_QUERY, floor_id)
            if not floor:
                logger.warning("Floor not found")
                raise ValueError("Floor not found")

            updated_floor = await connection.fetchrow(
                UPDATE_FLOOR_STATUS_QUERY, status, user_id, floor_id
            )

            logger.info(
                f"Updated floor {updated_floor['number']} status to '{status}' by admin {user_id}"
            )

            return UpdateFloorStatusResponse(
                floor_id=updated_floor["floor_id"],
                floor_number=updated_floor["number"],
                status=updated_floor["status"],
            )

    except Exception:
        logger.error("Error updating floor status")
        raise
