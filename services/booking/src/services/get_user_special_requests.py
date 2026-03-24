"""Get user special requests."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import SpecialRequestResponse, SpecialRequestsListResponse

GET_USER_SPECIAL_REQUESTS_QUERY = """
SELECT
    r.request_id,
    r.user_id,
    r.floor_id,
    r.locker_id,
    r.start_date,
    r.end_date,
    r.request_type,
    r.justification,
    r.status,
    r.created_at,
    r.reviewed_at,
    r.reviewed_by,
    r.reason,
    f.floor_number,
    l.locker_number
FROM lockerhub.requests r
LEFT JOIN lockerhub.floors f ON r.floor_id = f.floor_id
LEFT JOIN lockerhub.lockers l ON r.locker_id = l.locker_id
WHERE r.user_id = $1
AND r.request_type = 'special'
ORDER BY 
    CASE r.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
    END,
    r.created_at DESC
"""


async def get_user_special_requests(user_id: str) -> SpecialRequestsListResponse:
    """
    Get all special requests for a user.

    Args:
        user_id: ID of the user

    Returns:
        List of special requests for the user
    """
    try:
        special_requests = await db.fetch(GET_USER_SPECIAL_REQUESTS_QUERY, user_id)
        return SpecialRequestsListResponse(
            requests=[SpecialRequestResponse(**dict(row)) for row in special_requests]
        )
    except Exception:
        logger.error("Error fetching special requests for user")
        raise
