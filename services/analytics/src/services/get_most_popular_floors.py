"""Get most popular floors by locker usage over a specified date range with optional department filter."""

from typing import Optional
from src.logger import logger
from src.connectors.db import db
from src.models.responses import FloorUsageResponse, TopFloorsResponse
from src.utils.date_utils import get_date_range

GET_MOST_POPULAR_FLOORS_QUERY = """
SELECT 
    f.floor_id,
    f.floor_number,
    COUNT(DISTINCT b.locker_id) as occupied_count
FROM lockerhub.floors f
LEFT JOIN lockerhub.lockers l ON l.floor_id = f.floor_id
LEFT JOIN lockerhub.bookings b ON (
    b.locker_id = l.locker_id
    AND b.start_date <= $2::date
    AND COALESCE(b.end_date, CURRENT_DATE) >= $1::date
    AND b.status NOT IN ('cancelled', 'expired')
)
LEFT JOIN lockerhub.users u ON (
    u.user_id = b.user_id
    AND ($3::uuid IS NULL OR u.department_id = $3::uuid)
)
GROUP BY f.floor_id, f.floor_number
HAVING COUNT(DISTINCT b.locker_id) > 0
ORDER BY occupied_count DESC
LIMIT 6;
"""


async def get_most_popular_floors(
    period: str = "last_7_days",
    department_id: Optional[str] = None,
) -> TopFloorsResponse:
    """
    Get 6 most popular floors by locker occupancy over a specified time period.

    Args:
        period: Time period to analyze.
        department_id: Optional UUID of the department to filter by

    Returns:
        TopFloorsResponse with list of most popular floors by usage
    """
    try:
        start_date, end_date = await get_date_range(period)

        records = await db.fetch(
            GET_MOST_POPULAR_FLOORS_QUERY, start_date, end_date, department_id
        )
        logger.info(f"Retrieved {len(records)} most popular floors")
        return TopFloorsResponse(
            floors=[FloorUsageResponse(**dict(record)) for record in records]
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Error retrieving most popular floors")
        raise
