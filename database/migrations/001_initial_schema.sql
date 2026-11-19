
CREATE INDEX idx_venue_seats_venue
ON venue_seats(venue_id);

CREATE INDEX idx_event_seats_event_status
ON event_seats(event_id, status);


CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE venue_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    section VARCHAR(100) NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,

    CONSTRAINT unique_venue_seat
    UNIQUE (venue_id, section, row_label, seat_number),

    CONSTRAINT unique_seat_venue_pair
    UNIQUE (id, venue_id)
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    description TEXT,

    CONSTRAINT unique_event_venue_pair
    UNIQUE (id, venue_id)
);

CREATE TABLE event_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    venue_seat_id UUID NOT NULL,
    venue_id UUID NOT NULL,

    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'sold')),

    CONSTRAINT unique_event_seat
    UNIQUE (event_id, venue_seat_id),

    CONSTRAINT fk_event
    FOREIGN KEY (event_id, venue_id)
    REFERENCES events(id, venue_id),

    CONSTRAINT fk_venue_seat
    FOREIGN KEY (venue_seat_id, venue_id)
    REFERENCES venue_seats(id, venue_id)
);
