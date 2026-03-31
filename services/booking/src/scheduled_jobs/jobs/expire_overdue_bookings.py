"""Scheduled job to expire overdue bookings where end date has passed."""

from datetime import date

from src.logger import logger
from src.connectors.db import db

EXPIRE_OVERDUE_BOOKINGS_QUERY = """
WITH expired_bookings AS (
    SELECT 
        b.booking_id,
        b.locker_id,
        k.key_id
    FROM lockerhub.bookings b
    INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
    WHERE b.end_date < $1
        AND b.status = 'active'
        AND l.status IN ('occupied', 'reserved')
)
UPDATE lockerhub.lockers
SET status = 'available', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
FROM expired_bookings
WHERE lockerhub.lockers.locker_id = expired_bookings.locker_id
RETURNING expired_bookings.booking_id, expired_bookings.locker_id, expired_bookings.key_id;
"""

UPDATE_EXPIRED_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'available', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE key_id = ANY($1::uuid[]);
"""

UPDATE_EXPIRED_BOOKING_STATUS_QUERY = """
UPDATE lockerhub.bookings
SET status = 'expired', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE booking_id = ANY($1::uuid[]);
"""


async def expire_overdue_bookings():
    """
    Expire overdue bookings where end date has passed.

    This job runs daily at midnight and:
    1. Finds all bookings where end_date < today AND status = 'active'
    2. Updates locker status to 'available'
    3. Updates key status to 'available' (if key exists)
    4. Updates booking status to 'expired'

    Note: Only processes bookings for lockers that are currently 'occupied' or 'reserved'
    to avoid conflicts with maintenance or other states.
    """
    try:
        today = date.today()
        logger.info(f"Running expire_overdue_bookings job for date: {today}")

        results = await db.fetch(EXPIRE_OVERDUE_BOOKINGS_QUERY, today)

        if not results:
            logger.info("No overdue bookings found")
            return

        booking_ids = [row["booking_id"] for row in results]
        key_ids = [row["key_id"] for row in results if row["key_id"] is not None]

        logger.info(f"Found {len(booking_ids)} overdue bookings")

        if key_ids:
            await db.execute(UPDATE_EXPIRED_KEY_STATUS_QUERY, key_ids)
            logger.info(f"Updated {len(key_ids)} keys to 'available'")

        await db.execute(UPDATE_EXPIRED_BOOKING_STATUS_QUERY, booking_ids)
        logger.info(f"Updated {len(booking_ids)} bookings to 'expired'")

        logger.info(f"Successfully expired {len(booking_ids)} overdue bookings")

    except Exception:
        logger.error("Error in expire_overdue_bookings job")
        raise
