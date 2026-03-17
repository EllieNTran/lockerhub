"""Get all users."""

from src.logger import logger
from src.connectors.db import db
from src.models.responses import UserDetailResponse

GET_ALL_USERS_QUERY = """
SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    u.staff_number,
    u.email,
    d.name as department_name
FROM lockerhub.users u
JOIN lockerhub.departments d ON u.department_id = d.department_id
ORDER BY employee_name;
"""


async def get_all_users() -> list[UserDetailResponse]:
    """Get all users with their details.

    Returns:
        A list of user details ordered by employee name
    """
    try:
        result = await db.fetch(GET_ALL_USERS_QUERY)
        logger.info("Retrieved users successfully")
        return [UserDetailResponse(**dict(row)) for row in result]
    except Exception:
        logger.error("Error fetching all users")
        raise
