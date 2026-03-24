"""Scheduler configuration and initialization."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.logger import logger
from .jobs.update_floor_statuses import update_floor_statuses

scheduler = AsyncIOScheduler()


def configure_jobs():
    """Configure all scheduled jobs."""
    scheduler.add_job(
        update_floor_statuses,
        trigger=CronTrigger(hour=0, minute=0),
        id="update_floor_statuses",
        name="Update floor statuses based on scheduled closures",
        replace_existing=True,
    )
    logger.info(
        "Configured scheduled job: update_floor_statuses (runs daily at midnight)"
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
