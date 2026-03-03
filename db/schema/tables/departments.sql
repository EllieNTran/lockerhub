CREATE TABLE IF NOT EXISTS lockerhub.departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    floor_id UUID NOT NULL,
    CONSTRAINT fk_departments_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE RESTRICT
);

CREATE INDEX idx_departments_floor_id ON lockerhub.departments(floor_id);
CREATE INDEX idx_departments_name ON lockerhub.departments(name);
