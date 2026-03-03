CREATE TABLE IF NOT EXISTS lockerhub.audit_logs (
    audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action lockerhub.audit_action NOT NULL,
    entity_type lockerhub.entity_type NOT NULL,
    entity_id UUID,
    reference TEXT,
    old_value JSONB,
    new_value JSONB,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id ON lockerhub.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON lockerhub.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON lockerhub.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON lockerhub.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_audit_date ON lockerhub.audit_logs(audit_date);
