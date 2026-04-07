"""Create a new locker with key."""

from typing import Optional
from src.logger import logger
from src.connectors.db import db
from src.models.responses import CreateLockerResponse

CREATE_LOCKER_WITH_KEY_QUERY = """
WITH floor_check AS (
    SELECT floor_id 
    FROM lockerhub.floors 
    WHERE floor_id = $2
),
inserted_locker AS (
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
    SELECT $1, $2, $3, $4, $5, 'available'::lockerhub.locker_status, $6, $6
    WHERE EXISTS (SELECT 1 FROM floor_check)
    RETURNING locker_id, locker_number
),
inserted_key AS (
    INSERT INTO lockerhub.keys (
        key_number,
        locker_id,
        status,
        created_by,
        updated_by
    )
    SELECT $7, il.locker_id, 'available'::lockerhub.key_status, $6, $6
    FROM inserted_locker il
    RETURNING key_id, key_number
)
SELECT 
    il.locker_id,
    il.locker_number,
    ik.key_id,
    ik.key_number
FROM inserted_locker il
CROSS JOIN inserted_key ik
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
        result = await db.fetchrow(
            CREATE_LOCKER_WITH_KEY_QUERY,
            locker_number,
            floor_id,
            location,
            x_coordinate,
            y_coordinate,
            user_id,
            key_number,
        )

        if not result:
            logger.warning("Floor not found")
            raise ValueError("Floor not found")

        logger.info("Created locker and key")

        return CreateLockerResponse(
            locker_id=result["locker_id"],
            locker_number=result["locker_number"],
            key_id=result["key_id"],
            key_number=result["key_number"],
        )

    except ValueError:
        raise
    except Exception:
        logger.error("Error creating locker")
        raise
