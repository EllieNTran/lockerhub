CREATE TABLE IF NOT EXISTS lockerhub.keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_number VARCHAR(5) NOT NULL UNIQUE,
    locker_id UUID NOT NULL UNIQUE,
    status lockerhub.key_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_keys_locker FOREIGN KEY (locker_id) REFERENCES lockerhub.lockers(locker_id) ON DELETE CASCADE
);
