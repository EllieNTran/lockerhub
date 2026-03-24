CREATE TABLE IF NOT EXISTS lockerhub.floor_closures (
    closure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    CONSTRAINT fk_floor_closures_floor FOREIGN KEY (floor_id) 
        REFERENCES lockerhub.floors(floor_id) ON DELETE CASCADE,
    CONSTRAINT fk_floor_closures_created_by FOREIGN KEY (created_by) 
        REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_floor_closures_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
