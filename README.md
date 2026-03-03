# LockerHub

A centralized locker management system for corporate environments. Staff can book lockers through a self-service portal, while the Facility Management Team handles administration and gains insights through analytics.

## Features

* **Self-Service Portal** – Employees can view locker availability, create bookings, and manage their assignments.
* **Admin Dashboard** – Facility managers can oversee lockers, keys, bookings, and approve special requests.
* **Notifications** – Automated alerts for bookings, special requests, key handovers, and system events.
* **Analytics** – Insights on locker usage, floor occupancy, and booking trends to support planning and optimization.
* **Audit Trail** – Comprehensive logging of user and system actions for accountability and compliance.

## Tech Stack

- **Frontend**: React with React Router
- **API Gateway**: Express.js
- **Microservices**: FastAPI (booking, admin, notifications, auth, analytics)
- **Database**: PostgreSQL 17
- **Infrastructure**: Docker Compose

## Getting Started

```bash
# Start local environment
sh .local/up.sh
