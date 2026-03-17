"""Routes for scheduled jobs (for testing purposes)."""

from fastapi import APIRouter

from src.scheduled_jobs.jobs.update_booking_statuses import update_booking_statuses
from src.scheduled_jobs.jobs.expire_overdue_bookings import expire_overdue_bookings

router = APIRouter(prefix="/scheduled-jobs", tags=["Scheduled Jobs"])


@router.post("/update-booking-statuses")
async def trigger_update_booking_statuses():
    """
    Manually trigger the update booking statuses job.

    This handles bookings starting or ending today.
    The job normally runs automatically at midnight every day.
    """
    await update_booking_statuses()
    return {"message": "Update booking statuses job completed"}


@router.post("/expire-overdue-bookings")
async def trigger_expire_overdue_bookings():
    """
    Manually trigger the expire overdue bookings job.

    The job normally runs automatically at midnight every day.
    """
    await expire_overdue_bookings()
    return {"message": "Expire overdue bookings job completed"}
