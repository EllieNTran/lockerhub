"""Scheduled job to update booking statuses for bookings starting or ending today."""

from datetime import date

from src.logger import logger
from src.connectors.db import db

UPDATE_BOOKING_STATUSES_QUERY = """
WITH updated_bookings AS (
    SELECT 
        b.booking_id,
        b.locker_id,
        k.key_id
    FROM lockerhub.bookings b
    INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
    WHERE b.start_date = $1
        AND b.status = 'upcoming'
        AND l.status = 'available'
)
UPDATE lockerhub.lockers
SET status = 'reserved', updated_at = CURRENT_TIMESTAMP
FROM updated_bookings
WHERE lockerhub.lockers.locker_id = updated_bookings.locker_id
RETURNING updated_bookings.booking_id, updated_bookings.locker_id, updated_bookings.key_id;
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'awaiting_handover', updated_at = CURRENT_TIMESTAMP
WHERE key_id = ANY($1::uuid[]);
"""

UPDATE_BOOKING_STATUS_QUERY = """
UPDATE lockerhub.bookings
SET status = 'active', updated_at = CURRENT_TIMESTAMP
WHERE booking_id = ANY($1::uuid[]);
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
SET status = 'awaiting_return', updated_at = CURRENT_TIMESTAMP
WHERE key_id = ANY($1::uuid[]);
"""


async def handle_bookings_starting_today(today: date):
    """Handle bookings starting today: update locker to 'reserved', key to 'awaiting_handover', and booking to 'active'."""
    results = await db.fetch(UPDATE_BOOKING_STATUSES_QUERY, today)

    if results:
        booking_ids = [row["booking_id"] for row in results]
        key_ids = [row["key_id"] for row in results if row["key_id"] is not None]

        logger.info(f"Found {len(booking_ids)} bookings starting today")

        if key_ids:
            await db.execute(UPDATE_KEY_STATUS_QUERY, key_ids)
            logger.info(f"Updated {len(key_ids)} keys to 'awaiting_handover'")

        await db.execute(UPDATE_BOOKING_STATUS_QUERY, booking_ids)
        logger.info(f"Updated {len(booking_ids)} bookings to 'active'")
    else:
        logger.info("No bookings found starting today")


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

    This job runs daily at midnight and:

    For bookings starting today:
    1. Finds all bookings where start_date = today AND status = 'upcoming'
    2. Updates locker status from 'available' to 'reserved'
    3. Updates key status to 'awaiting_handover' (if key exists)
    4. Updates booking status to 'active'

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
