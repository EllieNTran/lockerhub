"""Get the statistics for the admin dashboard."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import DashboardStatsResponse

GET_DASHBOARD_STATS_QUERY = """
WITH locker_stats AS (
    SELECT 
        COUNT(*) as total_lockers,
        COUNT(*) FILTER (WHERE status = 'available') as available_lockers,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied_lockers,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_lockers
    FROM lockerhub.lockers
),
request_stats AS (
    SELECT COUNT(*) as pending_requests
    FROM lockerhub.requests
    WHERE status = 'pending'
),
booking_stats AS (
    SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'active') as active_bookings
    FROM lockerhub.bookings
),
user_stats AS (
    SELECT COUNT(*) as total_users
    FROM lockerhub.users
)
SELECT * FROM locker_stats, request_stats, booking_stats, user_stats;
"""


async def get_dashboard_stats() -> DashboardStatsResponse:
    """Get all statistics for the admin dashboard.

    Returns:
        DashboardStatsResponse containing all dashboard statistics.
    """
    try:
        result = await db.fetchrow(GET_DASHBOARD_STATS_QUERY)
        logger.info("Retrieved dashboard statistics successfully")
        return DashboardStatsResponse(**dict(result))
    except Exception:
        logger.error("Error fetching dashboard statistics")
        raise
