-- Audit logging function for all entities
CREATE OR REPLACE FUNCTION lockerhub.log_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_entity_id UUID;
    v_reference TEXT;
    v_locker_number VARCHAR(11);
    v_staff_number CHAR(8);
    v_request_type_label TEXT;
BEGIN
    -- Determine user_id based on operation
    IF TG_OP = 'DELETE' THEN
        v_user_id := OLD.updated_by;
        v_entity_id := CASE TG_ARGV[0]
            WHEN 'request' THEN OLD.request_id::TEXT::UUID
            ELSE COALESCE(OLD.booking_rule_id, OLD.booking_id, OLD.locker_id, OLD.key_id)
        END;
    ELSE
        v_user_id := COALESCE(NEW.updated_by, NEW.created_by, NEW.reviewed_by, NEW.user_id);
        v_entity_id := CASE TG_ARGV[0]
            WHEN 'request' THEN NEW.request_id::TEXT::UUID
            ELSE COALESCE(NEW.booking_rule_id, NEW.booking_id, NEW.locker_id, NEW.key_id)
        END;
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
CREATE TRIGGER booking_rule_created
AFTER INSERT ON lockerhub.booking_rules
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking_rule', 'create');

CREATE TRIGGER booking_rule_updated
AFTER UPDATE ON lockerhub.booking_rules
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION lockerhub.log_audit('booking_rule', 'update');

CREATE TRIGGER booking_rule_deleted
AFTER DELETE ON lockerhub.booking_rules
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking_rule', 'delete');

-- Triggers for bookings
CREATE TRIGGER booking_created
AFTER INSERT ON lockerhub.bookings
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking', 'create');

CREATE TRIGGER booking_updated
AFTER UPDATE ON lockerhub.bookings
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.* AND 
      NOT (NEW.status = 'active' AND OLD.status = 'upcoming') AND
      NOT (NEW.status = 'completed' AND OLD.status IN ('active', 'expired')))
EXECUTE FUNCTION lockerhub.log_audit('booking', 'update');

CREATE TRIGGER booking_deleted
AFTER DELETE ON lockerhub.bookings
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('booking', 'delete');

CREATE TRIGGER booking_handover
AFTER UPDATE ON lockerhub.bookings
FOR EACH ROW
WHEN (NEW.status = 'active' AND OLD.status = 'upcoming')
EXECUTE FUNCTION lockerhub.log_audit('booking', 'handover');

CREATE TRIGGER booking_return
AFTER UPDATE ON lockerhub.bookings
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IN ('active', 'expired'))
EXECUTE FUNCTION lockerhub.log_audit('booking', 'return');

-- Triggers for keys
CREATE TRIGGER key_created
AFTER INSERT ON lockerhub.keys
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('key', 'create');

CREATE TRIGGER key_updated
AFTER UPDATE ON lockerhub.keys
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION lockerhub.log_audit('key', 'update');

CREATE TRIGGER key_deleted
AFTER DELETE ON lockerhub.keys
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('key', 'delete');

-- Triggers for lockers
CREATE TRIGGER locker_created
AFTER INSERT ON lockerhub.lockers
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('locker', 'create');

CREATE TRIGGER locker_updated
AFTER UPDATE ON lockerhub.lockers
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION lockerhub.log_audit('locker', 'update');

CREATE TRIGGER locker_deleted
AFTER DELETE ON lockerhub.lockers
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('locker', 'delete');


-- Triggers for requests
CREATE TRIGGER request_created
AFTER INSERT ON lockerhub.requests
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('request', 'create');

CREATE TRIGGER request_updated
AFTER UPDATE ON lockerhub.requests
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.* AND 
      NOT (NEW.status = 'approved' AND OLD.status = 'pending') AND
      NOT (NEW.status = 'rejected' AND OLD.status = 'pending'))
EXECUTE FUNCTION lockerhub.log_audit('request', 'update');

CREATE TRIGGER request_deleted
AFTER DELETE ON lockerhub.requests
FOR EACH ROW
EXECUTE FUNCTION lockerhub.log_audit('request', 'delete');

CREATE TRIGGER request_approved
AFTER UPDATE ON lockerhub.requests
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
EXECUTE FUNCTION lockerhub.log_audit('request', 'approve');

CREATE TRIGGER request_rejected
AFTER UPDATE ON lockerhub.requests
FOR EACH ROW
WHEN (NEW.status = 'rejected' AND OLD.status = 'pending')
EXECUTE FUNCTION lockerhub.log_audit('request', 'reject');
