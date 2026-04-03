ALTER TABLE lockerhub.bookings DROP CONSTRAINT no_overlapping_bookings;

-- Add new constraint that only applies to non-cancelled/completed bookings
ALTER TABLE lockerhub.bookings ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    locker_id WITH =,
    daterange(start_date, COALESCE(end_date, 'infinity'::date) + 1, '[)') WITH &&
) WHERE (status NOT IN ('cancelled', 'completed'));
