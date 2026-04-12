"""Booking rules management routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.requests import UpdateBookingRulesRequest, UpdateFloorStatusRequest
from src.models.responses import (
    AllBookingRulesResponse,
    UpdateFloorStatusResponse,
    AllFloorsResponse,
    FloorClosuresResponse,
    DeleteFloorClosureResponse,
)
from src.services.booking_rules.get_booking_rules import get_booking_rules
from src.services.booking_rules.update_booking_rules import update_booking_rules
from src.services.booking_rules.update_floor_status import update_floor_status
from src.services.booking_rules.get_all_floors import get_all_floors
from src.services.booking_rules.get_floor_closures import get_floor_closures
from src.services.booking_rules.delete_floor_closure import delete_floor_closure

router = APIRouter(prefix="/booking-rules", tags=["admin-rules"])


@router.get("", response_model=AllBookingRulesResponse)
async def get_booking_rules_endpoint(_: dict = Depends(get_current_user)):
    """Get all active booking rules."""
    try:
        return await get_booking_rules()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve booking rules")


@router.put("", response_model=AllBookingRulesResponse)
async def update_booking_rules_endpoint(
    request: UpdateBookingRulesRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update booking rules."""
    try:
        return await update_booking_rules(
            current_user["user_id"],
            request.max_booking_duration,
            request.max_extension,
            request.advance_booking_window,
            request.allow_same_day_bookings,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update booking rules")


@router.put("/floors/{floor_id}/status", response_model=UpdateFloorStatusResponse)
async def update_floor_status_endpoint(
    floor_id: str,
    request: UpdateFloorStatusRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update floor status (open/closed). Can optionally schedule a closure with dates."""
    try:
        return await update_floor_status(
            current_user["user_id"],
            floor_id,
            request.status,
            request.start_date,
            request.end_date,
            request.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update floor status")


@router.get("/floors", response_model=AllFloorsResponse)
async def get_floors_endpoint(_: dict = Depends(get_current_user)):
    """Get all floors, including their total locker count."""
    try:
        return await get_all_floors()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve floors")


@router.get("/floors/{floor_id}/closures", response_model=FloorClosuresResponse)
async def get_floor_closures_endpoint(
    floor_id: str,
    _: dict = Depends(get_current_user),
):
    """Get all active and upcoming closures for a specific floor."""
    try:
        return await get_floor_closures(floor_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve floor closures")


@router.delete("/closures/{closure_id}", response_model=DeleteFloorClosureResponse)
async def delete_floor_closure_endpoint(
    closure_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a specific floor closure."""
    try:
        return await delete_floor_closure(current_user["user_id"], closure_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete floor closure")
