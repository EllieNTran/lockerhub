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
