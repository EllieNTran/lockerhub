"""Scheduled job to process floor queues and auto-allocate lockers to waitlisted users."""

from src.logger import logger
from src.connectors.db import db
from src.connectors.notifications_service import NotificationsServiceClient
from src.models.responses import ProcessFloorQueuesResponse

GET_FLOORS_WITH_QUEUES_QUERY = """
SELECT DISTINCT fq.floor_id, f.floor_number
FROM lockerhub.floor_queues fq
JOIN lockerhub.requests r ON fq.request_id = r.request_id
JOIN lockerhub.floors f ON fq.floor_id = f.floor_id
WHERE r.status = 'queued'
ORDER BY fq.floor_id
"""

GET_QUEUED_REQUESTS_QUERY = """
SELECT 
    r.request_id,
    r.user_id,
    r.start_date,
    r.end_date,
    r.created_at,
    fq.floor_queue_id,
    u.email,
    u.first_name
FROM lockerhub.floor_queues fq
JOIN lockerhub.requests r ON fq.request_id = r.request_id
JOIN lockerhub.users u ON r.user_id = u.user_id
WHERE fq.floor_id = $1 
AND r.status = 'queued'
ORDER BY r.created_at ASC
"""

GET_AVAILABLE_LOCKERS_ON_FLOOR_QUERY = """
SELECT l.locker_id, l.locker_number
FROM lockerhub.lockers l
WHERE l.floor_id = $1
AND l.status = 'available'
AND NOT EXISTS (
    SELECT 1 FROM lockerhub.bookings b
    WHERE b.locker_id = l.locker_id
    AND b.status NOT IN ('cancelled', 'completed')
    AND daterange($2, $3, '[]') && daterange(b.start_date, b.end_date, '[]')
)
LIMIT 1
"""

CREATE_BOOKING_QUERY = """
INSERT INTO lockerhub.bookings (
    user_id,
    locker_id,
    start_date,
    end_date
)
VALUES ($1, $2, $3, $4)
RETURNING booking_id
"""

UPDATE_REQUEST_STATUS_QUERY = """
UPDATE lockerhub.requests
SET status = 'approved'
WHERE request_id = $1
"""

DELETE_FLOOR_QUEUE_ENTRY_QUERY = """
DELETE FROM lockerhub.floor_queues
WHERE floor_queue_id = $1
"""

CHECK_USER_HAS_ACTIVE_BOOKING_QUERY = """
SELECT 1
FROM lockerhub.bookings
WHERE user_id = $1
AND status IN ('upcoming', 'active')
AND daterange($2, $3, '[]') && daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]')
LIMIT 1
"""


async def handle_active_booking(
    user_id: str,
    start_date: str,
    end_date: str,
    floor_queue_id: str,
    request_id: str,
    email: str,
    name: str,
    floor_number: int,
) -> bool:
    """
    Handle case where user has an active booking that overlaps with the queue request.

    Args:
        user_id: ID of the user to check
        start_date: Proposed booking start date
        end_date: Proposed booking end date
        floor_queue_id: ID of the floor queue entry to remove if user has active booking
        request_id: ID of the request to update status for
        email: User's email for notification
        name: User's name for notification
        floor_number: Floor number for notification

    Returns:
        True if user has active booking, False otherwise
    """
    has_active_booking = await db.fetchval(
        CHECK_USER_HAS_ACTIVE_BOOKING_QUERY, user_id, start_date, end_date
    )

    if has_active_booking:
        logger.info("User already has an active booking, removing from queue")
        async with db.transaction():
            await db.execute(DELETE_FLOOR_QUEUE_ENTRY_QUERY, floor_queue_id)
            await db.execute(
                "UPDATE lockerhub.requests SET status = 'cancelled' WHERE request_id = $1",
                request_id,
            )

        await NotificationsServiceClient().post(
            "/waitlist/removed",
            {
                "userId": str(user_id),
                "email": email,
                "name": name,
                "floorNumber": floor_number,
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
            },
        )
        return True
    return False


async def process_floor_queues() -> ProcessFloorQueuesResponse:
    """
    Process floor queues and auto-allocate available lockers to waitlisted users.

    This job runs every 15 minutes and:
    1. Gets all floors with queued requests
    2. For each floor, processes requests in FCFS order (oldest first)
    3. Tries to find an available locker for the request dates
    4. If found, creates booking, updates request status, and sends notification
    5. Removes users from queue who already have active bookings

    Returns:
        ProcessFloorQueuesResponse with count of allocations made
    """
    allocations_made = 0

    try:
        logger.info("Running process_floor_queues job")

        floors = await db.fetch(GET_FLOORS_WITH_QUEUES_QUERY)

        if not floors:
            logger.info("No floors with queued requests")
            return ProcessFloorQueuesResponse(
                success=True,
                allocations_made=0,
                message="No queued requests to process",
            )

        for floor in floors:
            floor_id = floor["floor_id"]
            floor_number = floor["floor_number"]

            logger.info(f"Processing queue for floor {floor_number}")

            queued_requests = await db.fetch(GET_QUEUED_REQUESTS_QUERY, floor_id)

            for request in queued_requests:
                request_id = request["request_id"]
                user_id = request["user_id"]
                start_date = request["start_date"]
                end_date = request["end_date"]
                floor_queue_id = request["floor_queue_id"]
                email = request["email"]
                name = request["first_name"]

                should_skip = await handle_active_booking(
                    user_id,
                    start_date,
                    end_date,
                    floor_queue_id,
                    request_id,
                    email,
                    name,
                    floor_number,
                )

                if should_skip:
                    continue

                available_locker = await db.fetchrow(
                    GET_AVAILABLE_LOCKERS_ON_FLOOR_QUERY, floor_id, start_date, end_date
                )

                if not available_locker:
                    logger.info("No available locker for request")
                    continue

                locker_id = available_locker["locker_id"]
                locker_number = available_locker["locker_number"]

                async with db.transaction() as connection:
                    await connection.fetchval(
                        CREATE_BOOKING_QUERY, user_id, locker_id, start_date, end_date
                    )

                    await connection.execute(UPDATE_REQUEST_STATUS_QUERY, request_id)

                    await connection.execute(
                        DELETE_FLOOR_QUEUE_ENTRY_QUERY, floor_queue_id
                    )

                    await NotificationsServiceClient().post(
                        "/booking/confirmation",
                        {
                            "userId": str(user_id),
                            "email": email,
                            "name": name,
                            "lockerNumber": locker_number,
                            "floorNumber": floor_number,
                            "startDate": start_date.isoformat(),
                            "endDate": end_date.isoformat(),
                            "userBookingsPath": "/user/my-bookings",
                            "adminBookingsPath": "/admin/bookings",
                        },
                    )

                allocations_made += 1
                logger.info("Auto-allocated locker to user")

        logger.info(f"Processed queues, made {allocations_made} allocations")
        return ProcessFloorQueuesResponse(
            success=True,
            allocations_made=allocations_made,
            message=f"Successfully processed queues. {allocations_made} locker(s) allocated.",
        )

    except Exception:
        logger.error("Error in process_floor_queues job")
        raise
