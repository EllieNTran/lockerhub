# Auth Service

JWT-based authentication service for LockerHub using RSA256 asymmetric signing.

## Features

- ✅ JWT token generation (RS256)
- ✅ Access & refresh tokens
- ✅ Token verification
- ✅ Public key endpoint for other services
- ✅ PostgreSQL database integration
- ✅ User authentication with bcrypt
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ Request logging (Pino)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **RSA keys (auto-generated on first run):**
   - Keys are automatically created when the service starts if they don't exist
   - Stored in `keys/` directory

3. **Configure environment:**
   - Edit `.env-cmdrc.json` for environment-specific settings
   - Available environments: `debug`, `perf`, `test`

4. **Start the service:**
   ```bash
   # Development (debug environment)
   npm run dev
   
   # Production (perf environment)
   npm start
   
   # Test
   npm test
   ```

## API Endpoints

### POST /auth/login
Authenticate user and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /auth/refresh
Get new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc..."
}
```

### POST /auth/verify
Verify if a token is valid.

**Request:**
```json
{
  "token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "valid": true,
  "payload": {
    "userId": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### GET /auth/public-key
Get the public key for JWT verification (for other services).

**Response:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
}
```

### POST /auth/logout
Logout user (invalidate tokens).

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "auth",
  "timestamp": "2026-03-03T...",
  "uptime": 123.45
}
```

## Environment Variables

Configured in `.env-cmdrc.json` per environment:

| Variable | Default (debug) | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3003` | Server port |
| `LOG_LEVEL` | `debug` (dev), `info` (prod) | Logging level |
| `ACCESS_TOKEN_EXPIRY` | `15m` | Access token expiration |
| `REFRESH_TOKEN_EXPIRY` | `7d` | Refresh token expiration |
| `KEYS_DIR` | `./keys` | RSA keys directory |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `postgres` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |

## RSA Keys

The service uses RS256 (RSA with SHA-256) for JWT signing. This allows:
- Private key stays in auth service (signs tokens)
- Public key can be shared with other services (verifies tokens)
- No shared secrets between services

Keys are stored in the `keys/` directory and should never be committed to git.
