"""Create a special request."""

from datetime import date
from typing import Optional

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import CreateSpecialRequestResponse

CREATE_SPECIAL_REQUEST_WITH_DETAILS_QUERY = """
WITH new_request AS (
    INSERT INTO lockerhub.requests (
        user_id,
        floor_id,
        locker_id,
        start_date,
        end_date,
        request_type,
        justification
    )
    VALUES ($1, $2, $3, $4, $5, 'special'::lockerhub.request_type, $6)
    RETURNING request_id, user_id, floor_id
)
SELECT 
    nr.request_id,
    u.email,
    u.first_name,
    f.floor_number
FROM new_request nr
JOIN lockerhub.users u ON nr.user_id = u.user_id
JOIN lockerhub.floors f ON nr.floor_id = f.floor_id
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
        result = await db.fetchrow(
            CREATE_SPECIAL_REQUEST_WITH_DETAILS_QUERY,
            user_id,
            floor_id,
            locker_id,
            start_date,
            end_date,
            justification,
        )

        if not result:
            logger.error("Failed to create special request")
            raise ValueError("Failed to create special request")

        request_id = result["request_id"]
        allocation_type = "permanent" if end_date is None else "long-term"

        await NotificationsServiceClient().post(
            "/special-request/submitted",
            {
                "userId": user_id,
                "email": result["email"],
                "name": result["first_name"],
                "floorNumber": result["floor_number"],
                "endDate": str(end_date) if end_date else None,
                "requestId": request_id,
                "userSpecialRequestsPath": "/user/special-request",
                "adminSpecialRequestsPath": "/admin/special-requests",
            },
        )

        logger.info(f"Created special request ({allocation_type}) with ID {request_id}")

        return CreateSpecialRequestResponse(request_id=request_id)
    except ValueError:
        raise
    except Exception:
        logger.error("Error creating special request")
        raise
