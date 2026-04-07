"""Mark a locker as under maintenance."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerStatusResponse

MARK_LOCKER_MAINTENANCE_QUERY = """
WITH locker_check AS (
    SELECT 
        locker_id,
        status
    FROM lockerhub.lockers
    WHERE locker_id = $1
    AND status = 'available'::lockerhub.locker_status
),
updated_locker AS (
    UPDATE lockerhub.lockers
    SET status = 'maintenance'::lockerhub.locker_status, updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = $1
    AND EXISTS (SELECT 1 FROM locker_check)
    RETURNING locker_id, locker_number, status
)
SELECT 
    ul.locker_id,
    ul.locker_number,
    ul.status,
    (SELECT COUNT(*) FROM locker_check) AS was_available
FROM updated_locker ul
"""


async def mark_locker_maintenance(locker_id: str) -> LockerStatusResponse:
    """Mark a locker as under maintenance.

    Args:
        locker_id: ID of the locker to mark as under maintenance

    Returns:
        LockerStatusResponse with updated locker details
    """
    try:
        result = await db.fetchrow(MARK_LOCKER_MAINTENANCE_QUERY, locker_id)

        if not result:
            logger.warning("Locker not found or not available")
            raise ValueError("Locker must be 'available' to mark as maintenance")

        logger.info("Marked locker as under maintenance")

        return LockerStatusResponse(**dict(result))

    except ValueError:
        raise
    except Exception:
        logger.error("Error marking locker as maintenance")
        raise
