CREATE TABLE IF NOT EXISTS lockerhub.lockers (
    locker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locker_number VARCHAR(20) NOT NULL UNIQUE,
    floor_id UUID NOT NULL,
    location VARCHAR(30),
    status lockerhub.locker_status NOT NULL DEFAULT 'available',
    x_coordinate INTEGER,
    y_coordinate INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    CONSTRAINT fk_lockers_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_lockers_created_by FOREIGN KEY (created_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_lockers_updated_by FOREIGN KEY (updated_by) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_lockers_floor_id ON lockerhub.lockers(floor_id);
CREATE INDEX idx_lockers_status ON lockerhub.lockers(status);
