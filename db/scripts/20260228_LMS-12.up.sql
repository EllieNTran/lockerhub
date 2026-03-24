ALTER TYPE lockerhub.request_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE lockerhub.request_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TABLE lockerhub.requests ADD COLUMN IF NOT EXISTS reason TEXT;
