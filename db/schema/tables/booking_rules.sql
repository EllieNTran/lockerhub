CREATE TABLE IF NOT EXISTS lockerhub.booking_rules (
    booking_rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type lockerhub.rule_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_rules_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_booking_rules_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
