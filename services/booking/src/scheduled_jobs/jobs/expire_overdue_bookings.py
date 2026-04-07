"""Scheduled job to expire overdue bookings where end date has passed."""

from datetime import date

from src.logger import logger
from src.connectors.db import db

EXPIRE_OVERDUE_BOOKINGS_WITH_KEYS_QUERY = """
WITH expired_bookings AS (
    UPDATE lockerhub.bookings
    SET status = 'expired'::lockerhub.booking_status, updated_at = CURRENT_TIMESTAMP, updated_by = NULL
    WHERE end_date < $1
        AND status = 'active'::lockerhub.booking_status
    RETURNING booking_id, locker_id
),
updated_keys AS (
    UPDATE lockerhub.keys
    SET status = 'awaiting_return'::lockerhub.key_status, updated_at = CURRENT_TIMESTAMP, updated_by = NULL
    WHERE status = 'with_employee'::lockerhub.key_status
        AND locker_id IN (SELECT locker_id FROM expired_bookings)
    RETURNING key_id
)
SELECT 
    (SELECT COUNT(*) FROM expired_bookings) AS expired_count,
    (SELECT COUNT(*) FROM updated_keys) AS keys_updated_count,
    COALESCE(ARRAY_AGG(eb.booking_id), ARRAY[]::uuid[]) AS booking_ids,
    COALESCE(ARRAY_AGG(uk.key_id), ARRAY[]::uuid[]) AS key_ids
FROM expired_bookings eb
FULL OUTER JOIN updated_keys uk ON true
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

        result = await db.fetchrow(EXPIRE_OVERDUE_BOOKINGS_WITH_KEYS_QUERY, today)

        if not result or result["expired_count"] == 0:
            logger.info("No overdue bookings found")
        else:
            logger.info(
                f"Successfully expired {result['expired_count']} overdue bookings"
            )
            if result["keys_updated_count"] > 0:
                logger.info(
                    f"Updated {result['keys_updated_count']} keys to 'awaiting_return'"
                )

    except Exception:
        logger.error("Error in expire_overdue_bookings job")
        raise
