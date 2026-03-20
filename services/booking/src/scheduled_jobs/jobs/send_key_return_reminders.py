"""Scheduled job to send key return reminder emails when booking end date is today."""

from datetime import date

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient

GET_BOOKINGS_ENDING_TODAY_QUERY = """
SELECT 
    b.booking_id,
    b.user_id,
    b.locker_id,
    b.start_date,
    b.end_date,
    u.email,
    u.name,
    l.locker_number,
    f.floor_number,
    k.key_number
FROM lockerhub.bookings b
INNER JOIN lockerhub.users u ON b.user_id = u.user_id
INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
INNER JOIN lockerhub.floors f ON l.floor_id = f.floor_id
LEFT JOIN lockerhub.keys k ON l.locker_id = k.locker_id
WHERE b.end_date = $1
    AND b.status = 'active'
    AND l.status IN ('occupied', 'reserved')
ORDER BY f.floor_number, l.locker_number;
"""


async def send_key_return_reminders():
    """
    Send key return reminder emails to staff when booking end date is today.

    This job runs daily and:
    1. Finds all active bookings where end_date = today
    2. Sends a key return reminder email to each user via notifications service
    3. Notifies staff about upcoming key returns

    Note: Only processes bookings for lockers that are currently 'occupied' or 'reserved'.
    """
    try:
        today = date.today()
        logger.info(f"Running send_key_return_reminders job for date: {today}")

        results = await db.fetch(GET_BOOKINGS_ENDING_TODAY_QUERY, today)

        if not results:
            logger.info("No bookings ending today")
            return

        logger.info(f"Found {len(results)} bookings ending today")

        notifications_client = NotificationsServiceClient()
        success_count = 0
        error_count = 0

        for booking in results:
            try:
                payload = {
                    "userId": str(booking["user_id"]),
                    "email": booking["email"],
                    "name": booking["name"],
                    "lockerNumber": booking["locker_number"],
                    "floorNumber": booking["floor_number"],
                    "startDate": booking["start_date"].isoformat(),
                    "endDate": booking["end_date"].isoformat(),
                    "keyNumber": booking["key_number"] or "Unknown",
                    "keyReturnPath": "/user/return-key",
                }

                await notifications_client.post("/booking/key-return-reminder", payload)

                logger.info(
                    f"Sent key return reminder for user {booking['name']} "
                    f"(locker {booking['locker_number']}, floor {booking['floor_number']})"
                )
                success_count += 1

            except Exception:
                logger.error(
                    f"Failed to send key return reminder for booking {booking['booking_id']}"
                )
                error_count += 1

        logger.info(
            f"Key return reminders completed: {success_count} successful, {error_count} failed"
        )

    except Exception:
        logger.error("Error in send_key_return_reminders job")
        raise
