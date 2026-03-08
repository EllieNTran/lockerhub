"""Get all special requests."""

from src.logger import logger
from src.connectors.db import db

GET_ALL_SPECIAL_REQUESTS_QUERY = """
SELECT 
    r.request_id,
    r.user_id,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    u.staff_number,
    d.name as department_name,
    r.floor_id,
    f.number as floor_number,
    r.locker_id,
    r.booking_id,
    r.start_date,
    r.end_date,
    r.request_type,
    r.justification,
    r.status,
    r.created_at,
    r.reviewed_at,
    r.reviewed_by
FROM lockerhub.requests r
INNER JOIN lockerhub.users u ON r.user_id = u.user_id
LEFT JOIN lockerhub.departments d ON u.department_id = d.department_id
LEFT JOIN lockerhub.floors f ON r.floor_id = f.floor_id
WHERE r.request_type = 'special'
ORDER BY 
    CASE r.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'active' THEN 3
        WHEN 'rejected' THEN 4
        ELSE 5
    END,
    r.created_at DESC;
"""


async def get_all_special_requests():
    """Get all special requests.

    Returns:
        A list of dictionaries, each containing a special request.
    """
    try:
        result = await db.fetch(GET_ALL_SPECIAL_REQUESTS_QUERY)
        logger.info(f"Retrieved {len(result)} special requests")
        return result
    except Exception as e:
        logger.error(f"Error fetching special requests: {e}")
        raise
