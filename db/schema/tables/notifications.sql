-- Notifications table stores the notification content
-- user_notifications table tracks which users have seen/read each notification
CREATE TABLE IF NOT EXISTS lockerhub.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    admin_title VARCHAR(255) NOT NULL,
    caption VARCHAR(500),
    type lockerhub.notification_type NOT NULL DEFAULT 'info',
    entity_type lockerhub.entity_type,
    scope lockerhub.notification_scope NOT NULL DEFAULT 'user',
    target_department_id UUID,
    target_floor_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_notifications_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES lockerhub.users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_notifications_target_department 
        FOREIGN KEY (target_department_id) 
        REFERENCES lockerhub.departments(department_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_target_floor 
        FOREIGN KEY (target_floor_id) 
        REFERENCES lockerhub.floors(floor_id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_notifications_type ON lockerhub.notifications(type);
CREATE INDEX idx_notifications_scope ON lockerhub.notifications(scope);
CREATE INDEX idx_notifications_created_at ON lockerhub.notifications(created_at DESC);
CREATE INDEX idx_notifications_target_department ON lockerhub.notifications(target_department_id);
CREATE INDEX idx_notifications_target_floor ON lockerhub.notifications(target_floor_id);
