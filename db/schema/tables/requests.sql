CREATE TABLE IF NOT EXISTS lockerhub.requests (
    request_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    floor_id UUID,
    locker_id UUID,
    booking_id UUID,
    start_date DATE NOT NULL,
    end_date DATE,
    request_type lockerhub.request_type NOT NULL,
    justification TEXT,
    status lockerhub.request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID,
    reason TEXT,
    CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_requests_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE SET NULL,
    CONSTRAINT fk_requests_locker FOREIGN KEY (locker_id) REFERENCES lockerhub.lockers(locker_id) ON DELETE SET NULL,
    CONSTRAINT fk_requests_booking FOREIGN KEY (booking_id) REFERENCES lockerhub.bookings(booking_id) ON DELETE SET NULL,
    CONSTRAINT fk_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES lockerhub.users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_requests_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_extension_booking CHECK (
        request_type != 'extension'
        OR booking_id IS NOT NULL
    ),
    CONSTRAINT chk_special_request_floor CHECK (
        request_type != 'special'
        OR floor_id IS NOT NULL
    ),
    CONSTRAINT chk_normal_queued_floor CHECK (
        request_type != 'normal'
        OR status != 'queued'
        OR floor_id IS NOT NULL
    ),
    CONSTRAINT chk_normal_pending_floor_locker CHECK (
        request_type != 'normal'
        OR status != 'pending'
        OR (floor_id IS NOT NULL AND locker_id IS NOT NULL)
    )
);

CREATE INDEX idx_requests_type_status ON lockerhub.requests(request_type, status);
