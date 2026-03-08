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

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Ensure status is valid."""
        if v not in ("approved", "rejected"):
            raise ValueError("Status must be 'approved' or 'rejected'")
        return v


class UpdateFloorStatusRequest(BaseModel):
    """Request model for updating floor status."""

    status: str = Field(..., description="Status: 'open' or 'closed'")

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
