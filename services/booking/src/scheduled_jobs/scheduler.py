"""Scheduler configuration and initialization."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.logger import logger
from .jobs.update_booking_statuses import update_booking_statuses
from .jobs.expire_overdue_bookings import expire_overdue_bookings
from .jobs.send_key_return_reminders import send_key_return_reminders
from src.services.process_floor_queue import process_floor_queue

scheduler = AsyncIOScheduler()


def configure_jobs():
    """Configure all scheduled jobs."""
    scheduler.add_job(
        update_booking_statuses,
        trigger=CronTrigger(hour=0, minute=0),
        id="update_booking_statuses",
        name="Update booking statuses for bookings starting or ending today",
        replace_existing=True,
    )
    logger.info(
        "Configured scheduled job: update_booking_statuses (runs daily at midnight)"
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
        process_floor_queue,
        trigger=CronTrigger(hour="2,14", minute=0),
        id="process_floor_queues_fallback",
        name="Process floor queues (fallback safety net for missed events)",
        replace_existing=True,
    )
    logger.info(
        "Configured scheduled job: process_floor_queues_fallback (runs at 2:00 AM and 2:00 PM)"
    )


def start_scheduler():
    """Start the scheduler."""
    configure_jobs()
    scheduler.start()
    logger.info("Scheduler started")


async def run_all_jobs_once():
    """
    Run all scheduled jobs once on startup.

    Ensures system state is consistent by processing:
    1. Booking statuses (update upcoming/active bookings)
    2. Overdue bookings (mark as expired)
    3. Key return reminders (for bookings ending today)
    4. Floor queues (process waitlisted users)
    """
    try:
        logger.info("Running update_booking_statuses...")
        await update_booking_statuses()

        logger.info("Running expire_overdue_bookings...")
        await expire_overdue_bookings()

        logger.info("Running send_key_return_reminders...")
        await send_key_return_reminders()

        logger.info("Running process_floor_queue (all floors)...")
        await process_floor_queue()

        logger.info("All startup jobs completed successfully")
    except Exception as e:
        logger.error(f"Error running startup jobs: {e}", exc_info=True)
        logger.warning("Continuing startup despite scheduled job errors")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    scheduler.shutdown()
    logger.info("Scheduler shutdown")
