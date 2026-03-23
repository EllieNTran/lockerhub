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
    locker_number: str
    floor_number: str
    start_date: date
    end_date: Optional[date] = None
    status: str
    special_request_id: Optional[int] = None
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


class ExtendBookingResponse(BaseModel):
    """Response model for extending a booking."""

    request_id: int
    status: str


class CreateSpecialRequestResponse(BaseModel):
    """Response model for a special request."""

    request_id: int


class SpecialRequestResponse(BaseModel):
    """Response model for a special request."""

    request_id: int
    user_id: UUID
    floor_id: UUID
    locker_id: Optional[UUID] = None
    start_date: date
    end_date: Optional[date] = None
    request_type: str
    justification: str
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UUID] = None
    floor_number: str
    locker_number: Optional[str] = None


class SpecialRequestsListResponse(BaseModel):
    """Response model for a list of special requests."""

    requests: List[SpecialRequestResponse]


class DeleteSpecialRequestResponse(BaseModel):
    """Response model for deleting a special request."""

    request_id: int


class JoinFloorQueueResponse(BaseModel):
    """Response model for joining a floor queue."""

    floor_queue_id: int
    request_id: int
    floor_number: str


class ProcessFloorQueuesResponse(BaseModel):
    """Response model for processing floor queues."""

    success: bool
    allocations_made: int
    message: str


class LockerResponse(BaseModel):
    """Response model for a locker."""

    locker_id: UUID
    locker_number: str
    floor_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AvailableLockerResponse(BaseModel):
    """Response model for a locker with availability status."""

    locker_id: UUID
    locker_number: str
    floor_id: UUID
    location: Optional[str] = None
    status: str
    x_coordinate: Optional[int] = None
    y_coordinate: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_available: bool
    is_permanently_allocated: bool

    model_config = ConfigDict(from_attributes=True)


class AvailableLockersResponse(BaseModel):
    """Response model for available lockers."""

    lockers: List[AvailableLockerResponse]


class AvailabilityResponse(BaseModel):
    """Response model for locker availability check."""

    locker_id: str
    start_date: str
    end_date: str
    available: bool


class FloorResponse(BaseModel):
    """Response model for a floor."""

    floor_id: UUID
    floor_number: str
    status: str
    created_at: datetime
    updated_at: datetime


class FloorsResponse(BaseModel):
    """Response model for list of floors."""

    floors: List[FloorResponse]
