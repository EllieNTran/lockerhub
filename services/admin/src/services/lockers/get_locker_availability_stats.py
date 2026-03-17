"""Get locker availability statistics."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import LockerStatsResponse

GET_LOCKER_STATISTICS_QUERY = """
    SELECT 
        COUNT(*) as total_lockers,
        COUNT(*) FILTER (WHERE status = 'available') as total_available,
        COUNT(*) FILTER (WHERE status = 'maintenance') as total_maintenance
    FROM lockerhub.lockers;
"""


async def get_locker_availability_statistics() -> LockerStatsResponse:
    """Get locker availability statistics including total, available, and under maintenance counts.

    Returns:
        LockerStatsResponse with locker statistics.
    """
    try:
        logger.info("Fetching locker availability statistics")

        result = await db.fetchrow(GET_LOCKER_STATISTICS_QUERY)

        logger.info("Locker availability statistics retrieved")
        return LockerStatsResponse(**dict(result))

    except Exception:
        logger.error("Error fetching locker availability statistics")
        raise
