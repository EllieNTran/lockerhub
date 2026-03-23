"""Booking routes."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.logger import logger
from src.middleware.auth import get_current_user
from src.middleware.api_key import verify_api_key
from src.models.requests import (
    CreateBookingRequest,
    UpdateBookingRequest,
    ExtendBookingRequest,
    JoinFloorQueueRequest,
    CreateSpecialRequestRequest,
)
from src.models.responses import (
    BookingResponse,
    BookingListResponse,
    CreateBookingResponse,
    CreateSpecialRequestResponse,
    SpecialRequestsListResponse,
    UpdateBookingResponse,
    ExtendBookingResponse,
    AvailableLockersResponse,
    AvailabilityResponse,
    FloorsResponse,
    JoinFloorQueueResponse,
    ProcessFloorQueuesResponse,
    DeleteSpecialRequestResponse,
)
from src.services.create_booking import create_booking
from src.services.cancel_booking import cancel_booking
from src.services.update_booking import update_booking
from src.services.extend_booking import extend_booking
from src.services.get_booking import get_booking
from src.services.get_user_bookings import get_user_bookings
from src.services.get_available_lockers import get_available_lockers
from src.services.check_locker_availability import check_locker_availability
from src.services.get_floors import get_floors
from src.services.join_floor_queue import join_floor_queue
from src.services.process_floor_queues import process_floor_queues
from src.services.create_special_request import create_special_request
from src.services.get_user_special_requests import get_user_special_requests
from src.services.delete_special_request import delete_special_request

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=CreateBookingResponse)
async def create_booking_endpoint(
    request: CreateBookingRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new booking."""
    try:
        result = await create_booking(
            current_user["user_id"],
            str(request.locker_id),
            request.start_date,
            request.end_date,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("", response_model=BookingListResponse)
async def get_user_bookings_endpoint(current_user: dict = Depends(get_current_user)):
    """Get all bookings for the current user."""
    try:
        bookings = await get_user_bookings(current_user["user_id"])
        return BookingListResponse(bookings=bookings)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve bookings")


@router.get("/floors", response_model=FloorsResponse)
async def get_floors_endpoint(_: dict = Depends(get_current_user)):
    """Get all open floors with their IDs and numbers."""
    try:
        floors = await get_floors()
        logger.info("Floors fetched")
        return FloorsResponse(floors=floors)
    except Exception:
        logger.error("Error in get_floors_endpoint")
        raise HTTPException(status_code=500, detail="Failed to retrieve floors")


@router.delete(
    "/special-requests/{request_id}", response_model=DeleteSpecialRequestResponse
)
async def delete_special_request_endpoint(
    request_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Delete a special request."""
    try:
        result = await delete_special_request(current_user["user_id"], request_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/special-requests", response_model=CreateSpecialRequestResponse)
async def create_special_request_endpoint(
    request: CreateSpecialRequestRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a special request for locker allocation."""
    try:
        result = await create_special_request(
            current_user["user_id"],
            str(request.floor_id),
            request.start_date,
            request.justification,
            request.end_date,
            str(request.locker_id) if request.locker_id else None,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/special-requests", response_model=SpecialRequestsListResponse)
async def get_special_requests_endpoint(current_user: dict = Depends(get_current_user)):
    """Get all special requests for the current user."""
    try:
        return await get_user_special_requests(current_user["user_id"])
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve special requests"
        )


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
        result = await update_booking(
            current_user["user_id"],
            booking_id,
            str(request.new_start_date) if request.new_start_date else None,
            str(request.new_end_date) if request.new_end_date else None,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{booking_id}/cancel", response_model=UpdateBookingResponse)
async def cancel_booking_endpoint(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Cancel a booking."""
    try:
        result = await cancel_booking(current_user["user_id"], booking_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/lockers/available", response_model=AvailableLockersResponse)
async def get_available_lockers_endpoint(
    floor_id: str = Query(..., description="ID of the floor"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    _: dict = Depends(get_current_user),
):
    """Get all lockers for a given floor with availability status for a date range."""
    try:
        lockers = await get_available_lockers(floor_id, start_date, end_date)
        return AvailableLockersResponse(lockers=lockers)
    except Exception:
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
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to check availability")


@router.post("/waitlist/join", response_model=JoinFloorQueueResponse)
async def join_floor_queue_endpoint(
    request: JoinFloorQueueRequest,
    current_user: dict = Depends(get_current_user),
):
    """Join a floor queue (waitlist) for a floor."""
    try:
        result = await join_floor_queue(
            current_user["user_id"],
            str(request.floor_id),
            request.start_date,
            request.end_date,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/queues/process", response_model=ProcessFloorQueuesResponse)
async def process_floor_queues_endpoint(_: bool = Depends(verify_api_key)):
    """
    Process all floor queues and auto-allocate available lockers.

    This endpoint should be called by a scheduled job (cron) to automatically
    allocate lockers to users in the waitlist when lockers become available.

    Requires X-API-Key header for authentication.
    """
    try:
        result = await process_floor_queues()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
