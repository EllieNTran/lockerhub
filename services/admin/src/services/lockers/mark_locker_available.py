"""Mark a locker as available (repaired after maintenance)."""

from src.logger import logger
from src.connectors.db import db

GET_LOCKER_QUERY = """
SELECT 
    locker_id,
    status
FROM lockerhub.lockers
WHERE locker_id = $1
"""

UPDATE_LOCKER_STATUS_QUERY = """
UPDATE lockerhub.lockers
SET status = 'available'
WHERE locker_id = $1
RETURNING locker_id, locker_number, status
"""


async def mark_locker_available(locker_id: str) -> dict:
    """Mark a locker as available after maintenance.

    Args:
        locker_id: ID of the locker to mark as available

    Returns:
        A dictionary containing the updated locker details
    """
    try:
        async with db.transaction() as connection:
            locker = await connection.fetchrow(GET_LOCKER_QUERY, locker_id)
            if not locker:
                logger.warning(f"Locker {locker_id} not found")
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

            logger.info(
                f"Marked locker {updated_locker['locker_number']} as available (repaired)"
            )

            return {
                "locker_id": updated_locker["locker_id"],
                "locker_number": updated_locker["locker_number"],
                "status": updated_locker["status"],
            }

    except Exception as e:
        logger.error(f"Error marking locker {locker_id} as available: {e}")
        raise
