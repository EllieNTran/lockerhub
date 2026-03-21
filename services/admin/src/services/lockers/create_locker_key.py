"""Create a key for an existing locker."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import CreateKeyResponse

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

CHECK_LOCKER_EXISTS_QUERY = """
SELECT locker_id FROM lockerhub.lockers WHERE locker_id = $1
"""

CHECK_LOCKER_HAS_KEY_QUERY = """
SELECT key_id FROM lockerhub.keys WHERE locker_id = $1
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
        async with db.transaction() as connection:
            locker = await connection.fetchrow(CHECK_LOCKER_EXISTS_QUERY, locker_id)
            if not locker:
                logger.warning("Locker not found")
                raise ValueError("Locker not found")

            existing_key = await connection.fetchrow(
                CHECK_LOCKER_HAS_KEY_QUERY, locker_id
            )
            if existing_key:
                logger.warning("Locker already has a key")
                raise ValueError("Locker already has a key")

            key = await connection.fetchrow(
                CREATE_KEY_QUERY,
                key_number,
                locker_id,
                user_id,
            )

            logger.info("Created key")

            return CreateKeyResponse(
                key_id=key["key_id"],
                key_number=key["key_number"],
                locker_id=locker_id,
            )

    except Exception:
        logger.error("Error creating key")
        raise
