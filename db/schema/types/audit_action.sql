CREATE TYPE lockerhub.audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'handover', 'return');
