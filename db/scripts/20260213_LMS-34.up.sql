-- Add target_department_id and target_floor_id to notifications table
-- This allows efficient scoping without creating user_notifications rows for department/floor/global notifications
ALTER TABLE lockerhub.notifications 
ADD COLUMN target_department_id UUID,
ADD COLUMN target_floor_id UUID,
ADD COLUMN admin_title VARCHAR(255) NOT NULL;

ALTER TABLE lockerhub.notifications
ADD CONSTRAINT fk_notifications_target_department 
    FOREIGN KEY (target_department_id) 
    REFERENCES lockerhub.departments(department_id) 
    ON DELETE CASCADE;

ALTER TABLE lockerhub.notifications
ADD CONSTRAINT fk_notifications_target_floor 
    FOREIGN KEY (target_floor_id) 
    REFERENCES lockerhub.floors(floor_id) 
    ON DELETE CASCADE;

CREATE INDEX idx_notifications_target_department ON lockerhub.notifications(target_department_id);
CREATE INDEX idx_notifications_target_floor ON lockerhub.notifications(target_floor_id);
