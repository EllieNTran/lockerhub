CREATE TABLE IF NOT EXISTS lockerhub.floor_queues (
    floor_queue_id SERIAL PRIMARY KEY,
    floor_id UUID NOT NULL,
    request_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_floor_queues_floor FOREIGN KEY (floor_id) REFERENCES lockerhub.floors(floor_id) ON DELETE CASCADE,
    CONSTRAINT fk_floor_queues_request FOREIGN KEY (request_id) REFERENCES lockerhub.requests(request_id) ON DELETE CASCADE
);

CREATE INDEX idx_floor_queue_fcfs ON lockerhub.floor_queues (floor_id, created_at);
