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
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and receive tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/.well-known/jwks.json` - JWKS endpoint for token verification

### Password Reset
- `POST /auth/password-reset/request` - Request password reset email
- `POST /auth/password-reset/reset` - Reset password using token
- `GET /auth/password-reset/validate/:token` - Validate reset token

### Metadata
- `GET /auth/metadata/departments` - Get all departments
- `GET /auth/metadata/offices` - Get all office locations
- `POST /auth/metadata/check-account` - Check account status
- `GET /auth/metadata/validate-staff-number/:staffNumber` - Validate staff number availability

### Tutorial
- `GET /auth/tutorial/status` - Get tutorial status (requires auth)
- `PATCH /auth/tutorial/complete` - Mark tutorial as completed (requires auth)

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
