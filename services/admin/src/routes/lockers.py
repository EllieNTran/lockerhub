"""Locker management routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.requests import (
    UpdateLockerCoordinatesRequest,
    CreateLockerRequest,
    CreateKeyRequest,
)
from src.models.responses import (
    AllKeysResponse,
    AllLockersResponse,
    LockerStatsResponse,
    LockerStatusResponse,
    CreateLockerResponse,
    CreateKeyResponse,
)
from src.services.lockers.get_all_lockers import get_all_lockers
from src.services.lockers.get_locker_availability_stats import (
    get_locker_availability_statistics,
)
from src.services.lockers.mark_locker_maintenance import mark_locker_maintenance
from src.services.lockers.mark_locker_available import mark_locker_available
from src.services.lockers.report_lost_key import report_lost_key
from src.services.lockers.order_replacement_key import order_replacement_key
from src.services.lockers.update_locker_coordinates import update_locker_coordinates
from src.services.lockers.create_locker import create_locker
from src.services.lockers.create_locker_key import create_locker_key
from src.services.lockers.get_all_keys import get_all_keys

router = APIRouter(prefix="/lockers", tags=["admin-lockers"])


@router.get("", response_model=AllLockersResponse)
async def get_all_lockers_endpoint(_: dict = Depends(get_current_user)):
    """Get all lockers with details."""
    try:
        return await get_all_lockers()
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


@router.post("/{locker_id}/lost-key", response_model=LockerStatusResponse)
async def report_lost_key_endpoint(
    locker_id: str,
    _: dict = Depends(get_current_user),
):
    """Report a lost key and mark locker as under maintenance."""
    try:
        return await report_lost_key(locker_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to report lost key")


@router.post("/{locker_id}/order-replacement-key", response_model=LockerStatusResponse)
async def order_replacement_key_endpoint(
    locker_id: str,
    _: dict = Depends(get_current_user),
):
    """Order a replacement key for a locker with lost key."""
    try:
        return await order_replacement_key(locker_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to order replacement key")


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


@router.post("", response_model=CreateLockerResponse)
async def create_locker_endpoint(
    request: CreateLockerRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new locker with a key."""
    try:
        return await create_locker(
            locker_number=request.locker_number,
            floor_id=str(request.floor_id),
            key_number=request.key_number,
            user_id=current_user["user_id"],
            location=request.location,
            x_coordinate=request.x_coordinate,
            y_coordinate=request.y_coordinate,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "duplicate key" in error_msg.lower():
            if "locker_number" in error_msg:
                raise HTTPException(
                    status_code=409, detail="Locker number already exists"
                )
            elif "key_number" in error_msg:
                raise HTTPException(status_code=409, detail="Key number already exists")
        raise HTTPException(status_code=500, detail="Failed to create locker")


@router.post("/keys", response_model=CreateKeyResponse)
async def create_key_endpoint(
    request: CreateKeyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a key for an existing locker."""
    try:
        return await create_locker_key(
            key_number=request.key_number,
            locker_id=str(request.locker_id),
            user_id=current_user["user_id"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "duplicate key" in error_msg.lower() and "key_number" in error_msg:
            raise HTTPException(status_code=409, detail="Key number already exists")
        raise HTTPException(status_code=500, detail="Failed to create key")


@router.get("/keys", response_model=AllKeysResponse)
async def get_all_keys_endpoint(_: dict = Depends(get_current_user)):
    """Get all keys."""
    try:
        return await get_all_keys()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve keys")
