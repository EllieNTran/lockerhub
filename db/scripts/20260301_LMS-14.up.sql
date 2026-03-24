-- Add updated_by column to booking_rules table
ALTER TABLE lockerhub.booking_rules 
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Set updated_by to created_by for existing rows
UPDATE lockerhub.booking_rules 
SET updated_by = created_by 
WHERE updated_by IS NULL;

-- Make updated_by NOT NULL after backfilling
ALTER TABLE lockerhub.booking_rules 
ALTER COLUMN updated_by SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE lockerhub.booking_rules 
ADD CONSTRAINT IF NOT EXISTS fk_booking_rules_updated_by 
FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE;

-- Insert default booking rules
-- Get first admin user for created_by and updated_by
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    SELECT user_id INTO system_user_id 
    FROM lockerhub.users 
    WHERE role = 'admin' 
    LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM lockerhub.booking_rules WHERE rule_type = 'max_duration' AND is_active = true) THEN
        INSERT INTO lockerhub.booking_rules (rule_type, name, value, is_active, created_by, updated_by)
        VALUES ('max_duration', 'Maximum Booking Duration', 3, true, system_user_id, system_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM lockerhub.booking_rules WHERE rule_type = 'max_extension' AND is_active = true) THEN
        INSERT INTO lockerhub.booking_rules (rule_type, name, value, is_active, created_by, updated_by)
        VALUES ('max_extension', 'Maximum Extension', 3, true, system_user_id, system_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM lockerhub.booking_rules WHERE rule_type = 'advance_booking_window' AND is_active = true) THEN
        INSERT INTO lockerhub.booking_rules (rule_type, name, value, is_active, created_by, updated_by)
        VALUES ('advance_booking_window', 'Advance Booking Window', 90, true, system_user_id, system_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM lockerhub.booking_rules WHERE rule_type = 'same_day_bookings' AND is_active = true) THEN
        INSERT INTO lockerhub.booking_rules (rule_type, name, value, is_active, created_by, updated_by)
        VALUES ('same_day_bookings', 'Allow Same-Day Bookings', 1, true, system_user_id, system_user_id);
    END IF;
END $$;

-- Create floor_closures table
CREATE TABLE IF NOT EXISTS lockerhub.floor_closures (
    closure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    CONSTRAINT fk_floor_closures_floor FOREIGN KEY (floor_id) 
        REFERENCES lockerhub.floors(floor_id) ON DELETE CASCADE,
    CONSTRAINT fk_floor_closures_created_by FOREIGN KEY (created_by) 
        REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_floor_closures_dates CHECK (end_date >= start_date)
);
