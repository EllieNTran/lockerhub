"""Locker management routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.responses import (
    AllLockersResponse,
    LockerStatsResponse,
    LockerStatusResponse,
    LockerResponse,
)
from src.services.lockers.get_all_lockers import get_all_lockers
from src.services.lockers.get_locker_availability_stats import (
    get_locker_availability_statistics,
)
from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance
from src.services.lockers.mark_locker_available import mark_locker_available

router = APIRouter(prefix="/lockers", tags=["admin-lockers"])


@router.get("/", response_model=AllLockersResponse)
async def get_all_lockers_endpoint(_: dict = Depends(get_current_user)):
    """Get all lockers with details."""
    try:
        lockers = await get_all_lockers()
        return AllLockersResponse(
            lockers=[LockerResponse(**locker) for locker in lockers]
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve lockers")


@router.get("/stats", response_model=LockerStatsResponse)
async def get_lockers_stats_endpoint(_: dict = Depends(get_current_user)):
    """Get locker availability statistics."""
    try:
        stats = await get_locker_availability_statistics()
        return LockerStatsResponse(**stats)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve locker stats")


@router.post("/{locker_id}/maintenance", response_model=LockerStatusResponse)
async def mark_locker_maintenance_endpoint(
    locker_id: str,
    _: dict = Depends(get_current_user),
):
    """Mark a locker as under maintenance."""
    try:
        result = await mark_locker_maintenance(locker_id)
        return LockerStatusResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to mark locker as maintenance"
        )


@router.post("/{locker_id}/available", response_model=LockerStatusResponse)
async def mark_locker_available_endpoint(
    locker_id: str,
    _: dict = Depends(get_current_user),
):
    """Mark a locker as available (repaired)."""
    try:
        result = await mark_locker_available(locker_id)
        return LockerStatusResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to mark locker as available"
        )
