
# Booking Service

Microservice for managing locker bookings with JWT authentication.

## Tech Stack

- **FastAPI** - Async REST API
- **AsyncPG** - PostgreSQL connection pooling
- **PyJWT** - JWT verification with JWKS
- **Pydantic** - Request/response validation

## Local Development

### Setup

```bash
# Create virtual environment
python3.12 -m venv env
source env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="postgres"
export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_MIN_POOL_SIZE=5
export DB_MAX_POOL_SIZE=20
export APP_HOST="0.0.0.0"
export APP_PORT=3004
export AUTH_SERVICE_URL="http://localhost:3003"
```

### Run

```bash
# Development with hot reload
uvicorn src.main:app --reload --host $APP_HOST --port $APP_PORT
```

**API Docs:** <http://localhost:3004/docs>

## Docker

```bash
# Start all services (from repo root)
sh .local/up.sh

# Rebuild only booking service (from repo root)
.local/rebuild-service.sh booking

# Rebuild only booking service (from this directory)
docker compose -f ../../.local/services.yaml -p lockerhub up --build -d booking
```

**API Docs:** <http://localhost:3004/docs>

## API Endpoints

All endpoints require JWT authentication: `Authorization: Bearer <token>`

**Bookings**
- `POST /bookings` - Create booking
- `GET /bookings` - Get user's bookings
- `GET /bookings/floors` - Get all open floors
- `GET /bookings/{booking_id}` - Get specific booking
- `PUT /bookings/{booking_id}` - Update booking (shorten only)
- `PUT /bookings/{booking_id}/cancel` - Cancel booking
- `DELETE /bookings/{booking_id}/special-requests` - Delete special request
- `POST /bookings/{booking_id}/extend` - Request extension

**Special Requests**
- `POST /bookings/special-requests` - Create special request
- `GET /bookings/special-requests` - Get user's special requests

**Availability**
- `GET /bookings/lockers/available` - Get available lockers for floor/dates
- `GET /bookings/lockers/{locker_id}/availability` - Check specific locker availability

**Waitlist**
- `POST /bookings/waitlist/join` - Join floor queue

**Booking Rules**
- `GET /bookings/booking-rule/{rule_type}` - Get specific booking rule

**Health**
- `GET /health` - Health check

## Scheduled Jobs

Automated tasks run via APScheduler:

- **Update Booking Statuses** - Every 30 minutes
  - Updates locker status to `reserved` and key status to `awaiting_handover` for bookings starting today
  - Updates key status to `awaiting_return` for bookings ending today
  - Runs frequently to handle bookings created during the day

- **Expire Overdue Bookings** - Daily at 00:00
  - Mark bookings past their end date as `expired`

- **Send Key Return Reminders** - Daily at 09:00
  - Emails users whose bookings end today
  - Reminds them to return keys

- **Process Floor Queues** - Every 15 minutes
  - Auto-allocates available lockers to waitlisted users (FCFS)
  - Removes users from queue who already have active bookings
  - Sends booking confirmation emails

**Manual Triggers** (for testing):
- `POST /scheduled-jobs/update-booking-statuses`
- `POST /scheduled-jobs/expire-overdue-bookings`
- `POST /scheduled-jobs/send-key-return-reminders`
- `POST /scheduled-jobs/process-floor-queues`
