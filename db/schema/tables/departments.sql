CREATE TABLE IF NOT EXISTS lockerhub.departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    floor_id UUID,
    capability_id UUID,
    CONSTRAINT fk_departments_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_departments_capabilities FOREIGN KEY (capability_id) REFERENCES lockerhub.capabilities(capability_id) ON DELETE SET NULL
);

CREATE INDEX idx_departments_floor_id ON lockerhub.departments(floor_id);
CREATE INDEX idx_departments_name ON lockerhub.departments(name);
CREATE INDEX idx_departments_capability_id ON lockerhub.departments(capability_id);
