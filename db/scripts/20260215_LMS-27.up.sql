-- Add entity_type column to notifications table
ALTER TABLE lockerhub.notifications 
ADD COLUMN IF NOT EXISTS entity_type lockerhub.entity_type;

CREATE INDEX IF NOT EXISTS idx_notifications_entity_type 
ON lockerhub.notifications(entity_type);

-- Increase varchar limits for real-world data
ALTER TABLE lockerhub.lockers
ALTER COLUMN locker_number TYPE VARCHAR(20),
ALTER COLUMN location TYPE VARCHAR(30);

ALTER TABLE lockerhub.keys
ALTER COLUMN key_number TYPE VARCHAR(6);

-- Update floors table to include status and audit fields
DO $$ BEGIN
    CREATE TYPE lockerhub.floor_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE lockerhub.floors 
ADD COLUMN IF NOT EXISTS status lockerhub.floor_status NOT NULL DEFAULT 'open',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_by UUID;

UPDATE lockerhub.floors
SET 
  created_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1),
  updated_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL OR updated_by IS NULL;

DO $$ BEGIN
    ALTER TABLE lockerhub.floors
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN updated_by SET NOT NULL;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE lockerhub.floors
    ADD CONSTRAINT fk_floors_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_floors_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add audit columns to lockers table
ALTER TABLE lockerhub.lockers
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

UPDATE lockerhub.lockers
SET 
  created_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1),
  updated_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL OR updated_by IS NULL;

DO $$ BEGIN
    ALTER TABLE lockerhub.lockers
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN updated_by SET NOT NULL;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE lockerhub.lockers
    ADD CONSTRAINT fk_lockers_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_lockers_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add audit columns to keys table
ALTER TABLE lockerhub.keys
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

UPDATE lockerhub.keys
SET 
  created_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1),
  updated_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL OR updated_by IS NULL;

DO $$ BEGIN
    ALTER TABLE lockerhub.keys
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN updated_by SET NOT NULL;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE lockerhub.keys
    ADD CONSTRAINT fk_keys_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_keys_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Change floor number from INTEGER to VARCHAR(10)
-- Note: This column may have already been renamed to floor_number in 20260213_LMS-34.up.sql
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'lockerhub' 
        AND table_name = 'floors' 
        AND column_name = 'number'
        AND data_type != 'character varying'
    ) THEN
        ALTER TABLE lockerhub.floors 
          ALTER COLUMN number TYPE VARCHAR(10);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'lockerhub' 
        AND table_name = 'floors' 
        AND column_name = 'floor_number'
        AND data_type != 'character varying'
    ) THEN
        ALTER TABLE lockerhub.floors 
          ALTER COLUMN floor_number TYPE VARCHAR(10);
    END IF;
END $$;
