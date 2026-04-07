"""Create a key for an existing locker."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import CreateKeyResponse

CREATE_KEY_WITH_VALIDATION_QUERY = """
WITH locker_check AS (
    SELECT locker_id 
    FROM lockerhub.lockers 
    WHERE locker_id = $2
),
existing_key_check AS (
    SELECT key_id 
    FROM lockerhub.keys 
    WHERE locker_id = $2
),
inserted_key AS (
    INSERT INTO lockerhub.keys (
        key_number,
        locker_id,
        status,
        created_by,
        updated_by
    )
    SELECT $1, $2, 'available'::lockerhub.key_status, $3, $3
    WHERE EXISTS (SELECT 1 FROM locker_check)
    AND NOT EXISTS (SELECT 1 FROM existing_key_check)
    RETURNING key_id, key_number
)
SELECT 
    ik.key_id,
    ik.key_number,
    (SELECT COUNT(*) FROM locker_check) AS locker_exists,
    (SELECT COUNT(*) FROM existing_key_check) AS has_key
FROM inserted_key ik
"""


async def create_locker_key(
    key_number: str,
    locker_id: str,
    user_id: str,
) -> CreateKeyResponse:
    """Create a key for an existing locker.

    Args:
        key_number: Unique key number
        locker_id: ID of the locker this key belongs to
        user_id: ID of the user creating the key

    Returns:
        CreateKeyResponse with key details
    """
    try:
        result = await db.fetchrow(
            CREATE_KEY_WITH_VALIDATION_QUERY,
            key_number,
            locker_id,
            user_id,
        )

        if not result:
            locker_check = await db.fetchval(
                "SELECT COUNT(*) FROM lockerhub.lockers WHERE locker_id = $1", locker_id
            )
            if not locker_check:
                logger.warning("Locker not found")
                raise ValueError("Locker not found")

            logger.warning("Locker already has a key")
            raise ValueError("Locker already has a key")

        logger.info("Created key")

        return CreateKeyResponse(
            key_id=result["key_id"],
            key_number=result["key_number"],
            locker_id=locker_id,
        )

    except ValueError:
        raise
    except Exception:
        logger.error("Error creating key")
        raise
