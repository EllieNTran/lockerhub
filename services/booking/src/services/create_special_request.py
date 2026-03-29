"""Create a special request."""

from datetime import date
from typing import Optional

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import CreateSpecialRequestResponse

CREATE_SPECIAL_REQUEST_QUERY = """
INSERT INTO lockerhub.requests (
    user_id,
    floor_id,
    locker_id,
    start_date,
    end_date,
    request_type,
    justification
)
VALUES ($1, $2, $3, $4, $5, 'special', $6)
RETURNING request_id
"""

GET_USER_DETAILS_QUERY = """
SELECT u.email, u.first_name, f.floor_number
FROM lockerhub.users u
CROSS JOIN lockerhub.floors f
WHERE u.user_id = $1
AND f.floor_id = $2
"""


async def create_special_request(
    user_id: str,
    floor_id: str,
    start_date: date,
    justification: str,
    end_date: Optional[date] = None,
    locker_id: Optional[str] = None,
) -> CreateSpecialRequestResponse:
    """
    Create a special request for locker allocation.

    Args:
        user_id: ID of the user making the request
        floor_id: ID of the floor (required for special requests)
        start_date: Start date of the requested allocation
        justification: Reason for the special request
        end_date: End date of the allocation. If None, requesting permanent allocation
        locker_id: Optional preferred locker ID

    Returns:
        CreateSpecialRequestResponse with request_id

    Raises:
        ValueError: If the request cannot be created
    """
    try:
        request_id = await db.fetchval(
            CREATE_SPECIAL_REQUEST_QUERY,
            user_id,
            floor_id,
            locker_id,
            start_date,
            end_date,
            justification,
        )

        allocation_type = "permanent" if end_date is None else "long-term"

        user_details = await db.fetchrow(GET_USER_DETAILS_QUERY, user_id, floor_id)

        await NotificationsServiceClient().post(
            "/special-request/submitted",
            {
                "userId": user_id,
                "email": user_details["email"],
                "name": user_details["first_name"],
                "floorNumber": user_details["floor_number"],
                "endDate": str(end_date) if end_date else None,
                "requestId": request_id,
                "userSpecialRequestsPath": "/user/special-request",
                "adminSpecialRequestsPath": "/admin/special-requests",
            },
        )

        logger.info(f"Created special request ({allocation_type}) with ID {request_id}")

        return CreateSpecialRequestResponse(request_id=request_id)
    except Exception:
        logger.error("Error creating special request")
        raise
