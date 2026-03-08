"""Get the statistics for the admin dashboard."""

from src.logger import logger
from src.connectors.db import db

GET_DASHBOARD_STATS_QUERY = """
WITH locker_stats AS (
    SELECT 
        COUNT(*) as total_lockers,
        COUNT(*) FILTER (WHERE status = 'available') as available_lockers
    FROM lockerhub.lockers
),
request_stats AS (
    SELECT COUNT(*) as pending_requests
    FROM lockerhub.requests
    WHERE status = 'pending'
),
booking_stats AS (
    SELECT COUNT(*) as bookings_ending_today
    FROM lockerhub.bookings
    WHERE DATE(end_time) = CURRENT_DATE
)
SELECT * FROM locker_stats, request_stats, booking_stats;
"""


async def get_dashboard_stats():
    """Get all statistics for the admin dashboard.

    Returns:
        A dictionary containing total lockers, available lockers, pending requests, and bookings ending today.
    """
    try:
        result = await db.fetchrow(GET_DASHBOARD_STATS_QUERY)
        logger.info("Retrieved dashboard statistics successfully")
        return result
    except Exception as e:
        logger.error(f"Error fetching dashboard statistics: {e}")
        raise
