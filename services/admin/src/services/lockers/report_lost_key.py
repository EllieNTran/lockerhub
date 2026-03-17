"""Report a lost key for a locker and mark it as under maintenance."""

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
SET status = 'lost'
WHERE locker_id = $1
RETURNING key_number, status
"""

UPDATE_LOCKER_STATUS_QUERY = """
UPDATE lockerhub.lockers
SET status = 'maintenance'
WHERE locker_id = $1
RETURNING locker_id, locker_number, status
"""


async def report_lost_key(locker_id: str) -> LockerStatusResponse:
    """Report a lost key for a locker and mark it as under maintenance.

    Args:
        locker_id: ID of the locker to report a lost key for

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
                logger.warning("Cannot report lost key for locker")
                raise ValueError("Locker must be 'available' to report lost key")

            if locker["key_number"]:
                await connection.fetchrow(UPDATE_KEY_STATUS_QUERY, locker_id)

            updated_locker = await connection.fetchrow(
                UPDATE_LOCKER_STATUS_QUERY, locker_id
            )

            logger.info("Reported lost key and marked locker as under maintenance")

            return LockerStatusResponse(**dict(updated_locker))

    except Exception:
        logger.error("Error reporting lost key and marking locker as under maintenance")
        raise
