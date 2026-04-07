"""Report a lost key for a locker and mark it as under maintenance."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerStatusResponse

REPORT_LOST_KEY_QUERY = """
WITH locker_info AS (
    SELECT 
        l.locker_id,
        l.status,
        k.key_number,
        k.status as key_status
    FROM lockerhub.lockers l
    LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
    WHERE l.locker_id = $1
    AND l.status = 'available'::lockerhub.locker_status
),
updated_key AS (
    UPDATE lockerhub.keys
    SET status = 'lost'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = (SELECT locker_id FROM locker_info)
    AND EXISTS (SELECT 1 FROM locker_info WHERE key_number IS NOT NULL)
    RETURNING key_number, status
),
updated_locker AS (
    UPDATE lockerhub.lockers
    SET status = 'maintenance'::lockerhub.locker_status, updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = (SELECT locker_id FROM locker_info)
    RETURNING locker_id, locker_number, status
)
SELECT 
    ul.locker_id,
    ul.locker_number,
    ul.status,
    uk.key_number AS updated_key_number
FROM updated_locker ul
LEFT JOIN updated_key uk ON true
"""


async def report_lost_key(locker_id: str) -> LockerStatusResponse:
    """Report a lost key for a locker and mark it as under maintenance.

    Args:
        locker_id: ID of the locker to report a lost key for

    Returns:
        LockerStatusResponse with updated locker details
    """
    try:
        result = await db.fetchrow(REPORT_LOST_KEY_QUERY, locker_id)

        if not result:
            logger.warning("Locker not found or not available")
            raise ValueError(
                "Locker not found or must be 'available' to report lost key"
            )

        logger.info("Reported lost key and marked locker as under maintenance")

        return LockerStatusResponse(**dict(result))

    except ValueError:
        raise
    except Exception:
        logger.error("Error reporting lost key and marking locker as under maintenance")
        raise
