CREATE TABLE IF NOT EXISTS lockerhub.capabilities (
    capability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE INDEX idx_capabilities_name ON lockerhub.capabilities(name);
