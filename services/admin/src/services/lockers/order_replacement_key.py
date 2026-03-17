"""Order a replacement key for a locker."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerStatusResponse

GET_LOCKER_QUERY = """
SELECT 
    l.locker_id,
    l.status,
    k.key_number,
    k.status as key_status
FROM lockerhub.lockers l
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
WHERE l.locker_id = $1
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'awaiting_replacement'
WHERE locker_id = $1
RETURNING key_number, status
"""


async def order_replacement_key(locker_id: str) -> LockerStatusResponse:
    """Order a replacement key for a locker.

    Args:
        locker_id: ID of the locker to order a replacement key for

    Returns:
        LockerStatusResponse with updated locker details
    """
    try:
        async with db.transaction() as connection:
            locker = await connection.fetchrow(GET_LOCKER_QUERY, locker_id)
            if not locker:
                logger.warning("Locker not found")
                raise ValueError("Locker not found")

            if locker["status"] != "maintenance":
                logger.warning(
                    "Cannot order replacement key for locker not under maintenance"
                )
                raise ValueError(
                    "Locker must be 'maintenance' to order replacement key"
                )

            if locker["key_status"] != "lost":
                logger.warning("Cannot order replacement key for key that is not lost")
                raise ValueError("Key must be 'lost' to order replacement")

            await connection.fetchrow(UPDATE_KEY_STATUS_QUERY, locker_id)

            updated_locker = await connection.fetchrow(GET_LOCKER_QUERY, locker_id)

            logger.info("Ordered replacement key for locker")

            return LockerStatusResponse(
                locker_id=updated_locker["locker_id"],
                locker_number=str(updated_locker["locker_id"]),
                status=updated_locker["status"],
            )

    except Exception:
        logger.error("Error ordering replacement key")
        raise
