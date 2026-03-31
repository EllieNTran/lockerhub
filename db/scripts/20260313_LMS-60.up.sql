-- Update audit logging for bookings and key handover/return
-- 1. Add created_by/updated_by to bookings table
-- 2. Update booking audit to use admin ID for manual bookings
-- 3. Change key handover and return audit to log as 'key' entity (not 'booking')
-- 4. Allow updated_by to be NULL for system-initiated updates

-- Add created_by and updated_by columns to bookings table
ALTER TABLE lockerhub.bookings 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE lockerhub.bookings
ADD CONSTRAINT fk_bookings_created_by 
    FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_bookings_updated_by 
    FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE SET NULL;

UPDATE lockerhub.bookings 
SET created_by = user_id, updated_by = user_id
WHERE created_by IS NULL;

-- Note: Removed separate key handover/return triggers - key updates will be logged by key_updated trigger
DROP TRIGGER IF EXISTS booking_updated ON lockerhub.bookings;
DROP TRIGGER IF EXISTS booking_handover ON lockerhub.bookings;
DROP TRIGGER IF EXISTS booking_return ON lockerhub.bookings;

CREATE TRIGGER booking_updated
AFTER UPDATE ON lockerhub.bookings
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION lockerhub.log_audit('booking', 'update');

-- Note: Key updates will detect handover/return and log with appropriate action type
CREATE OR REPLACE FUNCTION lockerhub.log_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_entity_id UUID;
    v_reference TEXT;
    v_locker_number VARCHAR(20);
    v_staff_number CHAR(8);
    v_request_type_label TEXT;
    v_old_value_json JSONB;
    v_new_value_json JSONB;
    v_action TEXT;
BEGIN
    v_old_value_json := CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN row_to_json(OLD)::JSONB ELSE NULL END;
    v_new_value_json := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::JSONB ELSE NULL END;

    v_action := TG_ARGV[1];

    -- Determine user_id and entity_id based on operation and entity type
    IF TG_OP = 'DELETE' THEN
        -- For bookings, use updated_by (admin who deleted); for others, use updated_by
        IF TG_ARGV[0] = 'booking' THEN
            v_user_id := OLD.updated_by;
            v_entity_id := OLD.booking_id;
        ELSIF TG_ARGV[0] = 'request' THEN
            v_user_id := OLD.user_id; -- requests don't have updated_by, use user_id
            v_entity_id := NULL; -- request_id is INTEGER, not UUID
        ELSIF TG_ARGV[0] = 'booking_rule' THEN
            v_user_id := OLD.updated_by;
            v_entity_id := OLD.booking_rule_id;
        ELSIF TG_ARGV[0] = 'locker' THEN
            v_user_id := OLD.updated_by;
            v_entity_id := OLD.locker_id;
        ELSIF TG_ARGV[0] = 'key' THEN
            v_user_id := OLD.updated_by;
            v_entity_id := OLD.key_id;
        END IF;
    ELSE
        -- For requests, use reviewed_by; for bookings, use user_id; for others, use created_by/updated_by
        IF TG_ARGV[0] = 'request' THEN
            v_user_id := COALESCE(NEW.reviewed_by, NEW.user_id);
            v_entity_id := NULL; -- request_id is INTEGER, not UUID
        ELSIF TG_ARGV[0] = 'booking_rule' THEN
            v_user_id := CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE NEW.updated_by END;
            v_entity_id := NEW.booking_rule_id;
        ELSIF TG_ARGV[0] = 'booking' THEN
            -- Use created_by for INSERT, updated_by for UPDATE (tracks admin actions)
            v_user_id := CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE NEW.updated_by END;
            v_entity_id := NEW.booking_id;
        ELSIF TG_ARGV[0] = 'locker' THEN
            v_user_id := CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE NEW.updated_by END;
            v_entity_id := NEW.locker_id;
        ELSIF TG_ARGV[0] = 'key' THEN
            v_user_id := CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE NEW.updated_by END;
            v_entity_id := NEW.key_id;
            
            -- Detect handover/return based on status changes
            IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'keys' THEN
                IF OLD.status = 'awaiting_handover' AND NEW.status = 'with_employee' THEN
                    v_action := 'handover';
                ELSIF OLD.status IN ('with_employee', 'awaiting_return') AND NEW.status = 'available' THEN
                    v_action := 'return';
                END IF;
            END IF;
        END IF;
    END IF;

    -- Generate reference based on entity type
    -- booking_rule: rule type
    -- booking: locker number
    -- request: [staff_number] - [permanent/extension]
    -- key: key number
    -- locker: locker number
    CASE TG_ARGV[0]
        WHEN 'booking_rule' THEN
            v_reference := COALESCE(NEW.rule_type::TEXT, OLD.rule_type::TEXT);
            
        WHEN 'booking' THEN
            SELECT locker_number INTO v_locker_number
            FROM lockerhub.lockers
            WHERE locker_id = COALESCE(NEW.locker_id, OLD.locker_id);
            v_reference := v_locker_number;
            
        WHEN 'request' THEN
            SELECT staff_number INTO v_staff_number
            FROM lockerhub.users
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
            
            v_request_type_label := CASE 
                WHEN COALESCE(NEW.request_type, OLD.request_type)::TEXT = 'special' THEN
                    CASE WHEN COALESCE(NEW.end_date, OLD.end_date) IS NULL THEN 'permanent' ELSE 'long-term' END
                WHEN COALESCE(NEW.request_type, OLD.request_type)::TEXT = 'extension' THEN 'extension'
                ELSE 'normal'
            END;
            
            v_reference := v_staff_number || ' - ' || v_request_type_label;
            
        WHEN 'key' THEN
            v_reference := COALESCE(NEW.key_number, OLD.key_number);
            
        WHEN 'locker' THEN
            v_reference := COALESCE(NEW.locker_number, OLD.locker_number);
            
        ELSE
            v_reference := NULL;
    END CASE;

    INSERT INTO lockerhub.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        reference,
        old_value,
        new_value
    ) VALUES (
        v_user_id,
        v_action::lockerhub.audit_action,
        TG_ARGV[0]::lockerhub.entity_type,
        v_entity_id,
        v_reference,
        v_old_value_json,
        v_new_value_json
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Allow updated_by to be NULL for system-initiated updates (scheduled jobs)
ALTER TABLE lockerhub.lockers 
ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE lockerhub.keys 
ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE lockerhub.floors 
ALTER COLUMN updated_by DROP NOT NULL;

-- Change from inclusive end '[' to exclusive end ')' and add 1 day to end_date
-- This allows a booking to start on the day another ends
ALTER TABLE lockerhub.bookings
DROP CONSTRAINT no_overlapping_bookings;

ALTER TABLE lockerhub.bookings
ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    locker_id WITH =,
    daterange(start_date, COALESCE(end_date, 'infinity'::date) + 1, '[)') WITH &&
);
