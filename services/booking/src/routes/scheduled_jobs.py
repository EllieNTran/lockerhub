"""Routes for scheduled jobs (for testing)."""

from fastapi import APIRouter

from src.scheduled_jobs.jobs.update_booking_statuses import update_booking_statuses
from src.scheduled_jobs.jobs.expire_overdue_bookings import expire_overdue_bookings
from src.scheduled_jobs.jobs.send_key_return_reminders import send_key_return_reminders

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


@router.post("/send-key-return-reminders")
async def trigger_send_key_return_reminders():
    """
    Manually trigger the send key return reminders job.

    Sends reminder emails to users with bookings ending today.
    The job normally runs automatically at 9:00 AM every day.
    """
    await send_key_return_reminders()
    return {"message": "Send key return reminders job completed"}
