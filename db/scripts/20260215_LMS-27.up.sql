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
CREATE TYPE lockerhub.floor_status AS ENUM ('open', 'closed');

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

ALTER TABLE lockerhub.floors
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE lockerhub.floors
ADD CONSTRAINT fk_floors_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
ADD CONSTRAINT fk_floors_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE;

-- Add audit columns to lockers table
ALTER TABLE lockerhub.lockers
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

UPDATE lockerhub.lockers
SET 
  created_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1),
  updated_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL OR updated_by IS NULL;

ALTER TABLE lockerhub.lockers
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE lockerhub.lockers
ADD CONSTRAINT fk_lockers_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
ADD CONSTRAINT fk_lockers_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE;

-- Add audit columns to keys table
ALTER TABLE lockerhub.keys
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

UPDATE lockerhub.keys
SET 
  created_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1),
  updated_by = (SELECT user_id FROM lockerhub.users WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL OR updated_by IS NULL;

ALTER TABLE lockerhub.keys
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE lockerhub.keys
ADD CONSTRAINT fk_keys_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
ADD CONSTRAINT fk_keys_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE;

-- Change floor number from INTEGER to VARCHAR(10)
ALTER TABLE lockerhub.floors 
  ALTER COLUMN number TYPE VARCHAR(10);

UPDATE lockerhub.floors 
  SET number = number::VARCHAR(10) 
  WHERE number IS NOT NULL;
