CREATE TABLE IF NOT EXISTS lockerhub.keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_number VARCHAR(6) NOT NULL UNIQUE,
    locker_id UUID NOT NULL UNIQUE,
    status lockerhub.key_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    CONSTRAINT fk_keys_locker FOREIGN KEY (locker_id) REFERENCES lockerhub.lockers(locker_id) ON DELETE CASCADE,
    CONSTRAINT fk_keys_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_keys_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE
);
