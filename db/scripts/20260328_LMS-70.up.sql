-- Drop incorrect constraint that allowed normal requests to be pending
ALTER TABLE lockerhub.requests
DROP CONSTRAINT IF EXISTS chk_normal_pending_floor_locker;

-- Add correct constraint that prevents normal requests from being pending
ALTER TABLE lockerhub.requests
ADD CONSTRAINT chk_normal_not_pending CHECK (
    request_type != 'normal'
    OR status != 'pending'
);
