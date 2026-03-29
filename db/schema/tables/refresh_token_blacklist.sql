CREATE TABLE IF NOT EXISTS lockerhub.refresh_token_blacklist (
    token_hash VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_blacklist_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blacklist_expires_at 
  ON lockerhub.refresh_token_blacklist(expires_at);

CREATE INDEX IF NOT EXISTS idx_blacklist_user_id 
  ON lockerhub.refresh_token_blacklist(user_id);
