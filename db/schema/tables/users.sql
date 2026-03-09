CREATE TABLE IF NOT EXISTS lockerhub.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    staff_number CHAR(8) UNIQUE,
    department_id UUID,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    office lockerhub.office,
    is_pre_registered BOOLEAN DEFAULT FALSE,
    account_activated BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    role lockerhub.user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES lockerhub.departments(department_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
  ON lockerhub.users(password_reset_token) 
  WHERE password_reset_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_pre_registered 
  ON lockerhub.users(is_pre_registered) 
  WHERE is_pre_registered = TRUE;
