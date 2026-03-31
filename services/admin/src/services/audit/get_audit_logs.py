"""Get audit logs with pagination."""

from typing import Optional, Tuple, List
from src.logger import logger
from src.connectors.db import db
from src.models.responses import AuditLogsResponse, AuditLogResponse


def build_audit_logs_query(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_role: Optional[str] = None,
    search: Optional[str] = None,
) -> Tuple[str, str, List]:
    """Build audit logs query with dynamic filters.

    Args:
        action: Filter by audit action
        entity_type: Filter by entity type
        user_role: Filter by user role
        search: Search by user name or entity reference

    Returns:
        Tuple of (select_query, count_query, params)
    """
    where_conditions = []
    params = []
    param_counter = 1

    if action:
        where_conditions.append(f"a.action = ${param_counter}::lockerhub.audit_action")
        params.append(action)
        param_counter += 1

    if entity_type:
        where_conditions.append(
            f"a.entity_type = ${param_counter}::lockerhub.entity_type"
        )
        params.append(entity_type)
        param_counter += 1

    if user_role:
        if user_role == "system":
            where_conditions.append("u.role IS NULL")
        else:
            where_conditions.append(f"u.role = ${param_counter}::lockerhub.user_role")
            params.append(user_role)
            param_counter += 1

    if search:
        search_pattern = f"%{search}%"
        where_conditions.append(
            f"(CASE WHEN u.user_id IS NULL THEN NULL ELSE CONCAT(u.first_name, ' ', u.last_name) END ILIKE ${param_counter} OR a.reference ILIKE ${param_counter})"
        )
        params.append(search_pattern)
        param_counter += 1

    where_clause = " AND " + " AND ".join(where_conditions) if where_conditions else ""

    select_query = f"""
    SELECT 
        a.audit_log_id,
        a.user_id,
        CASE WHEN a.user_id IS NULL THEN NULL ELSE CONCAT(u.first_name, ' ', u.last_name) END as user_name,
        u.role as user_role,
        a.action,
        a.entity_type,
        a.entity_id,
        a.reference,
        a.old_value,
        a.new_value,
        a.audit_date
    FROM lockerhub.audit_logs a
    LEFT JOIN lockerhub.users u ON a.user_id = u.user_id
    WHERE 1=1{where_clause}
    ORDER BY a.audit_date DESC
    LIMIT ${param_counter} OFFSET ${param_counter + 1}
    """

    count_query = f"""
    SELECT COUNT(*) as total
    FROM lockerhub.audit_logs a
    LEFT JOIN lockerhub.users u ON a.user_id = u.user_id
    WHERE 1=1{where_clause}
    """

    return select_query, count_query, params


async def get_audit_logs(
    page: int = 1,
    limit: int = 12,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_role: Optional[str] = None,
    search: Optional[str] = None,
) -> AuditLogsResponse:
    """Get audit logs with pagination and optional filters.

    Args:
        page: Page number (1-indexed, default: 1)
        limit: Number of records per page (default: 12)
        action: Filter by audit action
        entity_type: Filter by entity type
        user_role: Filter by user role
        search: Search by user name or entity reference

    Returns:
        AuditLogsResponse with paginated audit logs
    """
    try:
        offset = (page - 1) * limit
        select_query, count_query, params = build_audit_logs_query(
            action, entity_type, user_role, search
        )

        count_result = await db.fetchrow(count_query, *params)
        total = count_result["total"]

        logs = await db.fetch(select_query, *params, limit, offset)
        total_pages = (total + limit - 1) // limit

        logger.info("Retrieved audit logs")

        return AuditLogsResponse(
            logs=[AuditLogResponse(**dict(log)) for log in logs],
            total=total,
            page=page,
            pages=total_pages,
            limit=limit,
        )

    except Exception:
        logger.error("Error fetching audit logs")
        raise
