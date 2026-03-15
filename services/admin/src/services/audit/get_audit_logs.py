"""Get audit logs with pagination."""

from src.logger import logger
from src.connectors.db import db

GET_AUDIT_LOGS_QUERY = """
SELECT 
    a.audit_log_id,
    a.user_id,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    a.action,
    a.entity_type,
    a.entity_id,
    a.reference,
    a.old_value,
    a.new_value,
    a.audit_date
FROM lockerhub.audit_logs a
LEFT JOIN lockerhub.users u ON a.user_id = u.user_id
ORDER BY a.audit_date DESC
LIMIT $1 OFFSET $2;
"""

GET_AUDIT_LOGS_COUNT_QUERY = """
SELECT COUNT(*) as total
FROM lockerhub.audit_logs;
"""


async def get_audit_logs(page: int = 1, limit: int = 12) -> dict:
    """Get audit logs with pagination.

    Args:
        page: Page number (1-indexed, default: 1)
        limit: Number of records per page (default: 12)

    Returns:
        A dictionary containing:
        - logs: List of audit log records
        - total: Total number of audit logs
        - page: Current page number
        - pages: Total number of pages
        - limit: Records per page
    """
    try:
        offset = (page - 1) * limit

        count_result = await db.fetchrow(GET_AUDIT_LOGS_COUNT_QUERY)
        total = count_result["total"]

        logs = await db.fetch(GET_AUDIT_LOGS_QUERY, limit, offset)
        total_pages = (total + limit - 1) // limit

        logger.info("Retrieved audit logs")

        return {
            "logs": logs,
            "total": total,
            "page": page,
            "pages": total_pages,
            "limit": limit,
        }

    except Exception:
        logger.error("Error fetching audit logs")
        raise
