"""Get the statistics for the admin dashboard."""

from src.logger import logger
from src.connectors.db import db

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


async def get_dashboard_stats():
    """Get all statistics for the admin dashboard.

    Returns:
        A dictionary containing:
        - total_lockers, available_lockers, occupied_lockers, maintenance_lockers
        - total_bookings, active_bookings
        - pending_requests
        - total_users
    """
    try:
        result = await db.fetchrow(GET_DASHBOARD_STATS_QUERY)
        logger.info("Retrieved dashboard statistics successfully")
        return result
    except Exception as e:
        logger.error(f"Error fetching dashboard statistics: {e}")
        raise
