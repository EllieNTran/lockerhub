
# Admin Service

Microservice for managing admin tasks with JWT authentication.

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
export APP_PORT=3005
export AUTH_SERVICE_URL="http://localhost:3003"
```

### Run

```bash
# Development with hot reload
uvicorn src.main:app --reload --host $APP_HOST --port $APP_PORT
```

**API Docs:** <http://localhost:3005/docs>

## Docker

```bash
# Start all services (from repo root)
sh .local/up.sh

# Rebuild only admin service (from repo root)
.local/rebuild-service.sh admin

# Rebuild only admin service (from this directory)
docker compose -f ../../.local/services.yaml -p lockerhub up --build -d admin
```

**API Docs:** <http://localhost:3005/docs>

## API Endpoints

All endpoints require JWT authentication with admin role: `Authorization: Bearer <token>`

**Dashboard**
- `GET /admin/dashboard/stats` - Get dashboard statistics
- `GET /admin/dashboard/floors/utilization` - Get utilization for all floors
- `GET /admin/dashboard/recent-activity` - Get recent activity

**Bookings**
- `POST /admin/bookings` - Create booking for user
- `GET /admin/bookings` - Get all bookings
- `POST /admin/bookings/{id}/cancel` - Cancel booking
- `POST /admin/bookings/{booking_id}/handover` - Confirm key handover
- `POST /admin/bookings/{booking_id}/return` - Confirm key return

**Lockers**
- `GET /admin/lockers` - Get all lockers
- `GET /admin/lockers/stats` - Get locker availability stats
- `PUT /admin/lockers/{id}/maintenance` - Mark locker as maintenance
- `PUT /admin/lockers/{id}/available` - Mark locker as available

**Special Requests**
- `GET /admin/special-requests` - Get all special requests
- `POST /admin/special-requests/{id}/review` - Review special request

**Booking Rules**
- `GET /admin/booking-rules` - Get booking rules
- `PUT /admin/booking-rules` - Update booking rules
- `PUT /admin/booking-rules/floors/{floor_id}/status` - Update floor status

**Audit Logs**
- `GET /admin/audit-logs` - Get paginated audit logs

**Health**
- `GET /health` - Health check
