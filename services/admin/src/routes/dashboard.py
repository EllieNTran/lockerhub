"""Dashboard routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.responses import (
    DashboardStatsResponse,
    AllFloorsUtilizationResponse,
    RecentActivityResponse,
)
from src.services.dashboard.get_dashboard_stats import get_dashboard_stats
from src.services.dashboard.get_floor_lockers_util import get_floor_lockers_util
from src.services.dashboard.get_recent_activity import get_recent_activity

router = APIRouter(prefix="/dashboard", tags=["admin-dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats_endpoint(_: dict = Depends(get_current_user)):
    """Get dashboard statistics."""
    try:
        return await get_dashboard_stats()
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve dashboard stats"
        )


@router.get("/floors/utilization", response_model=AllFloorsUtilizationResponse)
async def get_floors_utilization_endpoint(_: dict = Depends(get_current_user)):
    """Get locker utilization for all floors."""
    try:
        floors = await get_floor_lockers_util()
        return AllFloorsUtilizationResponse(floors=floors)
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve floor utilization"
        )


@router.get("/recent-activity", response_model=RecentActivityResponse)
async def get_recent_activity_endpoint(_: dict = Depends(get_current_user)):
    """Get recent activity from notifications."""
    try:
        activities = await get_recent_activity()
        return RecentActivityResponse(activities=activities)
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve recent activity"
        )
