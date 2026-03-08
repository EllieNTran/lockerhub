"""Audit log routes."""

from fastapi import APIRouter, Depends, HTTPException, Query

from src.middleware.auth import get_current_user
from src.models.responses import AuditLogsResponse, AuditLogResponse
from src.services.audit.get_audit_logs import get_audit_logs

router = APIRouter(prefix="/audit-logs", tags=["admin-audit"])


@router.get("/", response_model=AuditLogsResponse)
async def get_audit_logs_endpoint(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(12, ge=1, le=100, description="Records per page"),
    _: dict = Depends(get_current_user),
):
    """Get audit logs with pagination."""
    try:
        result = await get_audit_logs(page, limit)
        return AuditLogsResponse(
            logs=[AuditLogResponse(**log) for log in result["logs"]],
            total=result["total"],
            page=result["page"],
            pages=result["pages"],
            limit=result["limit"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve audit logs")
