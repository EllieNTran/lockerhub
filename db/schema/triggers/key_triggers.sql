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
