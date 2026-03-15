-- Audit logging function for all entities
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
        v_user_id := OLD.updated_by;
        IF TG_ARGV[0] = 'request' THEN
            v_entity_id := OLD.request_id::TEXT::UUID;
        ELSIF TG_ARGV[0] = 'booking_rule' THEN
            v_entity_id := OLD.booking_rule_id;
        ELSIF TG_ARGV[0] = 'booking' THEN
            v_entity_id := OLD.booking_id;
        ELSIF TG_ARGV[0] = 'locker' THEN
            v_entity_id := OLD.locker_id;
        ELSIF TG_ARGV[0] = 'key' THEN
            v_entity_id := OLD.key_id;
        END IF;
    ELSE
        -- For requests, use reviewed_by; for others, use created_by/updated_by
        IF TG_ARGV[0] = 'request' THEN
            v_user_id := COALESCE(NEW.reviewed_by, NEW.user_id);
            v_entity_id := NEW.request_id::TEXT::UUID;
        ELSIF TG_ARGV[0] = 'booking_rule' THEN
            v_user_id := COALESCE(NEW.updated_by, NEW.created_by);
            v_entity_id := NEW.booking_rule_id;
        ELSIF TG_ARGV[0] = 'booking' THEN
            v_user_id := COALESCE(NEW.updated_by, NEW.created_by);
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
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for booking_rules
DROP TRIGGER IF EXISTS booking_rule_created ON lockerhub.booking_rules;
CREATE TRIGGER booking_rule_created
AFTER INSERT ON lockerhub.booking_rules
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking_rule', 'create');

DROP TRIGGER IF EXISTS booking_rule_updated ON lockerhub.booking_rules;
CREATE TRIGGER booking_rule_updated
AFTER UPDATE ON lockerhub.booking_rules
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION lockerhub.log_audit('booking_rule', 'update');

DROP TRIGGER IF EXISTS booking_rule_deleted ON lockerhub.booking_rules;
CREATE TRIGGER booking_rule_deleted
AFTER DELETE ON lockerhub.booking_rules
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking_rule', 'delete');

-- Triggers for bookings
DROP TRIGGER IF EXISTS booking_created ON lockerhub.bookings;
CREATE TRIGGER booking_created
AFTER INSERT ON lockerhub.bookings
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking', 'create');

DROP TRIGGER IF EXISTS booking_updated ON lockerhub.bookings;
CREATE TRIGGER booking_updated
AFTER UPDATE ON lockerhub.bookings
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.* AND 
      NOT (NEW.status = 'active' AND OLD.status = 'upcoming') AND
      NOT (NEW.status = 'completed' AND OLD.status IN ('active', 'expired')))
EXECUTE FUNCTION lockerhub.log_audit('booking', 'update');

DROP TRIGGER IF EXISTS booking_deleted ON lockerhub.bookings;
CREATE TRIGGER booking_deleted
AFTER DELETE ON lockerhub.bookings
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking', 'delete');

DROP TRIGGER IF EXISTS booking_handover ON lockerhub.bookings;
CREATE TRIGGER booking_handover
AFTER UPDATE ON lockerhub.bookings
FOR EACH ROW
WHEN (NEW.status = 'active' AND OLD.status = 'upcoming')
EXECUTE FUNCTION lockerhub.log_audit('booking', 'handover');

DROP TRIGGER IF EXISTS booking_return ON lockerhub.bookings;
CREATE TRIGGER booking_return
AFTER UPDATE ON lockerhub.bookings
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IN ('active', 'expired'))
EXECUTE FUNCTION lockerhub.log_audit('booking', 'return');

-- Triggers for keys
DROP TRIGGER IF EXISTS key_created ON lockerhub.keys;
CREATE TRIGGER key_created
AFTER INSERT ON lockerhub.keys
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('key', 'create');

DROP TRIGGER IF EXISTS key_updated ON lockerhub.keys;
CREATE TRIGGER key_updated
AFTER UPDATE ON lockerhub.keys
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION lockerhub.log_audit('key', 'update');

DROP TRIGGER IF EXISTS key_deleted ON lockerhub.keys;
CREATE TRIGGER key_deleted
AFTER DELETE ON lockerhub.keys
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('key', 'delete');

-- Triggers for lockers
DROP TRIGGER IF EXISTS locker_created ON lockerhub.lockers;
CREATE TRIGGER locker_created
AFTER INSERT ON lockerhub.lockers
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('locker', 'create');

DROP TRIGGER IF EXISTS locker_updated ON lockerhub.lockers;
CREATE TRIGGER locker_updated
AFTER UPDATE ON lockerhub.lockers
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION lockerhub.log_audit('locker', 'update');

DROP TRIGGER IF EXISTS locker_deleted ON lockerhub.lockers;
CREATE TRIGGER locker_deleted
AFTER DELETE ON lockerhub.lockers
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('locker', 'delete');


-- Triggers for requests
DROP TRIGGER IF EXISTS request_created ON lockerhub.requests;
CREATE TRIGGER request_created
AFTER INSERT ON lockerhub.requests
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('request', 'create');

DROP TRIGGER IF EXISTS request_updated ON lockerhub.requests;
CREATE TRIGGER request_updated
AFTER UPDATE ON lockerhub.requests
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.* AND 
      NOT (NEW.status = 'approved' AND OLD.status = 'pending') AND
      NOT (NEW.status = 'rejected' AND OLD.status = 'pending'))
EXECUTE FUNCTION lockerhub.log_audit('request', 'update');

DROP TRIGGER IF EXISTS request_deleted ON lockerhub.requests;
CREATE TRIGGER request_deleted
AFTER DELETE ON lockerhub.requests
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('request', 'delete');

DROP TRIGGER IF EXISTS request_approved ON lockerhub.requests;
CREATE TRIGGER request_approved
AFTER UPDATE ON lockerhub.requests
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
EXECUTE FUNCTION lockerhub.log_audit('request', 'approve');

DROP TRIGGER IF EXISTS request_rejected ON lockerhub.requests;
CREATE TRIGGER request_rejected
AFTER UPDATE ON lockerhub.requests
FOR EACH ROW
WHEN (NEW.status = 'rejected' AND OLD.status = 'pending')
EXECUTE FUNCTION lockerhub.log_audit('request', 'reject');
