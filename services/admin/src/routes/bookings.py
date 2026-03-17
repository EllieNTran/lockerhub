"""Booking management routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.requests import CreateBookingRequest
from src.models.responses import (
    CreateBookingResponse,
    CancelBookingResponse,
    AllBookingsResponse,
)
from src.services.bookings.create_booking import create_booking
from src.services.bookings.cancel_booking import cancel_booking
from src.services.bookings.get_all_bookings import get_all_bookings

from src.middleware.auth import get_current_user
from src.models.responses import KeyHandoverResponse, KeyReturnResponse
from src.services.bookings.confirm_key_handover import (
    confirm_key_handover,
)
from src.services.bookings.confirm_key_return import confirm_key_return

router = APIRouter(prefix="/bookings", tags=["admin-bookings"])


@router.post("", response_model=CreateBookingResponse)
async def create_booking_endpoint(
    request: CreateBookingRequest,
    _: dict = Depends(get_current_user),
):
    """Create a new booking for a user."""
    try:
        return await create_booking(
            str(request.user_id),
            str(request.locker_id),
            request.start_date,
            request.end_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create booking")


@router.get("", response_model=AllBookingsResponse)
async def get_all_bookings_endpoint(_: dict = Depends(get_current_user)):
    """Get all bookings with employee and locker details."""
    try:
        bookings = await get_all_bookings()
        return AllBookingsResponse(bookings=bookings)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve bookings")


@router.post("/{booking_id}/cancel", response_model=CancelBookingResponse)
async def cancel_booking_endpoint(
    booking_id: str,
    _: dict = Depends(get_current_user),
):
    """Cancel a booking."""
    try:
        cancelled_id = await cancel_booking(booking_id)
        return CancelBookingResponse(booking_id=cancelled_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to cancel booking")


@router.post("/{booking_id}/handover", response_model=KeyHandoverResponse)
async def confirm_key_handover_endpoint(
    booking_id: str,
    _: dict = Depends(get_current_user),
):
    """Confirm key handover to employee."""
    try:
        result = await confirm_key_handover(booking_id)
        return KeyHandoverResponse(
            booking_id=result["booking_id"],
            key_number=result["key_number"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to confirm key handover")


@router.post("/{booking_id}/return", response_model=KeyReturnResponse)
async def confirm_key_return_endpoint(
    booking_id: str,
    _: dict = Depends(get_current_user),
):
    """Confirm key return from employee."""
    try:
        result = await confirm_key_return(booking_id)
        return KeyReturnResponse(
            booking_id=result["booking_id"],
            key_number=result["key_number"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to confirm key return")
