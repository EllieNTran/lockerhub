"""Scheduled job to update booking statuses for bookings starting or ending today."""

from datetime import date

from src.logger import logger
from src.connectors.db import db

UPDATE_STARTING_BOOKINGS_QUERY = """
WITH updated_lockers AS (
    UPDATE lockerhub.lockers
    SET status = 'reserved'::lockerhub.locker_status, updated_at = CURRENT_TIMESTAMP, updated_by = NULL
    WHERE locker_id IN (
        SELECT l.locker_id
        FROM lockerhub.bookings b
        INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
        WHERE b.start_date <= $1
            AND b.status = 'upcoming'::lockerhub.booking_status
            AND l.status = 'available'::lockerhub.locker_status
    )
    RETURNING locker_id
),
updated_keys AS (
    UPDATE lockerhub.keys
    SET status = 'awaiting_handover'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP, updated_by = NULL
    WHERE locker_id IN (
        SELECT l.locker_id
        FROM lockerhub.bookings b
        INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
        WHERE b.start_date <= $1
            AND b.status = 'upcoming'::lockerhub.booking_status
            AND l.status IN ('available'::lockerhub.locker_status, 'reserved'::lockerhub.locker_status)
    )
    AND status = 'available'::lockerhub.key_status
    RETURNING key_id
)
SELECT 
    (SELECT COUNT(*) FROM updated_lockers) AS lockers_count,
    (SELECT COUNT(*) FROM updated_keys) AS keys_count
"""

UPDATE_ENDING_BOOKINGS_QUERY = """
WITH updated_keys AS (
    UPDATE lockerhub.keys
    SET status = 'awaiting_return'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP, updated_by = NULL
    WHERE key_id IN (
        SELECT k.key_id
        FROM lockerhub.bookings b
        INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
        LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
        WHERE b.end_date = $1
            AND b.status = 'active'::lockerhub.booking_status
            AND k.status = 'with_employee'::lockerhub.key_status
    )
    RETURNING key_id
)
SELECT COUNT(*) AS keys_count
FROM updated_keys
"""


async def handle_bookings_starting_today(today: date):
    """Handle bookings starting today or earlier: update locker to 'reserved' and key to 'awaiting_handover'.
    Also catches any bookings where start_date <= today that haven't been processed yet.
    """
    result = await db.fetchrow(UPDATE_STARTING_BOOKINGS_QUERY, today)

    if result and (result["lockers_count"] > 0 or result["keys_count"] > 0):
        if result["lockers_count"] > 0:
            logger.info(
                f"Updated {result['lockers_count']} lockers to 'reserved' (bookings remain 'upcoming' until key handover)"
            )
        if result["keys_count"] > 0:
            logger.info(f"Updated {result['keys_count']} keys to 'awaiting_handover'")
    else:
        logger.info("No bookings found starting today or earlier")


async def handle_bookings_ending_today(today: date):
    """Handle bookings ending today: update key to 'awaiting_return'."""
    result = await db.fetchrow(UPDATE_ENDING_BOOKINGS_QUERY, today)

    if result and result["keys_count"] > 0:
        logger.info(
            f"Updated {result['keys_count']} keys to 'awaiting_return' for bookings ending today"
        )
    else:
        logger.info("No bookings found ending today")


async def update_booking_statuses():
    """
    Update booking statuses for bookings starting or ending today.

    For bookings starting today or earlier:
    1. Finds all bookings where start_date <= today AND status = 'upcoming'
    2. Updates locker status from 'available' to 'reserved'
    3. Updates key status to 'awaiting_handover' (if key exists)
    4. Booking remains 'upcoming' until admin confirms key handover

    This catches any bookings that should have started but weren't processed yet.

    For bookings ending today:
    1. Finds all bookings where end_date = today AND status = 'active'
    2. Updates key status to 'awaiting_return' (if key is with_employee)

    Note: Only processes bookings for lockers that are currently 'available'
    to avoid conflicts with maintenance or other states.
    """
    try:
        today = date.today()
        logger.info(f"Running update_booking_statuses job for date: {today}")

        await handle_bookings_starting_today(today)
        await handle_bookings_ending_today(today)

        logger.info("Successfully completed update_booking_statuses job")

    except Exception:
        logger.error("Error in update_booking_statuses job")
        raise
