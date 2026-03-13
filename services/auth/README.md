# Auth Service

JWT-based authentication service using RS256 asymmetric signing.

## Tech Stack

- **Express.js** - Web framework
- **JWT (RS256)** - Token signing and verification
- **PostgreSQL** - User data storage
- **Bcrypt** - Password hashing
- **Pino** - Request logging

## Setup

```bash
# Install dependencies
npm install

# RSA keys auto-generated on first run in keys/ directory

# Configure environment
Edit .env-cmdrc.json for environment-specific settings
```

## Run

```bash
# Development
npm run dev

# Production
npm start

# Test
npm test
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login and receive tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### Public Keys
- `GET /auth/.well-known/jwks.json` - JWKS endpoint for token verification

### Health
- `GET /health` - Health check

## Authentication Flow

1. User logs in with email/password
2. Service returns access token (15m) and refresh token (7d)
3. Other services fetch JWKS endpoint to verify tokens
4. Access token expires → use refresh token to get new one

## Key Management

RS256 keypair stored in `keys/` directory:
- Private key: Signs JWTs (stays in auth service)
- Public key: Verifies JWTs (shared via JWKS endpoint)

**Never commit keys to git.**
