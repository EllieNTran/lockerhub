"""Locker management routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.requests import UpdateLockerCoordinatesRequest
from src.models.responses import (
    AllLockersResponse,
    LockerStatsResponse,
    LockerStatusResponse,
)
from src.services.lockers.get_all_lockers import get_all_lockers
from src.services.lockers.get_locker_availability_stats import (
    get_locker_availability_statistics,
)
from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance
from src.services.lockers.mark_locker_available import mark_locker_available
from src.services.lockers.update_locker_coordinates import update_locker_coordinates

router = APIRouter(prefix="/lockers", tags=["admin-lockers"])


@router.get("", response_model=AllLockersResponse)
async def get_all_lockers_endpoint(_: dict = Depends(get_current_user)):
    """Get all lockers with details."""
    try:
        lockers = await get_all_lockers()
        return AllLockersResponse(lockers=lockers)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve lockers")


@router.get("/stats", response_model=LockerStatsResponse)
async def get_lockers_stats_endpoint(_: dict = Depends(get_current_user)):
    """Get locker availability statistics."""
    try:
        return await get_locker_availability_statistics()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve locker stats")


@router.post("/{locker_id}/maintenance", response_model=LockerStatusResponse)
async def mark_locker_maintenance_endpoint(
    locker_id: str,
    _: dict = Depends(get_current_user),
):
    """Mark a locker as under maintenance."""
    try:
        return await mark_locker_maintenance(locker_id)
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
        return await mark_locker_available(locker_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to mark locker as available"
        )


@router.patch("/{locker_id}/coordinates")
async def update_locker_coordinates_endpoint(
    locker_id: str,
    request: UpdateLockerCoordinatesRequest,
    _: dict = Depends(get_current_user),
):
    """Update locker coordinates (zone-relative position)."""
    try:
        result = await update_locker_coordinates(
            locker_id, request.x_coordinate, request.y_coordinate
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to update locker coordinates"
        )
