-- Create office enum type
CREATE TYPE lockerhub.office AS ENUM (
    '15 Canada Square',
    'Malta',
    'Nottingham',
    'Watford',
    'Birmingham',
    'Leeds',
    'Reading',
    'Manchester',
    'Liverpool',
    'Glasgow 319',
    'Bristol Queen Square',
    'Edinburgh',
    'Newcastle upon Tyne',
    'South Coast - Southampton',
    'Gibraltar',
    'Gatwick',
    'Canada Square IFRG',
    'Cambridge',
    'Cardiff',
    'Milton Keynes',
    'Aberdeen',
    '15 Canada Square EMA',
    'Plymouth',
    'Overseas',
    'Zurich',
    'Glasgow Tax CoE',
    'Bangalore (KGS)',
    'New Delhi (KRC)',
    'Spain'
);

-- Alter users table to support pre-registration and password reset functionality
ALTER TABLE lockerhub.users 
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE lockerhub.users
  ADD COLUMN IF NOT EXISTS office lockerhub.office,
  ADD COLUMN IF NOT EXISTS is_pre_registered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_activated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
  ON lockerhub.users(password_reset_token) 
  WHERE password_reset_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_pre_registered 
  ON lockerhub.users(is_pre_registered) 
  WHERE is_pre_registered = TRUE;

-- Create user_notifications junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS lockerhub.user_notifications (
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, notification_id),
    CONSTRAINT fk_user_notifications_user 
        FOREIGN KEY (user_id) 
        REFERENCES lockerhub.users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_notifications_notification 
        FOREIGN KEY (notification_id) 
        REFERENCES lockerhub.notifications(notification_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON lockerhub.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification ON lockerhub.user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON lockerhub.user_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON lockerhub.user_notifications(user_id) WHERE read = FALSE;

-- Migrate existing notification data to junction table
INSERT INTO lockerhub.user_notifications (user_id, notification_id, read, read_at, created_at)
SELECT 
    user_id,
    notification_id,
    read,
    CASE WHEN read = TRUE THEN created_at ELSE NULL END as read_at,
    created_at
FROM lockerhub.notifications
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, notification_id) DO NOTHING;

-- Alter notifications table structure
ALTER TABLE lockerhub.notifications 
    DROP COLUMN IF EXISTS user_id,
    DROP COLUMN IF EXISTS read;

ALTER TABLE lockerhub.notifications 
    ADD COLUMN IF NOT EXISTS created_by UUID;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_notifications_created_by'
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE lockerhub.notifications
        ADD CONSTRAINT fk_notifications_created_by 
            FOREIGN KEY (created_by) 
            REFERENCES lockerhub.users(user_id) 
            ON DELETE SET NULL;
    END IF;
END $$;

DROP INDEX IF EXISTS lockerhub.idx_notifications_user_id;
DROP INDEX IF EXISTS lockerhub.idx_notifications_read;
DROP INDEX IF EXISTS lockerhub.idx_notifications_user_read;
DROP INDEX IF EXISTS lockerhub.idx_notifications_user_read_created;

CREATE INDEX IF NOT EXISTS idx_notifications_type ON lockerhub.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_scope ON lockerhub.notifications(scope);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON lockerhub.notifications(created_at DESC);

-- Create capability table
CREATE TABLE IF NOT EXISTS lockerhub.capabilities (
    capability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE INDEX idx_capabilities_name ON lockerhub.capabilities(name);

-- Add capability_id to departments table
ALTER TABLE lockerhub.departments
    ADD COLUMN IF NOT EXISTS capability_id UUID;

-- Make floor_id nullable
ALTER TABLE lockerhub.departments
    ALTER COLUMN floor_id DROP NOT NULL;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_departments_capabilities'
        AND table_name = 'departments'
    ) THEN
        ALTER TABLE lockerhub.departments
        ADD CONSTRAINT fk_departments_capabilities 
            FOREIGN KEY (capability_id) 
            REFERENCES lockerhub.capabilities(capability_id) 
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_capability_id ON lockerhub.departments(capability_id);

UPDATE lockerhub.users 
SET account_activated = TRUE, is_pre_registered = FALSE
WHERE password_hash IS NOT NULL;
