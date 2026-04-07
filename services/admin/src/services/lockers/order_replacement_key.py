"""Order a replacement key for a locker."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerStatusResponse

ORDER_REPLACEMENT_KEY_QUERY = """
WITH locker_check AS (
    SELECT 
        l.locker_id,
        l.locker_number,
        l.status,
        k.key_number,
        k.status as key_status
    FROM lockerhub.lockers l
    LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
    WHERE l.locker_id = $1
    AND l.status = 'maintenance'::lockerhub.locker_status
    AND k.status = 'lost'::lockerhub.key_status
),
updated_key AS (
    UPDATE lockerhub.keys
    SET status = 'awaiting_replacement'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP
    WHERE locker_id = $1
    AND EXISTS (SELECT 1 FROM locker_check)
    RETURNING key_number, status
)
SELECT 
    lc.locker_id,
    lc.locker_number,
    lc.status,
    uk.key_number,
    uk.status AS key_status
FROM locker_check lc
LEFT JOIN updated_key uk ON true
"""


async def order_replacement_key(locker_id: str) -> LockerStatusResponse:
    """Order a replacement key for a locker.

    Args:
        locker_id: ID of the locker to order a replacement key for

    Returns:
        LockerStatusResponse with updated locker details
    """
    try:
        result = await db.fetchrow(ORDER_REPLACEMENT_KEY_QUERY, locker_id)

        if not result:
            logger.warning("Locker not found, not under maintenance, or key not lost")
            raise ValueError("Locker must be 'maintenance' to order replacement key")

        if not result["key_status"]:
            logger.warning("Key not updated - key must be 'lost' to order replacement")
            raise ValueError("Key must be 'lost' to order replacement")

        logger.info("Ordered replacement key for locker")

        return LockerStatusResponse(
            locker_id=result["locker_id"],
            locker_number=result["locker_number"],
            status=result["status"],
        )

    except ValueError:
        raise
    except Exception:
        logger.error("Error ordering replacement key")
        raise
