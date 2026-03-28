-- Fix audit trigger to use OLD.user_id instead of OLD.updated_by for request deletions
-- The requests table doesn't have an updated_by column

CREATE OR REPLACE FUNCTION lockerhub.log_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_entity_id UUID;
    v_reference TEXT;
    v_locker_number VARCHAR(20);
    v_staff_number CHAR(8);
    v_request_type_label TEXT;
BEGIN
    -- Determine user_id and entity_id based on operation and entity type
    IF TG_OP = 'DELETE' THEN
        -- For bookings, use user_id; for others, use updated_by
        IF TG_ARGV[0] = 'booking' THEN
            v_user_id := OLD.user_id;
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
            v_user_id := COALESCE(NEW.updated_by, NEW.created_by);
            v_entity_id := NEW.booking_rule_id;
        ELSIF TG_ARGV[0] = 'booking' THEN
            v_user_id := NEW.user_id;
            v_entity_id := NEW.booking_id;
        ELSIF TG_ARGV[0] = 'locker' THEN
            v_user_id := COALESCE(NEW.updated_by, NEW.created_by);
            v_entity_id := NEW.locker_id;
        ELSIF TG_ARGV[0] = 'key' THEN
            v_user_id := COALESCE(NEW.updated_by, NEW.created_by);
            v_entity_id := NEW.key_id;
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
            
            v_request_type_label := CASE COALESCE(NEW.request_type, OLD.request_type)::TEXT
                WHEN 'special' THEN 'permanent'
                WHEN 'extension' THEN 'extension'
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
        TG_ARGV[1]::lockerhub.audit_action,
        TG_ARGV[0]::lockerhub.entity_type,
        v_entity_id,
        v_reference,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD.*) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW.*) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
