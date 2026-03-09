-- Notifications table stores the notification content
-- Many-to-many relationship with users via user_notifications junction table
CREATE TABLE IF NOT EXISTS lockerhub.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    caption VARCHAR(500),
    type lockerhub.notification_type NOT NULL DEFAULT 'info',
    scope lockerhub.notification_scope NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_notifications_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES lockerhub.users(user_id) 
        ON DELETE SET NULL
);

CREATE INDEX idx_notifications_type ON lockerhub.notifications(type);
CREATE INDEX idx_notifications_scope ON lockerhub.notifications(scope);
CREATE INDEX idx_notifications_created_at ON lockerhub.notifications(created_at DESC);
