"""Mark a locker as under maintenance."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerStatusResponse

GET_LOCKER_QUERY = """
SELECT 
    locker_id,
    status
FROM lockerhub.lockers
WHERE locker_id = $1
"""

UPDATE_LOCKER_STATUS_QUERY = """
UPDATE lockerhub.lockers
SET status = 'maintenance'
WHERE locker_id = $1
RETURNING locker_id, locker_number, status
"""


async def mark_locker_maintenance(locker_id: str) -> LockerStatusResponse:
    """Mark a locker as under maintenance.

    Args:
        locker_id: ID of the locker to mark as under maintenance

    Returns:
        LockerStatusResponse with updated locker details
    """
    try:
        async with db.transaction() as connection:
            locker = await connection.fetchrow(GET_LOCKER_QUERY, locker_id)
            if not locker:
                logger.warning("Locker not found")
                raise ValueError("Locker not found")

            if locker["status"] != "available":
                logger.warning(
                    f"Cannot mark locker {locker_id} as maintenance: current status is '{locker['status']}'"
                )
                raise ValueError(
                    f"Locker must be 'available' to mark as maintenance (current: {locker['status']})"
                )

            updated_locker = await connection.fetchrow(
                UPDATE_LOCKER_STATUS_QUERY, locker_id
            )

            logger.info(
                f"Marked locker {updated_locker['locker_number']} as under maintenance"
            )

            return LockerStatusResponse(**dict(updated_locker))

    except Exception:
        logger.error("Error marking locker as maintenance")
        raise
