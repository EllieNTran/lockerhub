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
