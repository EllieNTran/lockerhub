"""Mark a locker as available (repaired after maintenance)."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerStatusResponse

MARK_LOCKER_AVAILABLE_QUERY = """
WITH locker_check AS (
    SELECT 
        l.locker_id,
        l.status,
        k.key_number,
        k.status as key_status
    FROM lockerhub.lockers l
    LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
    WHERE l.locker_id = $1
    AND l.status = 'maintenance'::lockerhub.locker_status
),
updated_locker AS (
    UPDATE lockerhub.lockers
    SET status = 'available'::lockerhub.locker_status, updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = $1
    AND EXISTS (SELECT 1 FROM locker_check)
    RETURNING locker_id, locker_number, status
),
updated_key AS (
    UPDATE lockerhub.keys
    SET status = 'available'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = $1
    AND status = 'awaiting_replacement'::lockerhub.key_status
    AND EXISTS (SELECT 1 FROM locker_check WHERE key_status = 'awaiting_replacement'::lockerhub.key_status)
    RETURNING key_number, status
)
SELECT 
    ul.locker_id,
    ul.locker_number,
    ul.status,
    uk.key_number AS updated_key_number,
    uk.status AS updated_key_status
FROM updated_locker ul
LEFT JOIN updated_key uk ON true
"""


async def mark_locker_available(locker_id: str) -> LockerStatusResponse:
    """Mark a locker as available after maintenance.

    Args:
        locker_id: ID of the locker to mark as available

    Returns:
        LockerStatusResponse with updated locker details
    """
    try:
        result = await db.fetchrow(MARK_LOCKER_AVAILABLE_QUERY, locker_id)

        if not result:
            logger.warning("Locker not found or not in maintenance")
            raise ValueError("Locker must be 'maintenance' to mark as available")

        if result["updated_key_status"]:
            logger.info("Updated key status to available")

        logger.info("Marked locker as available (repaired)")

        return LockerStatusResponse(
            locker_id=result["locker_id"],
            locker_number=result["locker_number"],
            status=result["status"],
        )

    except ValueError:
        raise
    except Exception:
        logger.error("Error marking locker as available")
        raise
