"""Scheduled job to expire overdue bookings where end date has passed."""

from datetime import date

from src.logger import logger
from src.connectors.db import db

EXPIRE_OVERDUE_BOOKINGS_QUERY = """
UPDATE lockerhub.bookings
SET status = 'expired', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE end_date < $1
    AND status = 'active'
RETURNING booking_id;
"""

UPDATE_KEY_STATUS_QUERY = """
UPDATE lockerhub.keys
SET status = 'awaiting_return', updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE status = 'with_employee'
    AND locker_id IN (
        SELECT locker_id
        FROM lockerhub.bookings
        WHERE status = 'expired'
    )
RETURNING key_id;
"""


async def expire_overdue_bookings():
    """
    Expire overdue bookings where end date has passed.

    Marks bookings as 'expired' when end_date < today and status = 'active'.
    Also updates key status from 'with_employee' to 'awaiting_return' for ALL expired bookings.

    Note: This does NOT free up the locker or key resources. Those remain in their
    current state until the key is physically returned.
    This allows tracking of overdue bookings while maintaining accurate inventory.
    """
    try:
        today = date.today()
        logger.info(f"Running expire_overdue_bookings job for date: {today}")

        results = await db.fetch(EXPIRE_OVERDUE_BOOKINGS_QUERY, today)

        if not results:
            logger.info("No overdue bookings found")
        else:
            booking_ids = [row["booking_id"] for row in results]
            logger.info(f"Successfully expired {len(booking_ids)} overdue bookings")

        # Update key status for ALL expired bookings (safety check)
        key_results = await db.fetch(UPDATE_KEY_STATUS_QUERY)
        if key_results:
            key_ids = [row["key_id"] for row in key_results]
            logger.info(f"Updated {len(key_ids)} keys to 'awaiting_return'")

    except Exception:
        logger.error("Error in expire_overdue_bookings job")
        raise
