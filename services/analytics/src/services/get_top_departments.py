"""Get top departments in locker usage over a specified date range with optional floor filter."""

from typing import Optional
from src.logger import logger
from src.connectors.db import db
from src.models.responses import DepartmentUsageResponse, TopDepartmentsResponse
from src.utils.date_utils import get_date_range

GET_TOP_DEPARTMENTS_QUERY = """
SELECT 
    d.department_id,
    d.name as department_name,
    COUNT(DISTINCT b.locker_id) as occupied_count
FROM lockerhub.departments d
LEFT JOIN lockerhub.users u ON u.department_id = d.department_id
LEFT JOIN lockerhub.bookings b ON (
    b.user_id = u.user_id
    AND b.start_date <= $2::date
    AND COALESCE(b.end_date, CURRENT_DATE) >= $1::date
    AND b.status NOT IN ('cancelled', 'expired')
)
LEFT JOIN lockerhub.lockers l ON l.locker_id = b.locker_id
WHERE ($3::uuid IS NULL OR l.floor_id = $3::uuid)
GROUP BY d.department_id, d.name
HAVING COUNT(DISTINCT b.locker_id) > 0
ORDER BY occupied_count DESC
LIMIT 6;
"""


async def get_top_departments(
    period: str = "last_7_days",
    floor_id: Optional[str] = None,
) -> TopDepartmentsResponse:
    """
    Get top 6 departments by locker occupancy over a specified time period.

    Args:
        period: Time period to analyze.
        floor_id: Optional UUID of the floor to filter by

    Returns:
        TopDepartmentsResponse with list of top departments by usage
    """
    try:
        start_date, end_date = await get_date_range(period)

        records = await db.fetch(
            GET_TOP_DEPARTMENTS_QUERY, start_date, end_date, floor_id
        )
        logger.info("Retrieved top departments")
        return TopDepartmentsResponse(
            departments=[DepartmentUsageResponse(**dict(record)) for record in records]
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Error retrieving top departments")
        raise
