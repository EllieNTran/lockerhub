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
