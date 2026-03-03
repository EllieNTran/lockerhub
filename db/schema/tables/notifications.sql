CREATE TABLE IF NOT EXISTS lockerhub.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    caption VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN NOT NULL DEFAULT false,
    type lockerhub.notification_type NOT NULL DEFAULT 'info',
    scope lockerhub.notification_scope NOT NULL DEFAULT 'user',
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON lockerhub.notifications(user_id);
CREATE INDEX idx_notifications_read ON lockerhub.notifications(read);
CREATE INDEX idx_notifications_created_at ON lockerhub.notifications(created_at);
CREATE INDEX idx_notifications_user_read ON lockerhub.notifications(user_id, read);
CREATE INDEX idx_notifications_user_read_created ON lockerhub.notifications(user_id, read, created_at DESC);
