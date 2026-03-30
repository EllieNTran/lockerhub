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

### Authentication Emails
- `POST /notifications/password-reset` - Send password reset email
- `POST /notifications/activation` - Send account activation email

### Booking Notifications
- `POST /notifications/booking/confirmation` - Send booking confirmation
- `POST /notifications/booking/cancellation` - Send booking cancellation
- `POST /notifications/booking/extension` - Send booking extension
- `POST /notifications/booking/key-return-reminder` - Send key return reminder
- `POST /notifications/booking/overdue-key-return` - Send overdue key return alert

### Waitlist Notifications
- `POST /notifications/waitlist/joined` - Send waitlist joined notification
- `POST /notifications/waitlist/removed` - Send removed from waitlist notification

### Special Request Notifications
- `POST /notifications/special-request/submitted` - Send special request submitted
- `POST /notifications/special-request/approved` - Send special request approved
- `POST /notifications/special-request/rejected` - Send special request rejected

### In-App Notifications
- `POST /notifications` - Create notification for users
- `GET /notifications/user/:userId` - Get user notifications
  - Query param: `unreadOnly=true` for unread only
- `PUT /notifications/:notificationId/read` - Mark notification as read

### Health
- `GET /notifications/health` - Health check
