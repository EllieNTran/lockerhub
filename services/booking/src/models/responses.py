"""Response models for booking endpoints."""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BookingResponse(BaseModel):
    """Response model for a single booking."""

    booking_id: UUID
    user_id: UUID
    locker_id: UUID
    start_date: date
    end_date: date
    status: str
    special_request_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookingListResponse(BaseModel):
    """Response model for a list of bookings."""

    bookings: List[BookingResponse]


class CreateBookingResponse(BaseModel):
    """Response model for creating a booking."""

    booking_id: UUID


class UpdateBookingResponse(BaseModel):
    """Response model for updating a booking."""

    booking_id: UUID
    message: str = "Booking updated"


class DeleteBookingResponse(BaseModel):
    """Response model for deleting a booking."""

    booking_id: UUID
    message: str = "Booking deleted"


class ExtendBookingResponse(BaseModel):
    """Response model for extending a booking."""

    request_id: int
    status: str


class LockerResponse(BaseModel):
    """Response model for a locker."""

    locker_id: UUID
    locker_number: str
    floor_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AvailableLockersResponse(BaseModel):
    """Response model for available lockers."""

    lockers: List[LockerResponse]


class AvailabilityResponse(BaseModel):
    """Response model for locker availability check."""

    locker_id: str
    start_date: str
    end_date: str
    available: bool
