"""Update locker coordinates."""

from src.connectors.db import db
from src.logger import logger


async def update_locker_coordinates(
    locker_id: str, x_coordinate: int, y_coordinate: int
) -> dict:
    """
    Update the x and y coordinates of a locker.

    Args:
        locker_id: UUID of the locker
        x_coordinate: New X coordinate (relative to zone)
        y_coordinate: New Y coordinate (relative to zone)

    Returns:
        dict with updated locker information

    Raises:
        ValueError: If locker not found
    """
    try:
        check_query = "SELECT locker_id FROM lockerhub.lockers WHERE locker_id = $1"
        locker = await db.fetchrow(check_query, locker_id)

        if not locker:
            raise ValueError(f"Locker {locker_id} not found")

        update_query = """
            UPDATE lockerhub.lockers
            SET x_coordinate = $1, y_coordinate = $2, updated_at = CURRENT_TIMESTAMP
            WHERE locker_id = $3
            RETURNING locker_id, locker_number, x_coordinate, y_coordinate, updated_at
        """

        result = await db.fetchrow(update_query, x_coordinate, y_coordinate, locker_id)

        logger.info("Updated locker coordinates")

        return dict(result)
    except ValueError:
        raise
    except Exception:
        logger.error("Error updating locker coordinates")
        raise
