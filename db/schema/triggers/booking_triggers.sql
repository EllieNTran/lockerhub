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
