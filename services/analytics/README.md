
# Analytics Service

Microservice for locker analytics.

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
export APP_PORT=3007
export AUTH_SERVICE_URL="http://localhost:3003"
```

### Run

```bash
# Development with hot reload
uvicorn src.main:app --reload --host $APP_HOST --port $APP_PORT
```

**API Docs:** <http://localhost:3007/docs>

## Docker

```bash
# Start all services (from repo root)
sh .local/up.sh

# Rebuild only analytics service (from repo root)
.local/rebuild-service.sh analytics

# Rebuild only analytics service (from this directory)
docker compose -f ../../.local/services.yaml -p lockerhub up --build -d analytics
```

**API Docs:** <http://localhost:3007/docs>

## API Endpoints

All endpoints require JWT authentication: `Authorization: Bearer <token>`

**Analytics**
- `GET /analytics/locker-usage` - Get daily locker occupancy over time
  - Query params: 
    - `period` (default: `last_7_days`) - Time period: `last_7_days`, `last_14_days`, `last_month`, `last_3_months`, `last_6_months`, `last_year`, `last_2_years`, `all_time`
    - `floor_id` (optional) - Filter by floor UUID
    - `department_id` (optional) - Filter by department UUID

- `GET /analytics/top-departments` - Get top 6 departments by locker occupancy
  - Query params:
    - `period` (default: `last_7_days`) - Time period (same values as above)
    - `floor_id` (optional) - Filter by floor UUID

- `GET /analytics/most-popular-floors` - Get top 6 floors by locker occupancy
  - Query params:
    - `period` (default: `last_7_days`) - Time period (same values as above)
    - `department_id` (optional) - Filter by department UUID

**Health**
- `GET /health` - Health check
