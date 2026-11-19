import { pool } from '../config/db.js';

export const createReservation = async (userID:string, eventID: string, userSeats: string[]) => {
    const client = await pool.connect();
    try {
        if (userSeats.length === 0) {
    throw new Error("At least one seat must be selected");
}

if (new Set(userSeats).size !== userSeats.length) {
    throw new Error("Duplicate seat IDs are not allowed");
}
        await client.query('BEGIN');
        const checkSeatsQuery = await client.query(
            `SELECT id, venue_seat_id, status
FROM event_seats
WHERE event_id = $1
  AND venue_seat_id = ANY($2::BIGINT[])
ORDER BY id
FOR UPDATE;`,
            [eventID, userSeats]
        );

        if (checkSeatsQuery.rows.length !== userSeats.length) {
            throw new Error('One or more seats selected doesnot exist for this event');
        }
        const allAvailable = checkSeatsQuery.rows.every(
    (seat) => seat.status === "available"
);

if (!allAvailable) {
    throw new Error("One or more seats are unavailable");
}
        const reservationEntry = await client.query(
            `INSERT INTO reservations(
    user_id,
    event_id,
    status,
    expires_at
)
VALUES (
    $1,
    $2,
    'pending',
    NOW() + INTERVAL '10 minutes'
)
RETURNING id,expires_at;`, [userID, eventID]);
        

        const reservationId = reservationEntry.rows[0].id;
        const expires_at = reservationEntry.rows[0].expires_at;

        const updateSeatsQuery = await client.query(`UPDATE event_seats
SET
    status = 'reserved',
    reservation_id = $1,
    hold_expires_at = $2
WHERE event_id = $3
  AND venue_seat_id = ANY($4::BIGINT[])
RETURNING id, venue_seat_id;`, [reservationId, expires_at, eventID, userSeats]);
        
        if (updateSeatsQuery.rows.length !== userSeats.length) {
    throw new Error("Not all requested seats were reserved");
}
        await client.query('COMMIT');
        return {
    reservationId,
    expiresAt: reservationEntry.rows[0].expires_at
};
    }
    catch (error) {
        try {
            await client.query('ROLLBACK');
        }
        catch (rollbackError) {
            console.error('Error occurred while rolling back transaction:', rollbackError);
        }
        throw error;
    } finally {
        client.release();
    }
}