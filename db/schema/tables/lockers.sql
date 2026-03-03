CREATE TABLE IF NOT EXISTS lockerhub.lockers (
    locker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locker_number VARCHAR(11) NOT NULL UNIQUE,
    floor_id UUID NOT NULL,
    status lockerhub.locker_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lockers_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE RESTRICT
);

CREATE INDEX idx_lockers_floor_id ON lockerhub.lockers(floor_id);
CREATE INDEX idx_lockers_status ON lockerhub.lockers(status);
