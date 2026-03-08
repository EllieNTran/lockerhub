-- Create schema
CREATE SCHEMA IF NOT EXISTS lockerhub;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create all ENUM types
CREATE TYPE lockerhub.user_role AS ENUM ('admin', 'user');
CREATE TYPE lockerhub.locker_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
CREATE TYPE lockerhub.key_status AS ENUM ('available', 'awaiting_handover', 'with_employee', 'awaiting_return', 'lost', 'awaiting_replacement');
CREATE TYPE lockerhub.request_type AS ENUM ('normal', 'extension', 'special');
CREATE TYPE lockerhub.request_status AS ENUM ('pending', 'queued', 'approved', 'rejected', 'cancelled', 'active', 'completed');
CREATE TYPE lockerhub.booking_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled', 'expired');
CREATE TYPE lockerhub.rule_type AS ENUM ('max_duration', 'max_extension', 'advance_booking_window', 'same_day_bookings');
CREATE TYPE lockerhub.audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'handover', 'return');
CREATE TYPE lockerhub.entity_type AS ENUM ('booking', 'locker', 'key', 'request', 'floor', 'booking_rule');
CREATE TYPE lockerhub.notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE lockerhub.notification_scope AS ENUM ('user', 'department', 'floor', 'global');
CREATE TYPE lockerhub.floor_status AS ENUM ('open', 'closed');

-- Create tables

-- Create floors table
CREATE TABLE IF NOT EXISTS lockerhub.floors (
    floor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL UNIQUE
);

-- Create departments table
CREATE TABLE IF NOT EXISTS lockerhub.departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    floor_id UUID NOT NULL,
    CONSTRAINT fk_departments_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE RESTRICT
);

CREATE INDEX idx_departments_floor_id ON lockerhub.departments(floor_id);
CREATE INDEX idx_departments_name ON lockerhub.departments(name);

-- Create users table
CREATE TABLE IF NOT EXISTS lockerhub.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    staff_number CHAR(8) UNIQUE,
    department_id UUID,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role lockerhub.user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES lockerhub.departments(department_id) ON DELETE SET NULL
);

-- Create lockers table
CREATE TABLE IF NOT EXISTS lockerhub.lockers (
    locker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locker_number VARCHAR(11) NOT NULL UNIQUE,
    floor_id UUID NOT NULL,
    location VARCHAR(20),
    status lockerhub.locker_status NOT NULL DEFAULT 'available',
    x_coordinate INTEGER,
    y_coordinate INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lockers_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE RESTRICT
);

CREATE INDEX idx_lockers_floor_id ON lockerhub.lockers(floor_id);
CREATE INDEX idx_lockers_status ON lockerhub.lockers(status);

-- Create keys table
CREATE TABLE IF NOT EXISTS lockerhub.keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_number VARCHAR(5) NOT NULL UNIQUE,
    locker_id UUID NOT NULL UNIQUE,
    status lockerhub.key_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_keys_locker FOREIGN KEY (locker_id) REFERENCES lockerhub.lockers(locker_id) ON DELETE CASCADE
);

-- Create requests table
CREATE TABLE IF NOT EXISTS lockerhub.requests (
    request_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    floor_id UUID,
    locker_id UUID,
    booking_id UUID,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    request_type lockerhub.request_type NOT NULL,
    justification TEXT,
    status lockerhub.request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID,
    CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_requests_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE SET NULL,
    CONSTRAINT fk_requests_locker FOREIGN KEY (locker_id) REFERENCES lockerhub.lockers(locker_id) ON DELETE SET NULL,
    CONSTRAINT fk_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES lockerhub.users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_requests_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_extension_booking CHECK (
        request_type != 'extension'
        OR booking_id IS NOT NULL
    ),
    CONSTRAINT chk_special_request_floor CHECK (
        request_type != 'special'
        OR floor_id IS NOT NULL
    ),
    CONSTRAINT chk_normal_queued_floor CHECK (
        request_type != 'normal'
        OR status != 'queued'
        OR floor_id IS NOT NULL
    ),
    CONSTRAINT chk_normal_pending_floor_locker CHECK (
        request_type != 'normal'
        OR status != 'pending'
        OR (floor_id IS NOT NULL AND locker_id IS NOT NULL)
    )
);

CREATE INDEX idx_requests_type_status ON lockerhub.requests(request_type, status);

-- Create bookings table
CREATE TABLE IF NOT EXISTS lockerhub.bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    locker_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status lockerhub.booking_status NOT NULL DEFAULT 'upcoming',
    special_request_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_locker FOREIGN KEY (locker_id) REFERENCES lockerhub.lockers(locker_id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_special_request FOREIGN KEY (special_request_id) REFERENCES lockerhub.requests(request_id) ON DELETE SET NULL,
    CONSTRAINT chk_bookings_dates CHECK (end_date >= start_date),
    CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
        locker_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
);

CREATE INDEX idx_bookings_floor_locker_dates ON lockerhub.bookings(locker_id, start_date, end_date);
CREATE INDEX idx_bookings_user_id ON lockerhub.bookings(user_id);

-- Add booking_id FK to requests now that bookings table exists
ALTER TABLE lockerhub.requests
ADD CONSTRAINT fk_requests_booking FOREIGN KEY (booking_id) REFERENCES lockerhub.bookings(booking_id) ON DELETE SET NULL;

-- Create booking_rules table
CREATE TABLE IF NOT EXISTS lockerhub.booking_rules (
    booking_rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type lockerhub.rule_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL,
    CONSTRAINT fk_booking_rules_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_rules_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_booking_rules_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Create floor_queues table
CREATE TABLE IF NOT EXISTS lockerhub.floor_queues (
    floor_queue_id SERIAL PRIMARY KEY,
    floor_id UUID NOT NULL,
    request_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_floor_queues_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE CASCADE,
    CONSTRAINT fk_floor_queues_request FOREIGN KEY (request_id) REFERENCES lockerhub.requests(request_id) ON DELETE CASCADE
);

CREATE INDEX idx_floor_queue_fcfs ON lockerhub.floor_queues (floor_id, created_at);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS lockerhub.audit_logs (
    audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action lockerhub.audit_action NOT NULL,
    entity_type lockerhub.entity_type NOT NULL,
    entity_id UUID,
    reference TEXT,
    old_value JSONB,
    new_value JSONB,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id ON lockerhub.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON lockerhub.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON lockerhub.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON lockerhub.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_audit_date ON lockerhub.audit_logs(audit_date);

-- Create notifications table
CREATE TABLE IF NOT EXISTS lockerhub.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    caption VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN NOT NULL DEFAULT false,
    type lockerhub.notification_type NOT NULL DEFAULT 'info',
    scope lockerhub.notification_scope NOT NULL DEFAULT 'user',
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON lockerhub.notifications(user_id);
CREATE INDEX idx_notifications_read ON lockerhub.notifications(read);
CREATE INDEX idx_notifications_created_at ON lockerhub.notifications(created_at);
CREATE INDEX idx_notifications_user_read ON lockerhub.notifications(user_id, read);
CREATE INDEX idx_notifications_user_read_created ON lockerhub.notifications(user_id, read, created_at DESC);
