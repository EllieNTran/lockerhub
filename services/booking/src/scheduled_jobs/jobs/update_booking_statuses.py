"""Scheduled job to update booking statuses for bookings starting or ending today."""

from datetime import date

from src.logger import logger
from src.connectors.db import db

UPDATE_LOCKERS_TO_RESERVED_QUERY = """
UPDATE lockerhub.lockers
SET status = 'reserved', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE locker_id IN (
    SELECT l.locker_id
    FROM lockerhub.bookings b
    INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    WHERE b.start_date <= $1
        AND b.status = 'upcoming'
        AND l.status = 'available'
)
RETURNING locker_id;
"""

UPDATE_KEYS_TO_AWAITING_HANDOVER_QUERY = """
UPDATE lockerhub.keys
SET status = 'awaiting_handover', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE locker_id IN (
    SELECT l.locker_id
    FROM lockerhub.bookings b
    INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    WHERE b.start_date <= $1
        AND b.status = 'upcoming'
        AND l.status IN ('available', 'reserved')
)
AND status = 'available'
RETURNING key_id;
"""

UPDATE_ENDING_BOOKINGS_QUERY = """
SELECT 
    b.booking_id,
    k.key_id
FROM lockerhub.bookings b
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
WHERE b.end_date = $1
    AND b.status = 'active'
    AND k.status = 'with_employee';
"""

UPDATE_KEY_AWAITING_RETURN_QUERY = """
UPDATE lockerhub.keys
SET status = 'awaiting_return', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE key_id = ANY($1::uuid[]);
"""


async def handle_bookings_starting_today(today: date):
    """Handle bookings starting today or earlier: update locker to 'reserved' and key to 'awaiting_handover'.

    This catches any bookings where start_date <= today that haven't been processed yet.

    Note: Booking remains 'upcoming' until admin confirms key handover via confirm_key_handover endpoint.
    """
    locker_results = await db.fetch(UPDATE_LOCKERS_TO_RESERVED_QUERY, today)
    if locker_results:
        logger.info(
            f"Updated {len(locker_results)} lockers to 'reserved' (bookings remain 'upcoming' until key handover)"
        )

    key_results = await db.fetch(UPDATE_KEYS_TO_AWAITING_HANDOVER_QUERY, today)
    if key_results:
        logger.info(f"Updated {len(key_results)} keys to 'awaiting_handover'")

    if not locker_results and not key_results:
        logger.info("No bookings found starting today or earlier")


async def handle_bookings_ending_today(today: date):
    """Handle bookings ending today: update key to 'awaiting_return'."""
    ending_results = await db.fetch(UPDATE_ENDING_BOOKINGS_QUERY, today)

    if ending_results:
        ending_key_ids = [
            row["key_id"] for row in ending_results if row["key_id"] is not None
        ]

        if ending_key_ids:
            await db.execute(UPDATE_KEY_AWAITING_RETURN_QUERY, ending_key_ids)
            logger.info(
                f"Updated {len(ending_key_ids)} keys to 'awaiting_return' for bookings ending today"
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
