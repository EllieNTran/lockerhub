"""
Script to insert bookings for all lockers on floor 4.
Books all 3rd floor lockers from April 1-4, 2026 using random unique users.
"""
import asyncio
import asyncpg
import random
from datetime import date
import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()
# Admin user ID

FLOOR_NUMBER = '3'

ADMIN_USER_ID = "20915c98-5051-447b-ad5c-8cf416e28a9f"
# Booking dates
START_DATE = date(2026, 4, 10)
END_DATE = date(2026, 4, 14)
# Database connection settings
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3000)),
    "database": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
}
GET_FLOOR3_LOCKERS_QUERY = f"""
SELECT l.locker_id, l.locker_number
FROM lockerhub.lockers l
JOIN lockerhub.floors f ON f.floor_id = l.floor_id
WHERE f.floor_number = '{FLOOR_NUMBER}'
ORDER BY l.locker_number
"""
GET_USERS_QUERY = """
SELECT user_id, email, first_name
FROM lockerhub.users
WHERE user_id != $1
AND role = 'user'
ORDER BY created_at
"""
CREATE_BOOKING_QUERY = """
INSERT INTO lockerhub.bookings (
    user_id,
    locker_id,
    start_date,
    end_date,
    created_by,
    updated_by
)
VALUES ($1, $2, $3, $4, $5, $5)
RETURNING booking_id
"""

async def create_floor3_bookings():
    """Create bookings for all lockers on floor."""
    print(f"Connecting to database at {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
    
    # Connect to database
    conn = await asyncpg.connect(**DB_CONFIG)
    
    try:
        # Get all lockers on floor 4
        print(f"\nFetching lockers on floor {FLOOR_NUMBER}...")
        lockers = await conn.fetch(GET_FLOOR3_LOCKERS_QUERY)
        print(f"Found {len(lockers)} lockers on floor {FLOOR_NUMBER}")
        
        if not lockers:
            print(f"No lockers found on floor {FLOOR_NUMBER}. Exiting.")
            return
        
        # Get all available users (excluding admin)
        print("\nFetching users...")
        users = await conn.fetch(GET_USERS_QUERY, ADMIN_USER_ID)
        print(f"Found {len(users)} users available for booking")
        
        if len(users) < len(lockers):
            print(f"WARNING: Not enough users ({len(users)}) for all lockers ({len(lockers)})")
            print("Some users will have multiple bookings.")
        
        # Shuffle users to randomize assignments
        users_list = list(users)
        random.shuffle(users_list)
        
        # Create bookings for each locker
        print(f"\nCreating bookings from {START_DATE} to {END_DATE}...")
        success_count = 0
        error_count = 0
        
        for i, locker in enumerate(lockers):
            # Assign user circularly if not enough users
            user = users_list[i % len(users_list)]
            
            try:
                booking_id = await conn.fetchval(
                    CREATE_BOOKING_QUERY,
                    user["user_id"],
                    locker["locker_id"],
                    START_DATE,
                    END_DATE,
                    ADMIN_USER_ID,
                )
                
                print(f"✓ Locker {locker['locker_number']:>4} → {user['first_name']} ({user['email']}) - Booking ID: {booking_id}")
                success_count += 1
                
            except asyncpg.exceptions.ExclusionViolationError:
                print(f"✗ Locker {locker['locker_number']:>4} → CONFLICT (already booked)")
                error_count += 1
            except Exception as e:
                print(f"✗ Locker {locker['locker_number']:>4} → ERROR: {e}")
                error_count += 1
        
        # Summary
        print("\n" + "=" * 60)
        print(f"Booking creation complete!")
        print(f"  Successful: {success_count}")
        print(f"  Errors:     {error_count}")
        print(f"  Total:      {len(lockers)}")
        print("=" * 60)
        
    finally:
        await conn.close()
        print("\nDatabase connection closed.")

if __name__ == "__main__":
    print("=" * 60)
    print("Floor 4 Booking Creation Script")
    print("=" * 60)
    print(f"Admin User ID: {ADMIN_USER_ID}")
    print(f"Booking Period: {START_DATE} to {END_DATE}")
    print("=" * 60)
    
    asyncio.run(create_floor3_bookings())