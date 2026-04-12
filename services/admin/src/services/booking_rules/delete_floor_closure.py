"""Delete a specific floor closure."""

from uuid import UUID
from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import DeleteFloorClosureResponse

DELETE_FLOOR_CLOSURE_QUERY = """
WITH deleted_closure AS (
    DELETE FROM lockerhub.floor_closures
    WHERE closure_id = $1
    RETURNING closure_id, floor_id, start_date, end_date, reason
)
SELECT 
    dc.closure_id,
    dc.floor_id,
    dc.start_date,
    dc.end_date,
    dc.reason,
    f.floor_number
FROM deleted_closure dc
JOIN lockerhub.floors f ON dc.floor_id = f.floor_id
"""


async def delete_floor_closure(
    user_id: str, closure_id: str
) -> DeleteFloorClosureResponse:
    """Delete a specific floor closure.

    Args:
        user_id: The ID of the admin deleting the closure
        closure_id: The ID of the closure to delete

    Returns:
        The deleted closure information
    """
    try:
        deleted = await db.fetchrow(DELETE_FLOOR_CLOSURE_QUERY, UUID(closure_id))

        if not deleted:
            logger.warning("Floor closure not found")
            raise ValueError("Floor closure not found")

        start_date = deleted["start_date"].strftime("%d %b %Y")
        end_date_str = (
            deleted["end_date"].strftime("%d %b %Y")
            if deleted["end_date"]
            else "indefinite"
        )

        if deleted["end_date"]:
            title = f"Floor {deleted['floor_number']} Closure Cancelled"
            caption = f"The scheduled closure from {start_date} to {end_date_str} has been cancelled."
        else:
            title = f"Floor {deleted['floor_number']} Indefinite Closure Cancelled"
            caption = (
                f"The indefinite closure starting {start_date} has been cancelled."
            )

        await NotificationsServiceClient().post(
            "/",
            {
                "title": title,
                "adminTitle": f"Floor {deleted['floor_number']} closure cancelled",
                "caption": caption,
                "type": "info",
                "entityType": "floor",
                "scope": "floor",
                "floorId": str(deleted["floor_id"]),
                "createdBy": str(user_id),
            },
        )

        logger.info("Deleted floor closure")
        return DeleteFloorClosureResponse(
            closure_id=deleted["closure_id"],
            floor_id=deleted["floor_id"],
            message="Floor closure deleted successfully",
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Error deleting floor closure")
        raise
