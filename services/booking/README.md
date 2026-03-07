
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

# Rebuild only booking service (from this directory)
docker compose -f ../../.local/services.yaml -p lockerhub up --build -d booking
```

**API Docs:** <http://localhost:3004/docs>

## API Endpoints

All endpoints require JWT authentication: `Authorization: Bearer <token>`

**Bookings**
- `POST /bookings` - Create booking
- `GET /bookings` - Get user's bookings
- `GET /bookings/{id}` - Get specific booking
- `PUT /bookings/{id}` - Update booking (shorten only)
- `DELETE /bookings/{id}` - Delete booking
- `POST /bookings/{id}/extend` - Request extension

**Availability**
- `GET /bookings/lockers/available` - Get available lockers for floor/dates
- `GET /bookings/lockers/{id}/availability` - Check specific locker availability

**Health**
- `GET /health` - Health check
