"""Get all bookings."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import BookingDetailResponse

GET_ALL_BOOKINGS_QUERY = """
SELECT 
    b.booking_id,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    u.staff_number,
    d.name as department_name,
    u.email,
    l.locker_number,
    f.floor_number,
    b.start_date,
    b.end_date,
    b.status as booking_status,
    k.status as key_status
FROM lockerhub.bookings b
INNER JOIN lockerhub.users u ON b.user_id = u.user_id
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
INNER JOIN lockerhub.floors f ON l.floor_id = f.floor_id
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
LEFT JOIN lockerhub.departments d ON u.department_id = d.department_id
ORDER BY 
    CASE b.status
        WHEN 'expired' THEN 1
        WHEN 'upcoming' THEN 2
        WHEN 'active' THEN 3
        WHEN 'cancelled' THEN 4
        WHEN 'completed' THEN 5
    END,
    b.start_date DESC;
"""


async def get_all_bookings() -> list[BookingDetailResponse]:
    """Get all bookings with employee name, locker details, and key status.

    Returns:
        A list of booking details ordered by status priority
    """
    try:
        result = await db.fetch(GET_ALL_BOOKINGS_QUERY)
        logger.info("Retrieved bookings successfully")
        return [BookingDetailResponse(**dict(row)) for row in result]
    except Exception:
        logger.error("Error fetching all bookings")
        raise
