"""Review a special request."""

from src.logger import logger
from src.connectors.db import db

REVIEW_SPECIAL_REQUEST_QUERY = """
UPDATE lockerhub.requests
SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
WHERE request_id = $3
RETURNING request_id, user_id
"""


async def review_special_request(status, reviewed_by, request_id):
    """Approve or reject a special request.

    Returns:
        A dictionary containing the request ID and user ID of the reviewed request.
    """
    try:
        result = await db.fetch(
            REVIEW_SPECIAL_REQUEST_QUERY, status, reviewed_by, request_id
        )
        logger.info("Reviewed special request")
        return result
    except Exception as e:
        logger.error(f"Error reviewing special request: {e}")
        raise
