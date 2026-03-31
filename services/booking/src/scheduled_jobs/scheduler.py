"""Scheduler configuration and initialization."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.logger import logger
from .jobs.update_booking_statuses import update_booking_statuses
from .jobs.expire_overdue_bookings import expire_overdue_bookings
from .jobs.send_key_return_reminders import send_key_return_reminders

scheduler = AsyncIOScheduler()


def configure_jobs():
    """Configure all scheduled jobs."""
    scheduler.add_job(
        update_booking_statuses,
        trigger=CronTrigger(minute=0),
        id="update_booking_statuses",
        name="Update booking statuses for bookings starting or ending today",
        replace_existing=True,
    )
    logger.info("Configured scheduled job: update_booking_statuses (runs hourly)")

    scheduler.add_job(
        expire_overdue_bookings,
        trigger=CronTrigger(hour=0, minute=0),
        id="expire_overdue_bookings",
        name="Expire overdue bookings where end date has passed",
        replace_existing=True,
    )
    logger.info(
        "Configured scheduled job: expire_overdue_bookings (runs daily at midnight)"
    )

    scheduler.add_job(
        send_key_return_reminders,
        trigger=CronTrigger(hour=9, minute=0),
        id="send_key_return_reminders",
        name="Send key return reminder emails for bookings ending today",
        replace_existing=True,
    )
    logger.info(
        "Configured scheduled job: send_key_return_reminders (runs daily at 9:00 AM)"
    )


def start_scheduler():
    """Start the scheduler."""
    configure_jobs()
    scheduler.start()
    logger.info("Scheduler started")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    scheduler.shutdown()
    logger.info("Scheduler shutdown")
