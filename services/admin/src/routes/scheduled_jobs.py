"""Routes for scheduled jobs (for testing)."""

from fastapi import APIRouter

from src.scheduled_jobs.jobs.update_floor_statuses import update_floor_statuses

router = APIRouter(prefix="/scheduled-jobs", tags=["Scheduled Jobs"])


@router.post("/update-floor-statuses")
async def trigger_update_floor_statuses():
    """
    Manually trigger the update floor statuses job.

    This handles floors starting or ending today.
    The job normally runs automatically at midnight every day.
    """
    await update_floor_statuses()
    return {"message": "Update floor statuses job completed"}
