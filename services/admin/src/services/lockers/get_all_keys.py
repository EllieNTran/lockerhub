"""Get all keys."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import AllKeysResponse, KeyResponse

GET_ALL_KEYS_QUERY = """
SELECT
    k.key_id,
    k.key_number
FROM lockerhub.keys k
ORDER BY k.created_at DESC;
"""


async def get_all_keys() -> AllKeysResponse:
    """Get all keys.

    Returns:
        AllKeysResponse with a list of KeyResponse objects.
    """
    try:
        result = await db.fetch(GET_ALL_KEYS_QUERY)
        logger.info("Retrieved all keys successfully")
        return AllKeysResponse(keys=[KeyResponse(**dict(row)) for row in result])
    except Exception:
        logger.error("Error fetching all keys")
        raise
