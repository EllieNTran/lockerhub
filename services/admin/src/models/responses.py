"""Response models for admin endpoints."""

from datetime import date, datetime
from typing import List, Optional, Any, Dict
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CreateBookingResponse(BaseModel):
    """Response model for creating a booking."""

    booking_id: UUID


class CancelBookingResponse(BaseModel):
    """Response model for cancelling a booking."""

    booking_id: UUID
    message: str = "Booking cancelled"


class BookingDetailResponse(BaseModel):
    """Response model for detailed booking information."""

    booking_id: UUID
    user_id: UUID
    employee_name: str
    staff_number: str
    capability_name: Optional[str]
    department_name: Optional[str]
    email: str
    locker_number: str
    floor_id: UUID
    floor_number: str
    start_date: date
    end_date: Optional[date] = None
    booking_status: str
    key_number: Optional[str]
    key_status: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class AllBookingsResponse(BaseModel):
    """Response model for all bookings list."""

    bookings: List[BookingDetailResponse]


class UserDetailResponse(BaseModel):
    """Response model for detailed user information."""

    user_id: UUID
    employee_name: str
    staff_number: str
    department_name: Optional[str]
    email: str

    model_config = ConfigDict(from_attributes=True)


class AllUsersResponse(BaseModel):
    """Response model for all users list."""

    users: List[UserDetailResponse]


class LockerResponse(BaseModel):
    """Response model for locker details."""

    locker_id: UUID
    locker_number: str
    floor_id: UUID
    location: Optional[str] = None
    floor_number: str
    locker_status: str
    x_coordinate: Optional[int] = None
    y_coordinate: Optional[int] = None
    key_number: Optional[str] = None
    key_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AllLockersResponse(BaseModel):
    """Response model for all lockers list."""

    lockers: List[LockerResponse]


class LockerStatusResponse(BaseModel):
    """Response model for locker status updates."""

    locker_id: UUID
    locker_number: str
    status: str


class LockerStatsResponse(BaseModel):
    """Response model for locker statistics."""

    total_lockers: int
    total_available: int
    total_maintenance: int


class KeyHandoverResponse(BaseModel):
    """Response model for key handover confirmation."""

    booking_id: UUID
    key_number: str
    message: str = "Key handover confirmed"


class KeyReturnResponse(BaseModel):
    """Response model for key return confirmation."""

    booking_id: UUID
    key_number: str
    message: str = "Key return confirmed"


class CreateLockerResponse(BaseModel):
    """Response model for creating a locker."""

    locker_id: UUID
    locker_number: str
    key_id: UUID
    key_number: str
    message: str = "Locker and key created successfully"


class CreateKeyResponse(BaseModel):
    """Response model for creating a key."""

    key_id: UUID
    key_number: str
    locker_id: UUID
    message: str = "Key created successfully"


class KeyResponse(BaseModel):
    """Response model for key details."""

    key_id: UUID
    key_number: str

    model_config = ConfigDict(from_attributes=True)


class AllKeysResponse(BaseModel):
    """Response model for all keys list."""

    keys: List[KeyResponse]


class SpecialRequestDetailResponse(BaseModel):
    """Response model for special request details."""

    request_id: int
    user_id: UUID
    employee_name: str
    staff_number: str
    department_name: Optional[str]
    floor_id: Optional[UUID]
    floor_number: Optional[str]
    locker_id: Optional[UUID]
    booking_id: Optional[UUID]
    start_date: date
    end_date: Optional[date] = None
    request_type: str
    justification: Optional[str]
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[UUID]
    reason: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class AllSpecialRequestsResponse(BaseModel):
    """Response model for all special requests list."""

    requests: List[SpecialRequestDetailResponse]


class ReviewSpecialRequestResponse(BaseModel):
    """Response model for reviewing a special request."""

    request_id: int
    message: str


class UpdateFloorStatusResponse(BaseModel):
    """Response model for floor status update."""

    floor_id: UUID
    floor_number: str
    status: str


class BookingRuleResponse(BaseModel):
    """Response model for a single booking rule."""

    booking_rule_id: UUID
    name: str
    value: int
    rule_type: str

    model_config = ConfigDict(from_attributes=True)


class AllBookingRulesResponse(BaseModel):
    """Response model for all booking rules."""

    rules: List[BookingRuleResponse]


class AuditLogResponse(BaseModel):
    """Response model for an audit log entry."""

    audit_log_id: int
    user_id: Optional[UUID]
    user_name: Optional[str]
    action: str
    entity_type: str
    entity_id: UUID
    reference: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    audit_date: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogsResponse(BaseModel):
    """Response model for paginated audit logs."""

    logs: List[AuditLogResponse]
    total: int
    page: int
    pages: int
    limit: int


class DashboardStatsResponse(BaseModel):
    """Response model for dashboard statistics."""

    total_lockers: int
    available_lockers: int
    occupied_lockers: int
    maintenance_lockers: int
    total_bookings: int
    active_bookings: int
    pending_requests: int
    total_users: int

    model_config = ConfigDict(from_attributes=True)


class FloorUtilizationResponse(BaseModel):
    """Response model for floor locker utilization."""

    floor_id: UUID
    floor_number: str
    total_lockers: int
    available: int
    occupied: int
    maintenance: int
    utilization_rate: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


class AllFloorsUtilizationResponse(BaseModel):
    """Response model for all floors utilization."""

    floors: List[FloorUtilizationResponse]


class NotificationResponse(BaseModel):
    """Response model for a notification."""

    notification_id: UUID
    user_id: Optional[UUID]
    user_name: Optional[str]
    entity_type: str
    title: str
    caption: Optional[str]
    type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentActivityResponse(BaseModel):
    """Response model for recent activity."""

    activities: List[NotificationResponse]


class FloorResponse(BaseModel):
    """Response model for a floor."""

    floor_id: UUID
    floor_number: str
    status: str
    created_at: datetime
    updated_at: datetime
    total_lockers: int
    closures: Optional[List[Dict[str, Any]]] = None


class AllFloorsResponse(BaseModel):
    """Response model for all floors."""

    floors: List[FloorResponse]
