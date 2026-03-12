# Notifications Service

Email notifications and in-app notification management for LockerHub

## Tech Stack

- **Express.js** - Web framework
- **Resend** - Email delivery API
- **PostgreSQL** - Notification data storage
- **Pino** - Request logging

## Setup

```bash
# Install dependencies
npm install

# Configure environment
Edit .env-cmdrc.json for environment-specific settings
# Required: RESEND_API_KEY, database credentials
```

## Run

```bash
# Development
npm run dev

# Production
npm start

# Type checking
npm run typecheck
```

## API Endpoints

### Email Notifications
- `POST /notifications/password-reset` - Send password reset email
- `POST /notifications/activation` - Send account activation email
- `POST /notifications/booking/confirmation` - Send booking confirmation emails
- `POST /notifications/booking/cancellation` - Send booking cancellation emails
- `POST /notifications/booking/extension` - Send booking extension emails

### In-App Notifications
- `POST /notifications` - Create notification for users
- `GET /notifications/user/:userId` - Get user notifications
- `PUT /notifications/:notificationId/read` - Mark notification as read

### Health
- `GET /notifications/health` - Health check

## Environment Variables

Configured in `.env-cmdrc.json`:
- `RESEND_API_KEY` - Resend API key for sending emails
- Database connection (host, port, user, password, name)
- Server configuration (port, log level)

Available environments: `debug`, `perf`, `test`
