"""Get locker usage over a specified date range with floor and department filters."""

from typing import Optional
from src.logger import logger
from src.connectors.db import db
from src.models.responses import DayLockerUsageResponse, LockerUsageResponse
from src.utils.date_utils import get_date_range

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
    AND b.status NOT IN ('cancelled', 'expired')
)
LEFT JOIN lockerhub.lockers l ON (
    l.locker_id = b.locker_id
    AND ($3::uuid IS NULL OR l.floor_id = $3::uuid)
)
LEFT JOIN lockerhub.users u ON (
    u.user_id = b.user_id
    AND ($4::uuid IS NULL OR u.department_id = $4::uuid)
)
GROUP BY ds.usage_date
ORDER BY ds.usage_date DESC;
"""


async def get_locker_usage(
    period: str = "last_7_days",
    floor_id: Optional[str] = None,
    department_id: Optional[str] = None,
) -> LockerUsageResponse:
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
        start_date, end_date = await get_date_range(period)

        records = await db.fetch(
            GET_LOCKER_USAGE_QUERY, start_date, end_date, floor_id, department_id
        )
        logger.info(f"Retrieved {len(records)} daily usage records")
        return LockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**dict(record)) for record in records]
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Error retrieving locker usage")
        raise
