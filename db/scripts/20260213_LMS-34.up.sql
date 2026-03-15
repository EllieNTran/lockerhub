-- Add target_department_id and target_floor_id to notifications table
-- This allows efficient scoping without creating user_notifications rows for department/floor/global notifications
DO $$ BEGIN
    ALTER TABLE lockerhub.notifications 
    ADD COLUMN target_department_id UUID,
    ADD COLUMN target_floor_id UUID,
    ADD COLUMN admin_title VARCHAR(255) NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE lockerhub.notifications
    ADD CONSTRAINT fk_notifications_target_department 
        FOREIGN KEY (target_department_id) 
        REFERENCES lockerhub.departments(department_id) 
        ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE lockerhub.notifications
    ADD CONSTRAINT fk_notifications_target_floor 
        FOREIGN KEY (target_floor_id) 
        REFERENCES lockerhub.floors(floor_id) 
        ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_target_department ON lockerhub.notifications(target_department_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_floor ON lockerhub.notifications(target_floor_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'lockerhub' 
        AND table_name = 'floors' 
        AND column_name = 'number'
    ) THEN
        ALTER TABLE lockerhub.floors 
        RENAME COLUMN number TO floor_number;
    END IF;
END $$;
