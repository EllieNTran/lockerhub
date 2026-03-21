"""Create a new locker with key."""

from typing import Optional
from src.logger import logger
from src.connectors.db import db
from src.models.responses import CreateLockerResponse

CREATE_LOCKER_QUERY = """
INSERT INTO lockerhub.lockers (
    locker_number,
    floor_id,
    location,
    x_coordinate,
    y_coordinate,
    status,
    created_by,
    updated_by
)
VALUES ($1, $2, $3, $4, $5, 'available', $6, $6)
RETURNING locker_id, locker_number
"""

CREATE_KEY_QUERY = """
INSERT INTO lockerhub.keys (
    key_number,
    locker_id,
    status,
    created_by,
    updated_by
)
VALUES ($1, $2, 'available', $3, $3)
RETURNING key_id, key_number
"""

CHECK_FLOOR_EXISTS_QUERY = """
SELECT floor_id FROM lockerhub.floors WHERE floor_id = $1
"""


async def create_locker(
    locker_number: str,
    floor_id: str,
    key_number: str,
    user_id: str,
    location: Optional[str] = None,
    x_coordinate: Optional[int] = None,
    y_coordinate: Optional[int] = None,
) -> CreateLockerResponse:
    """Create a new locker with a key.

    Args:
        locker_number: Unique locker number
        floor_id: ID of the floor where locker is located
        key_number: Unique key number for this locker
        user_id: ID of the user creating the locker
        location: Optional location description
        x_coordinate: Optional X coordinate
        y_coordinate: Optional Y coordinate

    Returns:
        CreateLockerResponse with locker and key details
    """
    try:
        async with db.transaction() as connection:
            floor = await connection.fetchrow(CHECK_FLOOR_EXISTS_QUERY, floor_id)
            if not floor:
                logger.warning("Floor not found")
                raise ValueError("Floor not found")

            locker = await connection.fetchrow(
                CREATE_LOCKER_QUERY,
                locker_number,
                floor_id,
                location,
                x_coordinate,
                y_coordinate,
                user_id,
            )

            key = await connection.fetchrow(
                CREATE_KEY_QUERY,
                key_number,
                locker["locker_id"],
                user_id,
            )

            logger.info("Created locker and key")

            return CreateLockerResponse(
                locker_id=locker["locker_id"],
                locker_number=locker["locker_number"],
                key_id=key["key_id"],
                key_number=key["key_number"],
            )

    except Exception:
        logger.error("Error creating locker")
        raise
