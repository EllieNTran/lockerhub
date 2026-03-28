"""Response models for analytics endpoints."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DayLockerUsageResponse(BaseModel):
    """Response model for a day of locker usage."""

    usage_date: date
    occupied_count: int

    model_config = ConfigDict(from_attributes=True)


class LockerUsageResponse(BaseModel):
    """Response model for full locker usage data."""

    locker_usage: list[DayLockerUsageResponse]


class DepartmentUsageResponse(BaseModel):
    """Response model for department locker usage."""

    department_id: UUID
    department_name: str
    occupied_count: int

    model_config = ConfigDict(from_attributes=True)


class TopDepartmentsResponse(BaseModel):
    """Response model for top departments by locker usage."""

    departments: list[DepartmentUsageResponse]


class FloorUsageResponse(BaseModel):
    """Response model for floor locker usage."""

    floor_id: UUID
    floor_number: str
    occupied_count: int

    model_config = ConfigDict(from_attributes=True)


class TopFloorsResponse(BaseModel):
    """Response model for top floors by locker usage."""

    floors: list[FloorUsageResponse]
