"""Response models for analytics endpoints."""

from datetime import date

from pydantic import BaseModel, ConfigDict


class DayLockerUsageResponse(BaseModel):
    """Response model for a day of locker usage."""

    usage_date: date
    occupied_count: int

    model_config = ConfigDict(from_attributes=True)


class FullLockerUsageResponse(BaseModel):
    """Response model for full locker usage data."""

    locker_usage: list[DayLockerUsageResponse]
