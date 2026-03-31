"""Scheduler configuration and initialization."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.logger import logger
from .jobs.update_booking_statuses import update_booking_statuses
from .jobs.expire_overdue_bookings import expire_overdue_bookings
from .jobs.send_key_return_reminders import send_key_return_reminders
from .jobs.process_floor_queues import process_floor_queues

scheduler = AsyncIOScheduler()


def configure_jobs():
    """Configure all scheduled jobs."""
    scheduler.add_job(
        update_booking_statuses,
        trigger=CronTrigger(minute="*/30"),
        id="update_booking_statuses",
        name="Update booking statuses for bookings starting or ending today",
        replace_existing=True,
    )
    logger.info(
        "Configured scheduled job: update_booking_statuses (runs every 30 minutes)"
    )

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

    scheduler.add_job(
        process_floor_queues,
        trigger=CronTrigger(minute="*/15"),
        id="process_floor_queues",
        name="Process floor queues and auto-allocate lockers to waitlisted users",
        replace_existing=True,
    )
    logger.info(
        "Configured scheduled job: process_floor_queues (runs every 15 minutes)"
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
