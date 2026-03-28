"""Get locker usage over a specified date range with floor and department filters."""

from datetime import date, timedelta
from typing import Optional
from src.logger import logger
from src.connectors.db import db
from src.models.responses import DayLockerUsageResponse, FullLockerUsageResponse

GET_LOCKER_USAGE_QUERY = """
WITH date_series AS (
    SELECT generate_series(
        $1::date,
        $2::date,
        '1 day'::interval
    )::date as usage_date
)
SELECT 
    ds.usage_date,
    COUNT(DISTINCT b.locker_id) as occupied_count
FROM date_series ds
LEFT JOIN lockerhub.bookings b ON (
    ds.usage_date BETWEEN b.start_date AND COALESCE(b.end_date, CURRENT_DATE)
    AND b.status IN ('active', 'upcoming', 'completed')
    AND ($3::uuid IS NULL OR EXISTS (
        SELECT 1 FROM lockerhub.lockers l 
        WHERE l.locker_id = b.locker_id AND l.floor_id = $3::uuid
    ))
    AND ($4::uuid IS NULL OR EXISTS (
        SELECT 1 FROM lockerhub.users u 
        WHERE u.user_id = b.user_id AND u.department_id = $4::uuid
    ))
)
GROUP BY ds.usage_date
ORDER BY ds.usage_date DESC;
"""

PERIOD_DAYS = {
    "today": 0,
    "last_7_days": 7,
    "last_14_days": 14,
    "last_month": 30,
    "last_3_months": 90,
    "last_6_months": 180,
    "last_year": 365,
    "last_2_years": 730,
    "all_time": None,
}


async def get_locker_usage(
    period: str = "last_month",
    floor_id: Optional[str] = None,
    department_id: Optional[str] = None,
) -> FullLockerUsageResponse:
    """
    Get daily locker occupancy over a specified time period with optional filters.

    Args:
        period: Time period to analyze.
        floor_id: Optional UUID of the floor to filter by
        department_id: Optional UUID of the department to filter by

    Returns:
        FullLockerUsageResponse with list of daily locker usage data
    """
    try:
        end_date = date.today()

        if period == "all_time":
            earliest_booking = await db.fetchval(
                "SELECT MIN(start_date) FROM lockerhub.bookings"
            )
            start_date = earliest_booking if earliest_booking else end_date
        elif period == "today":
            start_date = end_date
        else:
            days = PERIOD_DAYS[period]
            start_date = end_date - timedelta(days=days - 1)

        records = await db.fetch(
            GET_LOCKER_USAGE_QUERY, start_date, end_date, floor_id, department_id
        )
        logger.info(f"Retrieved {len(records)} daily usage records")
        return FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**dict(record)) for record in records]
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Error retrieving locker usage")
        raise
