CREATE TABLE IF NOT EXISTS lockerhub.floors (
    floor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL UNIQUE
);
