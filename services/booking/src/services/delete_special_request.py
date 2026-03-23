"""Delete a special request by ID."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import DeleteSpecialRequestResponse

GET_SPECIAL_REQUEST_QUERY = """
SELECT user_id
FROM lockerhub.requests
WHERE request_id = $1
AND request_type = 'special'
"""

DELETE_SPECIAL_REQUEST_QUERY = """
DELETE FROM lockerhub.requests
WHERE request_id = $1
RETURNING request_id;
"""


async def delete_special_request(
    user_id: str, request_id: int
) -> DeleteSpecialRequestResponse:
    """
    Delete a special request by ID.

    Args:
        request_id: ID of the special request to delete

    Returns:
        ID of the deleted request

    Raises:
        ValueError: If the request cannot be deleted
    """
    try:
        async with db.transaction() as connection:
            request = await connection.fetchrow(GET_SPECIAL_REQUEST_QUERY, request_id)

            if not request:
                logger.warning("Special request not found for deletion")
                raise ValueError("Special request not found")
            if str(request["user_id"]) != user_id:
                logger.warning("User not authorized to delete this special request")
                raise ValueError("User not authorized to delete this special request")

            deleted_request_id = await connection.fetchval(
                DELETE_SPECIAL_REQUEST_QUERY, request_id
            )
            if not deleted_request_id:
                raise ValueError("Special request not found or could not be deleted")

            return DeleteSpecialRequestResponse(request_id=deleted_request_id)
    except Exception:
        logger.error("Error deleting special request")
        raise
