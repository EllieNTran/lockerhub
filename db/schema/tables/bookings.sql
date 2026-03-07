CREATE TABLE IF NOT EXISTS lockerhub.bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    locker_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status lockerhub.booking_status NOT NULL DEFAULT 'upcoming',
    special_request_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES lockerhub.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_locker FOREIGN KEY (locker_id) REFERENCES lockerhub.lockers(locker_id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_special_request FOREIGN KEY (special_request_id) REFERENCES lockerhub.requests(request_id) ON DELETE SET NULL,
    CONSTRAINT chk_bookings_dates CHECK (end_date >= start_date),
    CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
        locker_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
);

CREATE INDEX idx_bookings_floor_locker_dates ON lockerhub.bookings(locker_id, start_date, end_date);
CREATE INDEX idx_bookings_user_id ON lockerhub.bookings(user_id);
