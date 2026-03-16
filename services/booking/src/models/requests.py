"""Request models for booking endpoints."""

from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CreateBookingRequest(BaseModel):
    """Request model for creating a booking."""

    locker_id: UUID = Field(..., description="ID of the locker to book")
    start_date: date = Field(..., description="Start date of the booking (YYYY-MM-DD)")
    end_date: date = Field(..., description="End date of the booking (YYYY-MM-DD)")

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: date, info) -> date:
        """Ensure end_date is not before start_date."""
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("end_date cannot be before start_date")
        return v


class UpdateBookingRequest(BaseModel):
    """Request model for updating a booking (shorten only)."""

    new_start_date: Optional[date] = Field(
        None, description="New start date (can only move later)"
    )
    new_end_date: Optional[date] = Field(
        None, description="New end date (can only move earlier)"
    )

    @field_validator("new_end_date")
    @classmethod
    def validate_dates(cls, v: Optional[date], info) -> Optional[date]:
        """Ensure end_date is after start_date if both provided."""
        if v and "new_start_date" in info.data and info.data["new_start_date"]:
            if v <= info.data["new_start_date"]:
                raise ValueError("new_end_date must be after new_start_date")
        return v


class ExtendBookingRequest(BaseModel):
    """Request model for extending a booking."""

    new_end_date: date = Field(..., description="New end date for the booking")
