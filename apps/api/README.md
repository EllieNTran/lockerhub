# API Gateway

Central API gateway that proxies requests to backend microservices.

## Tech Stack

- **Express.js** - Web framework
- **http-proxy-middleware** - Service proxying
- **JWT (RS256)** - Token verification
- **Pino** - Request logging

## Setup

```bash
# Install dependencies
npm install

# Configure environment
Edit .env-cmdrc.json for environment-specific settings
```

## Run

```bash
# Development
npm run dev

# Production
npm start

# Build
npm run build
```

## Architecture

The API gateway acts as a single entry point for all client requests, routing them to the appropriate backend services:

```
Client → API Gateway → Auth Service
                    → Booking Service
                    → Admin Service
                    → Notifications Service
                    → Analytics Service
```

## Authentication Flow

1. Client sends request to `/api/auth/login`
2. Gateway proxies to auth service
3. Auth service returns JWT tokens
4. Client includes access token in subsequent requests
5. Gateway validates token using JWKS from auth service
6. Valid token → request proxied to target service
7. Invalid token → 401 Unauthorized

## JWKS Caching

- Gateway fetches public keys from auth service on startup
- Keys cached for 1 hour to reduce auth service load
- Auto-refreshes every hour
- Falls back to re-fetch on verification failure

## Rate Limiting

- 100 requests per 15 minutes per IP
- Applied to all `/api/*` routes
- Prevents abuse and DoS attacks

## Error Handling

Gateway handles and standardizes errors from backend services:
- Service unavailable → 503
- Invalid token → 401
- Insufficient permissions → 403
- Backend errors → Proxied status code with sanitized message
