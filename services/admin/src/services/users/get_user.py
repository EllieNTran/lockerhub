"""Get a user."""

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
WHERE u.user_id = $1;
"""


async def get_user(user_id: str) -> UserDetailResponse:
    """Get a user by their ID.

    Args:
        user_id: The ID of the user to retrieve.

    Returns:
        The details of the specified user.
        
    Raises:
        ValueError: If user is not found.
    """
    try:
        result = await db.fetch(GET_ALL_USERS_QUERY, user_id)
        if not result:
            logger.warning("User not found")
            raise ValueError("User not found")
        logger.info("Retrieved user successfully")
        return UserDetailResponse(**dict(result[0]))
    except ValueError:
        raise
    except Exception:
        logger.error("Error fetching user")
        raise
