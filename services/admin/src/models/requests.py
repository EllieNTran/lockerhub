"""Request models for admin endpoints."""

from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CreateBookingRequest(BaseModel):
    """Request model for admin creating a booking for a user."""

    user_id: UUID = Field(..., description="ID of the user to create booking for")
    locker_id: UUID = Field(..., description="ID of the locker to book")
    start_date: date = Field(..., description="Start date of the booking (YYYY-MM-DD)")
    end_date: date = Field(..., description="End date of the booking (YYYY-MM-DD)")

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: date, info) -> date:
        """Ensure end_date is after start_date."""
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


class ReviewSpecialRequestRequest(BaseModel):
    """Request model for reviewing a special request."""

    status: str = Field(..., description="Status: 'approved' or 'rejected'")
    reason: Optional[str] = Field(
        None, description="Reason for rejection (required if rejecting)"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Ensure status is valid."""
        if v not in ("approved", "rejected"):
            raise ValueError("Status must be 'approved' or 'rejected'")
        return v

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: Optional[str], info) -> Optional[str]:
        """Ensure reason is provided when rejecting."""
        if "status" in info.data and info.data["status"] == "rejected" and not v:
            raise ValueError("Reason is required when rejecting a request")
        return v


class UpdateFloorStatusRequest(BaseModel):
    """Request model for updating floor status."""

    status: str = Field(..., description="Status: 'open' or 'closed'")
    start_date: Optional[date] = Field(
        None, description="Start date for scheduled closure (only when closing)"
    )
    end_date: Optional[date] = Field(
        None, description="End date for scheduled closure (only when closing)"
    )
    reason: Optional[str] = Field(None, description="Reason for closure")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Ensure status is valid."""
        if v not in ("open", "closed"):
            raise ValueError("Status must be 'open' or 'closed'")
        return v


class UpdateBookingRulesRequest(BaseModel):
    """Request model for updating booking rules."""

    max_booking_duration: Optional[int] = Field(
        None, description="Maximum duration of a booking in days", gt=0
    )
    max_extension: Optional[int] = Field(
        None, description="Maximum number of days a booking can be extended", ge=0
    )
    advance_booking_window: Optional[int] = Field(
        None,
        description="Maximum number of days in advance a booking can be made",
        gt=0,
    )
    allow_same_day_bookings: Optional[bool] = Field(
        None, description="Whether same-day bookings are allowed"
    )


class UpdateLockerCoordinatesRequest(BaseModel):
    """Request model for updating locker coordinates."""

    x_coordinate: int = Field(..., description="X coordinate relative to zone", ge=0)
    y_coordinate: int = Field(..., description="Y coordinate relative to zone", ge=0)


class CreateLockerRequest(BaseModel):
    """Request model for creating a new locker."""

    locker_number: str = Field(
        ..., description="Unique locker number", min_length=1, max_length=20
    )
    floor_id: UUID = Field(..., description="ID of the floor where locker is located")
    location: Optional[str] = Field(
        None, description="Location description", max_length=30
    )
    x_coordinate: Optional[int] = Field(
        None, description="X coordinate relative to zone", ge=0
    )
    y_coordinate: Optional[int] = Field(
        None, description="Y coordinate relative to zone", ge=0
    )
    key_number: str = Field(
        ..., description="Key number for this locker", min_length=1, max_length=6
    )


class CreateKeyRequest(BaseModel):
    """Request model for creating a key for an existing locker."""

    key_number: str = Field(
        ..., description="Unique key number", min_length=1, max_length=6
    )
    locker_id: UUID = Field(..., description="ID of the locker this key belongs to")
