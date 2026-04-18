"""
Script to generate 2,000 past bookings for performance testing and analytics.
Creates realistic historical booking data following system constraints:
- No overlapping bookings for the same locker
- Random mix of 'completed' and 'cancelled' statuses
- Dates spread across past 12 months
- Realistic booking durations (1-14 days)
"""
import asyncio
import asyncpg
import random
from datetime import date, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

TARGET_BOOKINGS = 2000
MONTHS_OF_HISTORY = 12
MIN_BOOKING_DAYS = 1
MAX_BOOKING_DAYS = 14
CANCELLATION_RATE = 0.15

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3000)),
    "database": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
}

GET_LOCKERS_QUERY = """
SELECT locker_id
FROM lockerhub.lockers
ORDER BY RANDOM()
"""

GET_USERS_QUERY = """
SELECT user_id
FROM lockerhub.users
WHERE role = 'user'
ORDER BY RANDOM()
"""

CREATE_BOOKING_QUERY = """
INSERT INTO lockerhub.bookings (
    user_id,
    locker_id,
    start_date,
    end_date,
    status,
    created_at,
    updated_at
)
VALUES ($1, $2, $3, $4, $5::lockerhub.booking_status, $6, $7)
ON CONFLICT DO NOTHING
RETURNING booking_id
"""

CHECK_OVERLAP_QUERY = """
SELECT EXISTS (
    SELECT 1
    FROM lockerhub.bookings
    WHERE locker_id = $1
    AND status NOT IN ('cancelled', 'completed')
    AND daterange($2, $3, '[]') && daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]')
) AS has_overlap
"""


async def generate_random_past_date_range(earliest_date: date, latest_date: date) -> tuple[date, date]:
    """
    Generate a random date range in the past.
    
    Args:
        earliest_date: Earliest possible start date
        latest_date: Latest possible end date
    
    Returns:
        Tuple of (start_date, end_date)
    """
    duration_days = random.randint(MIN_BOOKING_DAYS, MAX_BOOKING_DAYS)
    max_start_date = latest_date - timedelta(days=duration_days)

    days_range = (max_start_date - earliest_date).days
    if days_range <= 0:
        start_date = earliest_date
    else:
        start_date = earliest_date + timedelta(days=random.randint(0, days_range))

    end_date = start_date + timedelta(days=duration_days)
    
    return start_date, end_date


async def generate_past_bookings():
    """Generate 2,000 past bookings with realistic data."""
    print(f"Connecting to database at {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
    
    conn = await asyncpg.connect(**DB_CONFIG)
    
    try:
        print("\nFetching lockers...")
        lockers = await conn.fetch(GET_LOCKERS_QUERY)
        print(f"Found {len(lockers)} lockers")
        
        if not lockers:
            print("No lockers found. Exiting.")
            return

        print("\nFetching users...")
        users = await conn.fetch(GET_USERS_QUERY)
        print(f"Found {len(users)} users")
        
        if not users:
            print("No users found. Exiting.")
            return

        today = date.today()
        earliest_date = today - timedelta(days=MONTHS_OF_HISTORY * 30)
        latest_end_date = today - timedelta(days=1)  # All bookings must be in the past
        
        print(f"\nGenerating {TARGET_BOOKINGS} past bookings...")
        print(f"Date range: {earliest_date} to {latest_end_date}")
        print(f"Cancellation rate: {CANCELLATION_RATE * 100}%")
        print(f"Booking duration: {MIN_BOOKING_DAYS}-{MAX_BOOKING_DAYS} days")
        
        created_count = 0
        attempts = 0
        max_attempts = TARGET_BOOKINGS * 3  # Prevent infinite loops
        
        # Track locker availability to avoid conflicts
        locker_bookings = {}
        
        while created_count < TARGET_BOOKINGS and attempts < max_attempts:
            attempts += 1
            
            locker = random.choice(lockers)
            user = random.choice(users)
            
            locker_id = locker['locker_id']
            user_id = user['user_id']

            start_date, end_date = await generate_random_past_date_range(
                earliest_date, latest_end_date
            )
            
            # Check for overlaps with previously created bookings
            has_overlap = False
            if locker_id in locker_bookings:
                for existing_start, existing_end in locker_bookings[locker_id]:
                    # Check if date ranges overlap
                    if not (end_date < existing_start or start_date > existing_end):
                        has_overlap = True
                        break
            
            if has_overlap:
                continue
            
            # Determine status (completed or cancelled)
            status = 'cancelled' if random.random() < CANCELLATION_RATE else 'completed'
            
            # Set created_at to a time before start_date
            created_at = start_date - timedelta(days=random.randint(1, 14))
            updated_at = end_date + timedelta(days=random.randint(0, 3)) if status == 'completed' else end_date
            
            try:
                result = await conn.fetchrow(
                    CREATE_BOOKING_QUERY,
                    user_id,
                    locker_id,
                    start_date,
                    end_date,
                    status,
                    created_at,
                    updated_at
                )
                
                if result:
                    created_count += 1
                    
                    # Track this booking
                    if locker_id not in locker_bookings:
                        locker_bookings[locker_id] = []
                    locker_bookings[locker_id].append((start_date, end_date))
                    
                    if created_count % 100 == 0:
                        print(f"Created {created_count}/{TARGET_BOOKINGS} bookings...")
            
            except Exception as e:
                if attempts % 500 == 0:
                    print(f"Attempts: {attempts}, Created: {created_count}, Error rate tracking...")
                continue
        
        print(f"\n✓ Successfully created {created_count} past bookings")
        print(f"Total attempts: {attempts}")
        
        print("\n=== Booking Statistics ===")
        stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
                MIN(start_date) as earliest_date,
                MAX(end_date) as latest_date
            FROM lockerhub.bookings
            WHERE status IN ('completed', 'cancelled')
        """)
        
        if stats:
            print(f"Total past bookings: {stats['total']}")
            print(f"  Completed: {stats['completed']} ({stats['completed']/stats['total']*100:.1f}%)")
            print(f"  Cancelled: {stats['cancelled']} ({stats['cancelled']/stats['total']*100:.1f}%)")
            print(f"Date range: {stats['earliest_date']} to {stats['latest_date']}")
    
    finally:
        await conn.close()
        print("\nDatabase connection closed.")


if __name__ == "__main__":
    asyncio.run(generate_past_bookings())
