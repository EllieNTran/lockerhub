CREATE TABLE IF NOT EXISTS lockerhub.user_notifications (
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, notification_id),
    CONSTRAINT fk_user_notifications_user 
        FOREIGN KEY (user_id) 
        REFERENCES lockerhub.users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_notifications_notification 
        FOREIGN KEY (notification_id) 
        REFERENCES lockerhub.notifications(notification_id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_user_notifications_user ON lockerhub.user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification ON lockerhub.user_notifications(notification_id);
CREATE INDEX idx_user_notifications_user_read ON lockerhub.user_notifications(user_id, read);
CREATE INDEX idx_user_notifications_user_unread ON lockerhub.user_notifications(user_id) WHERE read = FALSE;
