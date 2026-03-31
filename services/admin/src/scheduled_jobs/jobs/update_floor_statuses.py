"""Scheduled job to update floor statuses based on scheduled closures."""

from datetime import date

from src.logger import logger
from src.connectors.db import db

CLOSE_FLOORS_QUERY = """
UPDATE lockerhub.floors
SET status = 'closed',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = NULL
WHERE floor_id IN (
    SELECT DISTINCT f.floor_id
    FROM lockerhub.floors f
    JOIN lockerhub.floor_closures fc ON f.floor_id = fc.floor_id
    WHERE f.status = 'open'
      AND fc.start_date = CURRENT_DATE
      AND (fc.end_date IS NULL OR fc.end_date >= CURRENT_DATE)
)
RETURNING floor_id, floor_number
"""

REOPEN_FLOORS_QUERY = """
UPDATE lockerhub.floors
SET status = 'open',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = NULL
WHERE floor_id IN (
    SELECT f.floor_id
    FROM lockerhub.floors f
    WHERE f.status = 'closed'
      -- No active or future closures (including open-ended closures)
      AND NOT EXISTS (
          SELECT 1
          FROM lockerhub.floor_closures fc
          WHERE fc.floor_id = f.floor_id
            AND (fc.end_date IS NULL OR fc.end_date >= CURRENT_DATE)
      )
)
RETURNING floor_id, floor_number
"""


async def update_floor_statuses():
    """
    Update floor statuses based on scheduled closures.

    This job should run daily to:
    1. Close floors where a scheduled closure starts today
    2. Reopen floors where all closures have ended
    """
    try:
        logger.info("Starting floor status update job")

        closed_floors = await db.fetch(CLOSE_FLOORS_QUERY)
        if closed_floors:
            floor_numbers = [f["floor_number"] for f in closed_floors]
            logger.info(
                f"Closed {len(closed_floors)} floor(s): {', '.join(map(str, floor_numbers))}"
            )
        else:
            logger.info("No floors to close today")

        reopened_floors = await db.fetch(REOPEN_FLOORS_QUERY)
        if reopened_floors:
            floor_numbers = [f["floor_number"] for f in reopened_floors]
            logger.info(
                f"Reopened {len(reopened_floors)} floor(s): {', '.join(map(str, floor_numbers))}"
            )
        else:
            logger.info("No floors to reopen today")

        logger.info("Floor status update job completed successfully")

        return {
            "closed_count": len(closed_floors) if closed_floors else 0,
            "reopened_count": len(reopened_floors) if reopened_floors else 0,
        }

    except Exception:
        logger.error("Error in update_floor_statuses job")
        raise
