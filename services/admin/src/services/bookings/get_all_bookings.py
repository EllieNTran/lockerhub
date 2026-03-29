"""Get all bookings."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import AllBookingsResponse, BookingDetailResponse

GET_ALL_BOOKINGS_QUERY = """
SELECT 
    b.booking_id,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    u.user_id,
    u.staff_number,
    d.name as department_name,
    c.name as capability_name,
    u.email,
    l.locker_number,
    f.floor_id,
    f.floor_number,
    b.start_date,
    b.end_date,
    b.status as booking_status,
    b.special_request_id,
    b.extension_request_id,
    k.key_number,
    k.status as key_status
FROM lockerhub.bookings b
INNER JOIN lockerhub.users u ON b.user_id = u.user_id
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
INNER JOIN lockerhub.floors f ON l.floor_id = f.floor_id
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
LEFT JOIN lockerhub.departments d ON u.department_id = d.department_id
LEFT JOIN lockerhub.capabilities c ON d.capability_id = c.capability_id
ORDER BY 
    CASE b.status
        WHEN 'upcoming' THEN 1
        WHEN 'active' THEN 2
        WHEN 'expired' THEN 3
        WHEN 'cancelled' THEN 4
        WHEN 'completed' THEN 5
    END,
    CASE b.status
        WHEN 'active' THEN b.end_date
        WHEN 'upcoming' THEN b.start_date
    END ASC NULLS LAST,
    CASE b.status
        WHEN 'expired' THEN b.end_date
        WHEN 'completed' THEN b.end_date
        WHEN 'cancelled' THEN b.updated_at
    END DESC NULLS LAST;
"""


async def get_all_bookings() -> AllBookingsResponse:
    """Get all bookings with employee name, locker details, and key status.

    Returns:
        AllBookingsResponse containing a list of BookingDetailResponse objects.
    """
    try:
        result = await db.fetch(GET_ALL_BOOKINGS_QUERY)
        logger.info("Retrieved bookings successfully")
        return AllBookingsResponse(
            bookings=[BookingDetailResponse(**dict(row)) for row in result]
        )
    except Exception:
        logger.error("Error fetching all bookings")
        raise
