ALTER TABLE lockerhub.floor_closures ALTER COLUMN end_date DROP NOT NULL;
ALTER TABLE lockerhub.floor_closures ALTER COLUMN reason TYPE VARCHAR(100);
