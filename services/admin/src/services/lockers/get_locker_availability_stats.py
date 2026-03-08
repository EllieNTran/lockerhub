"""Get locker availability statistics."""

from src.logger import logger
from src.connectors.db import db

GET_LOCKER_STATISTICS_QUERY = """
    SELECT 
        COUNT(*) as total_lockers,
        COUNT(*) FILTER (WHERE status = 'available') as total_available,
        COUNT(*) FILTER (WHERE status = 'maintenance') as total_maintenance
    FROM lockerhub.lockers;
"""


async def get_locker_availability_statistics():
    """Get locker availability statistics including total, available, and under maintenance counts.

    Returns:
        A dictionary with total lockers, available lockers, and lockers under maintenance.
    """
    try:
        logger.info("Fetching locker availability statistics")

        result = await db.fetchrow(GET_LOCKER_STATISTICS_QUERY)

        stats = {
            "total_lockers": result["total_lockers"],
            "total_available": result["total_available"],
            "total_maintenance": result["total_maintenance"],
        }

        logger.info(f"Locker availability statistics retrieved: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Error fetching locker availability statistics: {e}")
        raise
