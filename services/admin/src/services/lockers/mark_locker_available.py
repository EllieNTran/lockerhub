"""Mark a locker as available (repaired after maintenance)."""

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

UPDATE_LOCKER_STATUS_QUERY = """
UPDATE lockerhub.lockers
SET status = 'available'
WHERE locker_id = $1
RETURNING locker_id, locker_number, status
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'available'
WHERE locker_id = $1
RETURNING key_number, status
"""


async def mark_locker_available(locker_id: str) -> LockerStatusResponse:
    """Mark a locker as available after maintenance.

    Args:
        locker_id: ID of the locker to mark as available

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
                    f"Cannot mark locker {locker_id} as available: current status is '{locker['status']}'"
                )
                raise ValueError(
                    f"Locker must be 'maintenance' to mark as available (current: {locker['status']})"
                )

            updated_locker = await connection.fetchrow(
                UPDATE_LOCKER_STATUS_QUERY, locker_id
            )

            if locker["key_number"] and locker["key_status"] == "awaiting_replacement":
                await connection.fetchrow(UPDATE_KEY_STATUS_QUERY, locker_id)
                logger.info(f"Updated key status to available for locker {locker_id}")

            logger.info(
                f"Marked locker {updated_locker['locker_number']} as available (repaired)"
            )

            return LockerStatusResponse(**dict(updated_locker))

    except Exception:
        logger.error("Error marking locker as available")
        raise
