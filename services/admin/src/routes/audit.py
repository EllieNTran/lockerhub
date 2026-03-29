"""Audit log routes."""

from fastapi import APIRouter, Depends, HTTPException, Query

from src.middleware.auth import get_current_user
from src.models.responses import AuditLogsResponse, AuditLogResponse
from src.services.audit.get_audit_logs import get_audit_logs

router = APIRouter(prefix="/audit-logs", tags=["admin-audit"])


@router.get("", response_model=AuditLogsResponse)
async def get_audit_logs_endpoint(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(12, ge=1, le=100, description="Records per page"),
    action: str = Query(None, description="Filter by action"),
    entity_type: str = Query(None, description="Filter by entity type"),
    user_role: str = Query(None, description="Filter by user role"),
    search: str = Query(None, description="Search by user name or entity reference"),
    _: dict = Depends(get_current_user),
):
    """Get audit logs with pagination and optional filters."""
    try:
        return await get_audit_logs(page, limit, action, entity_type, user_role, search)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve audit logs")
