"""Booking routes."""

from fastapi import APIRouter, Depends, HTTPException, Query

from src.middleware.auth import get_current_user
from src.models.requests import (
    CreateBookingRequest,
    UpdateBookingRequest,
    ExtendBookingRequest,
)
from src.models.responses import (
    BookingResponse,
    BookingListResponse,
    CreateBookingResponse,
    UpdateBookingResponse,
    DeleteBookingResponse,
    ExtendBookingResponse,
    AvailableLockersResponse,
    AvailabilityResponse,
)
from src.services.create_booking import create_booking
from src.services.delete_booking import delete_booking
from src.services.update_booking import update_booking
from src.services.extend_booking import extend_booking
from src.services.get_booking import get_booking
from src.services.get_user_bookings import get_user_bookings
from src.services.get_available_lockers import get_available_lockers
from src.services.check_locker_availability import check_locker_availability

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/", response_model=CreateBookingResponse)
async def create_booking_endpoint(
    request: CreateBookingRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new booking."""
    try:
        booking_id = await create_booking(
            current_user["user_id"],
            str(request.locker_id),
            str(request.start_date),
            str(request.end_date),
        )
        return CreateBookingResponse(booking_id=booking_id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/", response_model=BookingListResponse)
async def get_user_bookings_endpoint(current_user: dict = Depends(get_current_user)):
    """Get all bookings for the current user."""
    try:
        bookings = await get_user_bookings(current_user["user_id"])
        return BookingListResponse(bookings=bookings)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve bookings")


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_endpoint(
    booking_id: str, current_user: dict = Depends(get_current_user)
):
    """Get a specific booking."""
    try:
        booking = await get_booking(current_user["user_id"], booking_id)
        return booking
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{booking_id}", response_model=UpdateBookingResponse)
async def update_booking_endpoint(
    booking_id: str,
    request: UpdateBookingRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update a booking (shorten only)."""
    try:
        updated_id = await update_booking(
            current_user["user_id"],
            booking_id,
            str(request.new_start_date) if request.new_start_date else None,
            str(request.new_end_date) if request.new_end_date else None,
        )
        return UpdateBookingResponse(booking_id=updated_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{booking_id}", response_model=DeleteBookingResponse)
async def delete_booking_endpoint(
    booking_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a booking."""
    try:
        deleted_id = await delete_booking(current_user["user_id"], booking_id)
        return DeleteBookingResponse(booking_id=deleted_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{booking_id}/extend", response_model=ExtendBookingResponse)
async def extend_booking_endpoint(
    booking_id: str,
    request: ExtendBookingRequest,
    current_user: dict = Depends(get_current_user),
):
    """Request to extend a booking."""
    try:
        result = await extend_booking(
            booking_id, str(request.new_end_date), current_user["user_id"]
        )
        return ExtendBookingResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/lockers/available", response_model=AvailableLockersResponse)
async def get_available_lockers_endpoint(
    floor_id: str = Query(..., description="ID of the floor"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    _: dict = Depends(get_current_user),
):
    """Get available lockers for a floor and date range."""
    try:
        lockers = await get_available_lockers(floor_id, start_date, end_date)
        return AvailableLockersResponse(lockers=lockers)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve available lockers"
        )


@router.get("/lockers/{locker_id}/availability", response_model=AvailabilityResponse)
async def check_locker_availability_endpoint(
    locker_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    _: dict = Depends(get_current_user),
):
    """Check if a locker is available for a date range."""
    try:
        is_available = await check_locker_availability(locker_id, start_date, end_date)
        return AvailabilityResponse(
            locker_id=locker_id,
            start_date=start_date,
            end_date=end_date,
            available=is_available,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to check availability")
